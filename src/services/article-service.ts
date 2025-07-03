import { ArticleApi } from '../api/articles.js';
import {
  ArticleInfo,
  EnhancedArticleInfo,
  ContentQuality,
  Recommendation,
  UserInfo,
  Tag,
  TagTrend,
  CategoryTrend,
  HotnessTrend,
  ArticleListParams,
} from '../types/index.js';
import { articleCache } from '../utils/cache.js';
import { getConfig } from '../utils/config.js';

export class ArticleService {
  private config = getConfig();
  private articleApi: ArticleApi;

  constructor() {
    this.articleApi = new ArticleApi();
  }

  /**
   * 获取文章列表
   */
  async getArticles(
    sortType: number = 200,
    limit: number = 20,
    categoryId?: string,
    includeQualityScore: boolean = false
  ): Promise<{
    articles: EnhancedArticleInfo[];
    total: number;
    cursor?: string;
    has_more: boolean;
  }> {
    const cacheKey = `articles:${sortType}:${limit}:${categoryId}:${includeQualityScore}`;

    const cachedResult = articleCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const params: ArticleListParams = {
      sort_type: sortType,
      limit,
    };
    if (categoryId) {
      params.category_id = categoryId;
    }

    const result = await this.articleApi.getArticleList(params);

    const enhancedArticles = result.articles.map(
      (articleInfo: ArticleInfo): EnhancedArticleInfo => {
        const enhanced: EnhancedArticleInfo = { ...articleInfo };

        if (includeQualityScore) {
          try {
            enhanced.quality_score = this.calculateQualityScore(articleInfo);
          } catch (error) {
            console.warn(`质量分析失败: ${articleInfo.article_id}`, error);
            enhanced.quality_score = 0;
          }
        }

        return enhanced;
      }
    );

    const response = {
      articles: enhancedArticles,
      total: result.count || enhancedArticles.length,
      cursor: result.cursor,
      has_more: result.has_more || false,
    };

    articleCache.set(cacheKey, response);
    return response;
  }

  /**
   * 搜索文章
   */
  async searchArticles(
    keyword: string,
    limit: number = 20,
    includeAnalysis: boolean = false
  ): Promise<{
    articles: EnhancedArticleInfo[];
    total: number;
  }> {
    const result = await this.articleApi.searchArticles(keyword, limit);

    const enhancedArticles = result.articles.map(
      (articleInfo: ArticleInfo): EnhancedArticleInfo => {
        const enhanced: EnhancedArticleInfo = { ...articleInfo };

        if (includeAnalysis) {
          try {
            enhanced.quality_score = this.calculateQualityScore(articleInfo);
          } catch (error) {
            console.warn(`分析失败: ${articleInfo.article_id}`, error);
          }
        }

        return enhanced;
      }
    );

    return {
      articles: enhancedArticles,
      total: result.total,
    };
  }

  /**
   * 分析文章质量
   */
  async analyzeQuality(
    articleId: string,
    includePredictions: boolean = false
  ): Promise<ContentQuality> {
    const cacheKey = `quality:${articleId}:${includePredictions}`;

    const cachedResult = articleCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const articleInfo = await this.articleApi.getArticleDetail(articleId);
    if (!articleInfo) {
      throw new Error(`文章不存在: ${articleId}`);
    }

    const qualityScore = this.calculateQualityScore(articleInfo);
    const result: ContentQuality = {
      article_id: articleId,
      quality_score: qualityScore,
      factors: {
        engagement_rate: this.calculateEngagementRate(articleInfo),
        content_depth: this.calculateContentDepth(articleInfo),
        originality: this.calculateOriginalityScore(articleInfo),
        user_feedback: this.calculateFeedbackScore(articleInfo, articleInfo.author_user_info),
      },
      prediction: {
        potential_views: 0,
        potential_likes: 0,
        trending_probability: 0,
      },
    };

    // 如果需要预测，添加预测数据
    if (includePredictions) {
      const prediction = this.predictPerformance(articleInfo);
      result.prediction = prediction;
    }

    articleCache.set(cacheKey, result);
    return result;
  }

  /**
   * 获取推荐文章
   */
  async getRecommendations(userInterests: string[], limit: number = 10): Promise<Recommendation[]> {
    const cacheKey = `recommendations:${userInterests.join(',')}:${limit}`;

    const cachedResult = articleCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // 获取最新文章进行推荐
    const articles = await this.getArticles(200, limit * 2);

    // 根据用户兴趣计算推荐分数
    const recommendations: Recommendation[] = articles.articles
      .map((article: EnhancedArticleInfo) => {
        const interestScore = this.calculateInterestScore(article, userInterests);
        const qualityScore = article.quality_score || this.calculateQualityScore(article);
        const totalScore = qualityScore * 0.7 + interestScore * 0.3;

        return {
          article_id: article.article_info.article_id,
          title: article.article_info.title,
          reason: this.generateRecommendationReason(article),
          confidence: totalScore / 100,
          category: article.category.category_name,
          tags: article.tags.map((tag: Tag) => tag.tag_name),
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    articleCache.set(cacheKey, recommendations);
    return recommendations;
  }

  /**
   * 获取热门文章
   */
  async getTrendingArticles(
    limit: number = 10,
    timeRange: number = 24,
    category?: string
  ): Promise<{
    articles: EnhancedArticleInfo[];
    trend_info: {
      time_range: number;
      total_articles: number;
      avg_engagement: number;
      top_tags: string[];
    };
  }> {
    const cacheKey = `trending:${limit}:${timeRange}:${category}`;

    const cachedResult = articleCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // 获取最新文章
    const articles = await this.getArticles(200, limit * 2, category, true);

    // 过滤出热门文章（基于热度指数和参与度）
    const trendingArticles = articles.articles
      .filter((article: EnhancedArticleInfo) => {
        const engagementRate = this.calculateEngagementRate(article);
        const heatGrowth = this.calculateHeatGrowthRate(article, timeRange);
        return engagementRate > 0.05 && heatGrowth > 0;
      })
      .sort((a: EnhancedArticleInfo, b: EnhancedArticleInfo) => {
        const scoreA = this.calculateMomentumScore(a, timeRange);
        const scoreB = this.calculateMomentumScore(b, timeRange);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // 计算趋势信息
    const allTags = trendingArticles.flatMap((article: EnhancedArticleInfo) =>
      article.tags.map((tag: Tag) => tag.tag_name)
    );
    const topTags = this.getTopTags(allTags, 5);

    const avgEngagement =
      trendingArticles.reduce(
        (sum: number, article: EnhancedArticleInfo) => sum + this.calculateEngagementRate(article),
        0
      ) / (trendingArticles.length || 1);

    const result = {
      articles: trendingArticles,
      trend_info: {
        time_range: timeRange,
        total_articles: trendingArticles.length,
        avg_engagement: Math.round(avgEngagement * 100) / 100,
        top_tags: topTags,
      },
    };

    articleCache.set(cacheKey, result);
    return result;
  }

  /**
   * 分析趋势
   */
  async analyzeTrends(timeRange: number = 24): Promise<{
    tag_trends: TagTrend[];
    category_trends: CategoryTrend[];
    hotness_trends: HotnessTrend[];
    top_articles: ArticleInfo[];
  }> {
    const cacheKey = `trends:${timeRange}`;

    const cachedResult = articleCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // 获取时间范围内的文章
    const articles = await this.getArticles(200, 100);

    const result = {
      tag_trends: this.analyzeTagTrends(articles.articles),
      category_trends: this.analyzeCategoryTrends(articles.articles),
      hotness_trends: this.analyzeHotnessTrends(articles.articles),
      top_articles: this.getTopArticles(articles.articles),
    };

    articleCache.set(cacheKey, result);
    return result;
  }

  /**
   * 计算文章质量评分
   */
  calculateQualityScore(articleInfo: ArticleInfo): number {
    const engagementWeight = this.config.analysis.quality_weights.engagement;
    const depthWeight = this.config.analysis.quality_weights.content_depth;
    const originalityWeight = this.config.analysis.quality_weights.originality;
    const feedbackWeight = this.config.analysis.quality_weights.feedback;

    const engagementScore = this.calculateEngagementRate(articleInfo) * 100;
    const depthScore = this.calculateContentDepth(articleInfo) * 100;
    const originalityScore = this.calculateOriginalityScore(articleInfo) * 100;
    const feedbackScore =
      this.calculateFeedbackScore(articleInfo, articleInfo.author_user_info) * 100;

    return Math.round(
      engagementScore * engagementWeight +
        depthScore * depthWeight +
        originalityScore * originalityWeight +
        feedbackScore * feedbackWeight
    );
  }

  // 私有方法
  private calculateEngagementRate(article: ArticleInfo): number {
    const totalViews = article.article_info.view_count || 1;
    const totalEngagement =
      (article.article_info.digg_count || 0) +
      (article.article_info.comment_count || 0) +
      (article.article_info.collect_count || 0);

    return totalEngagement / totalViews;
  }

  private calculateContentDepth(article: ArticleInfo): number {
    const content = article.article_info.brief_content || '';
    const titleComplexity = (article.article_info.title || '').length / 50;
    const contentLength = content.length / 1000;

    return Math.min(titleComplexity + contentLength, 1);
  }

  private calculateOriginalityScore(article: ArticleInfo): number {
    const isOriginal = article.article_info.is_original === 1;
    const contentLength = (article.article_info.brief_content || '').length;
    const baseScore = isOriginal ? 0.8 : 0.4;
    const lengthBonus = Math.min(contentLength / 2000, 0.2);

    return Math.min(baseScore + lengthBonus, 1);
  }

  private calculateFeedbackScore(article: ArticleInfo, author: UserInfo): number {
    const authorReputation = Math.min(author.level / 6, 1);
    const contentPopularity = Math.min((article.article_info.digg_count || 0) / 100, 1);

    return authorReputation * 0.4 + contentPopularity * 0.6;
  }

  private predictPerformance(articleInfo: ArticleInfo): {
    potential_views: number;
    potential_likes: number;
    trending_probability: number;
  } {
    const baseViews = articleInfo.article_info.view_count || 0;
    const baseLikes = articleInfo.article_info.digg_count || 0;

    const qualityMultiplier = 1 + this.calculateQualityScore(articleInfo) / 100;
    const timeMultiplier = this.getTimeMultiplier(articleInfo.article_info.ctime);

    return {
      potential_views: Math.round(baseViews * qualityMultiplier * timeMultiplier),
      potential_likes: Math.round(baseLikes * qualityMultiplier * timeMultiplier),
      trending_probability: Math.min(qualityMultiplier * timeMultiplier * 0.1, 0.95),
    };
  }

  private getTimeMultiplier(ctime: string): number {
    const now = new Date().getTime();
    const created = new Date(ctime).getTime();
    const hoursAgo = (now - created) / (1000 * 60 * 60);

    if (hoursAgo <= 24) return 1.5;
    if (hoursAgo <= 72) return 1.2;
    return 1;
  }

  private calculateHeatGrowthRate(article: ArticleInfo, hoursAgo: number): number {
    const now = new Date().getTime();
    const created = new Date(article.article_info.ctime).getTime();
    const timeDiff = (now - created) / (1000 * 60 * 60);

    if (timeDiff > hoursAgo) return 0;

    const engagementRate = this.calculateEngagementRate(article);
    const timeDecay = Math.max(0, 1 - timeDiff / hoursAgo);

    return engagementRate * timeDecay;
  }

  private calculateMomentumScore(article: ArticleInfo, hoursAgo: number): number {
    const engagementRate = this.calculateEngagementRate(article);
    const heatGrowth = this.calculateHeatGrowthRate(article, hoursAgo);
    const hotIndex = (article.article_info.hot_index || 0) / 100;

    return engagementRate * 0.4 + heatGrowth * 0.4 + hotIndex * 0.2;
  }

  private getTopTags(tags: string[], limit: number): string[] {
    const tagCounts = tags.reduce((acc: Record<string, number>, tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  private analyzeTagTrends(articles: ArticleInfo[]): TagTrend[] {
    const tagStats: Record<string, { mentions: number; totalEngagement: number }> = {};

    articles.forEach((article: ArticleInfo) => {
      const engagement = this.calculateEngagementRate(article);
      article.tags.forEach((tag: Tag) => {
        if (!tagStats[tag.tag_name]) {
          tagStats[tag.tag_name] = { mentions: 0, totalEngagement: 0 };
        }
        tagStats[tag.tag_name].mentions++;
        tagStats[tag.tag_name].totalEngagement += engagement;
      });
    });

    return Object.entries(tagStats)
      .map(([tag, stats]) => ({
        tag,
        mentions: stats.mentions,
        growth_rate: this.calculateGrowthRate(stats.mentions),
        heat_score: stats.totalEngagement / stats.mentions,
        trend_direction: this.determineTrendDirection(stats.mentions),
      }))
      .sort((a, b) => b.heat_score - a.heat_score);
  }

  private analyzeCategoryTrends(articles: ArticleInfo[]): CategoryTrend[] {
    const categoryStats: Record<string, { articles: ArticleInfo[]; totalEngagement: number }> = {};

    articles.forEach((article: ArticleInfo) => {
      const categoryName = article.category.category_name;
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { articles: [], totalEngagement: 0 };
      }
      categoryStats[categoryName].articles.push(article);
      categoryStats[categoryName].totalEngagement += this.calculateEngagementRate(article);
    });

    return Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        article_count: stats.articles.length,
        avg_quality_score: this.calculateAvgQualityScore(stats.articles),
        total_engagement: stats.totalEngagement,
        growth_momentum: this.calculateGrowthMomentum(stats.articles),
      }))
      .sort((a, b) => b.growth_momentum - a.growth_momentum);
  }

  private analyzeHotnessTrends(articles: ArticleInfo[]): HotnessTrend[] {
    const timeSlots = this.groupByTimeSlots(articles, 6);

    return timeSlots.map((slot, index) => ({
      time_slot: `${index * 6}h-${(index + 1) * 6}h`,
      peak_articles: slot.length,
      avg_hotness:
        slot.length > 0
          ? slot.reduce(
              (sum: number, article: ArticleInfo) => sum + (article.article_info.hot_index || 0),
              0
            ) / slot.length
          : 0,
      engagement_peak:
        slot.length > 0
          ? Math.max(...slot.map((article: ArticleInfo) => this.calculateEngagementRate(article)))
          : 0,
    }));
  }

  private getTopArticles(articles: ArticleInfo[]): ArticleInfo[] {
    return articles
      .sort((a: ArticleInfo, b: ArticleInfo) => {
        const scoreA = this.calculateMomentumScore(a, 24);
        const scoreB = this.calculateMomentumScore(b, 24);
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }

  private calculateGrowthRate(mentions: number): number {
    return Math.min(mentions * 0.1, 1);
  }

  private determineTrendDirection(mentions: number): 'rising' | 'stable' | 'declining' {
    if (mentions >= 10) return 'rising';
    if (mentions >= 5) return 'stable';
    return 'declining';
  }

  private calculateAvgQualityScore(articles: ArticleInfo[]): number {
    if (articles.length === 0) return 0;

    const scores = articles.map((article: ArticleInfo) => {
      const engagement = this.calculateEngagementRate(article);
      const depth = this.calculateContentDepth(article);
      return engagement * 50 + depth * 50;
    });

    return scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
  }

  private calculateGrowthMomentum(articles: ArticleInfo[]): number {
    if (articles.length === 0) return 0;

    const recentArticles = articles.filter((article: ArticleInfo) => {
      const hoursSinceCreation =
        (Date.now() - new Date(article.article_info.ctime).getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation <= 24;
    });

    return recentArticles.length / articles.length;
  }

  private groupByTimeSlots(articles: ArticleInfo[], slotHours: number): ArticleInfo[][] {
    const slots: ArticleInfo[][] = Array(Math.ceil(24 / slotHours))
      .fill(null)
      .map(() => []);

    articles.forEach((article: ArticleInfo) => {
      const hoursSinceCreation =
        (Date.now() - new Date(article.article_info.ctime).getTime()) / (1000 * 60 * 60);
      const slotIndex = Math.min(Math.floor(hoursSinceCreation / slotHours), slots.length - 1);
      slots[slotIndex].push(article);
    });

    return slots;
  }

  private generateRecommendationReason(item: ArticleInfo): string {
    const engagementRate = this.calculateEngagementRate(item);
    const isHot = item.article_info.hot_index > 80;
    const isRecent = Date.now() - new Date(item.article_info.ctime).getTime() < 24 * 60 * 60 * 1000;

    if (isHot && isRecent) {
      return '当前热门且最新发布';
    } else if (isHot) {
      return '社区热门内容';
    } else if (engagementRate > 0.1) {
      return '高互动质量';
    } else if (isRecent) {
      return '最新发布内容';
    } else {
      return '根据您的兴趣推荐';
    }
  }

  private calculateInterestScore(article: ArticleInfo, userInterests: string[]): number {
    if (!userInterests.length) return 50;

    const articleTags = article.tags.map((tag: Tag) => tag.tag_name.toLowerCase());
    const categoryName = article.category.category_name.toLowerCase();
    const title = article.article_info.title.toLowerCase();

    let score = 0;
    let matches = 0;

    userInterests.forEach(interest => {
      const interestLower = interest.toLowerCase();

      if (articleTags.some(tag => tag.includes(interestLower))) {
        score += 40;
        matches++;
      }

      if (categoryName.includes(interestLower)) {
        score += 30;
        matches++;
      }

      if (title.includes(interestLower)) {
        score += 20;
        matches++;
      }
    });

    return Math.min(score + matches * 5, 100);
  }
}
