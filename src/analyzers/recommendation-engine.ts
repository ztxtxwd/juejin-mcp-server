import type { Recommendation } from '../types/index.js';
import { articleApi } from '../api/articles.js';
import { pinApi } from '../api/pins.js';
import { userApi } from '../api/users.js';
import { contentAnalyzer } from './content-analyzer.js';
import { userAnalyzer } from './user-analyzer.js';
import { trendAnalyzer } from './trend-analyzer.js';
import _ from 'lodash';

/**
 * 推荐引擎
 * 提供基于多种算法的智能内容和用户推荐
 */
export class RecommendationEngine {
  /**
   * 生成内容推荐
   */
  async generateContentRecommendations(
    params: {
      user_id?: string;
      user_interests?: string[];
      content_type?: 'article' | 'pin' | 'both';
      algorithm?: 'collaborative' | 'content_based' | 'hybrid' | 'trending';
      limit?: number;
      min_quality_score?: number;
    } = {}
  ): Promise<Recommendation[]> {
    const {
      user_id,
      user_interests = [],
      content_type = 'both',
      algorithm = 'hybrid',
      limit = 20,
      min_quality_score = 60,
    } = params;

    try {
      console.error(
        `[RecommendationEngine] Generating ${algorithm} recommendations for user ${user_id}`
      );

      let recommendations: Recommendation[] = [];

      switch (algorithm) {
        case 'collaborative':
          recommendations = await this.collaborativeFiltering(user_id, content_type, limit);
          break;
        case 'content_based':
          recommendations = await this.contentBasedFiltering(user_interests, content_type, limit);
          break;
        case 'trending':
          recommendations = await this.trendingBasedRecommendations(content_type, limit);
          break;
        case 'hybrid':
        default:
          recommendations = await this.hybridRecommendations(
            user_id,
            user_interests,
            content_type,
            limit
          );
          break;
      }

      // 过滤低质量内容
      const filteredRecommendations = await this.filterByQuality(
        recommendations,
        min_quality_score
      );

      // 多样性优化
      const diversifiedRecommendations = this.diversifyRecommendations(
        filteredRecommendations,
        limit
      );

      return diversifiedRecommendations.slice(0, limit);
    } catch (error) {
      console.error('[RecommendationEngine] Failed to generate recommendations:', error);
      return [];
    }
  }

  /**
   * 协同过滤推荐
   */
  private async collaborativeFiltering(
    userId?: string,
    contentType: string = 'both',
    limit: number = 20
  ): Promise<Recommendation[]> {
    if (!userId) {
      return this.trendingBasedRecommendations(contentType, limit);
    }

    try {
      // 获取用户行为分析（用于后续扩展）
      // const userBehavior = await userAnalyzer.analyzeUserBehavior(userId);

      // 找到相似用户
      const similarUsers = await this.findSimilarUsers(userId, 10);

      // 获取相似用户喜欢的内容
      const recommendations = await this.getContentFromSimilarUsers(
        similarUsers,
        contentType,
        limit * 2
      );

      return recommendations.slice(0, limit);
    } catch (error) {
      console.warn('[RecommendationEngine] Collaborative filtering failed:', error);
      return this.contentBasedFiltering([], contentType, limit);
    }
  }

  /**
   * 基于内容的过滤推荐
   */
  private async contentBasedFiltering(
    userInterests: string[],
    contentType: string = 'both',
    limit: number = 20
  ): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];

      if (contentType === 'article' || contentType === 'both') {
        const articleRecs = await this.getArticleRecommendations(userInterests, limit);
        recommendations.push(...articleRecs);
      }

      if (contentType === 'pin' || contentType === 'both') {
        const pinRecs = await this.getPinRecommendations(userInterests, limit);
        recommendations.push(...pinRecs);
      }

      // 按相关性排序
      return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
    } catch (error) {
      console.warn('[RecommendationEngine] Content-based filtering failed:', error);
      return [];
    }
  }

  /**
   * 基于趋势的推荐
   */
  private async trendingBasedRecommendations(
    contentType: string = 'both',
    limit: number = 20
  ): Promise<Recommendation[]> {
    try {
      // 获取当前趋势
      const trends = await trendAnalyzer.analyzeTrends(24);
      const recommendations: Recommendation[] = [];

      // 基于热门话题推荐内容
      for (const topic of trends.trending_topics.slice(0, 10)) {
        if (contentType === 'article' || contentType === 'both') {
          const articles = await this.findArticlesByTopic(topic.topic, 2);
          recommendations.push(...articles);
        }

        if (contentType === 'pin' || contentType === 'both') {
          const pins = await this.findPinsByTopic(topic.topic, 2);
          recommendations.push(...pins);
        }
      }

      return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
    } catch (error) {
      console.warn('[RecommendationEngine] Trending-based recommendations failed:', error);
      return [];
    }
  }

  /**
   * 混合推荐算法
   */
  private async hybridRecommendations(
    userId?: string,
    userInterests: string[] = [],
    contentType: string = 'both',
    limit: number = 20
  ): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];

      // 协同过滤 (40%)
      const collaborativeRecs = await this.collaborativeFiltering(
        userId,
        contentType,
        Math.ceil(limit * 0.4)
      );
      recommendations.push(
        ...collaborativeRecs.map(rec => ({
          ...rec,
          confidence: rec.confidence * 0.4,
          reason: `协同过滤：${rec.reason}`,
        }))
      );

      // 基于内容 (35%)
      const contentRecs = await this.contentBasedFiltering(
        userInterests,
        contentType,
        Math.ceil(limit * 0.35)
      );
      recommendations.push(
        ...contentRecs.map(rec => ({
          ...rec,
          confidence: rec.confidence * 0.35,
          reason: `内容匹配：${rec.reason}`,
        }))
      );

      // 基于趋势 (25%)
      const trendingRecs = await this.trendingBasedRecommendations(
        contentType,
        Math.ceil(limit * 0.25)
      );
      recommendations.push(
        ...trendingRecs.map(rec => ({
          ...rec,
          confidence: rec.confidence * 0.25,
          reason: `热门趋势：${rec.reason}`,
        }))
      );

      // 去重并排序
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations);

      return uniqueRecommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
    } catch (error) {
      console.warn('[RecommendationEngine] Hybrid recommendations failed:', error);
      return this.trendingBasedRecommendations(contentType, limit);
    }
  }

  /**
   * 找到相似用户
   */
  private async findSimilarUsers(userId: string, limit: number = 10): Promise<string[]> {
    try {
      // 获取推荐作者作为相似用户的候选
      const recommendedAuthors = await userApi.getRecommendedAuthors(50);

      // 基于用户行为分析找到最相似的用户（用于后续扩展）
      // const userBehavior = await userAnalyzer.analyzeUserBehavior(userId);

      const similarUsers = [];
      for (const author of recommendedAuthors.slice(0, limit * 2)) {
        try {
          const similarity = await userAnalyzer.analyzeUserSimilarity(userId, author.user.user_id);

          if (similarity.overall_similarity > 0.3) {
            similarUsers.push({
              user_id: author.user.user_id,
              similarity: similarity.overall_similarity,
            });
          }
        } catch (error) {
          // 忽略单个用户的相似度计算错误
          continue;
        }
      }

      return similarUsers
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(user => user.user_id);
    } catch (error) {
      console.warn('[RecommendationEngine] Failed to find similar users:', error);
      return [];
    }
  }

  /**
   * 从相似用户获取内容
   */
  private async getContentFromSimilarUsers(
    similarUserIds: string[],
    contentType: string,
    limit: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      if (contentType === 'article' || contentType === 'both') {
        const articles = await articleApi.getBatchArticles(100, 2);
        const userArticles = articles.filter(article =>
          similarUserIds.includes(article.author_user_info.user_id)
        );

        for (const article of userArticles.slice(0, limit)) {
          recommendations.push({
            article_id: article.article_info.article_id,
            title: article.article_info.title,
            reason: '相似用户喜欢',
            confidence: 0.7,
            category: article.category.category_name,
            tags: article.tags.map(tag => tag.tag_name),
          });
        }
      }

      if (contentType === 'pin' || contentType === 'both') {
        const pins = await pinApi.getBatchPins(100, 2);
        const userPins = pins.filter(pin => similarUserIds.includes(pin.author_user_info.user_id));

        for (const pin of userPins.slice(0, limit)) {
          recommendations.push({
            article_id: pin.msg_Info.msg_id,
            title: pin.msg_Info.content.substring(0, 50) + '...',
            reason: '相似用户发布',
            confidence: 0.6,
            category: '沸点',
            tags: pin.topic ? [pin.topic.title] : [],
          });
        }
      }
    } catch (error) {
      console.warn('[RecommendationEngine] Failed to get content from similar users:', error);
    }

    return recommendations;
  }

  /**
   * 获取文章推荐
   */
  private async getArticleRecommendations(
    userInterests: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      const articles = await articleApi.getBatchArticles(200, 3);
      const recommendations: Recommendation[] = [];

      for (const article of articles) {
        const interestScore = this.calculateInterestScore(article, userInterests);
        const qualityAnalysis = contentAnalyzer.analyzeContentQuality(article, 'article');

        if (interestScore > 0.3 || qualityAnalysis.quality_score > 70) {
          recommendations.push({
            article_id: article.article_info.article_id,
            title: article.article_info.title,
            reason: this.generateRecommendationReason(interestScore, qualityAnalysis),
            confidence: interestScore * 0.6 + (qualityAnalysis.quality_score / 100) * 0.4,
            category: article.category.category_name,
            tags: article.tags.map(tag => tag.tag_name),
          });
        }
      }

      return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
    } catch (error) {
      console.warn('[RecommendationEngine] Failed to get article recommendations:', error);
      return [];
    }
  }

  /**
   * 获取沸点推荐
   */
  private async getPinRecommendations(
    userInterests: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      const pins = await pinApi.getBatchPins(200, 3);
      const recommendations: Recommendation[] = [];

      for (const pin of pins) {
        const interestScore = this.calculatePinInterestScore(pin, userInterests);
        const qualityAnalysis = contentAnalyzer.analyzeContentQuality(pin, 'pin');

        if (interestScore > 0.2 || qualityAnalysis.quality_score > 60) {
          recommendations.push({
            article_id: pin.msg_Info.msg_id,
            title: pin.msg_Info.content.substring(0, 50) + '...',
            reason: this.generatePinRecommendationReason(interestScore, qualityAnalysis),
            confidence: interestScore * 0.7 + (qualityAnalysis.quality_score / 100) * 0.3,
            category: '沸点',
            tags: pin.topic ? [pin.topic.title] : [],
          });
        }
      }

      return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
    } catch (error) {
      console.warn('[RecommendationEngine] Failed to get pin recommendations:', error);
      return [];
    }
  }

  /**
   * 根据话题查找文章
   */
  private async findArticlesByTopic(topic: string, limit: number): Promise<Recommendation[]> {
    try {
      const articles = await articleApi.searchArticles(topic, limit * 2);

      return articles.articles.slice(0, limit).map((article: any) => ({
        article_id: article.article_info.article_id,
        title: article.article_info.title,
        reason: `热门话题：${topic}`,
        confidence: 0.8,
        category: article.category.category_name,
        tags: article.tags.map((tag: any) => tag.tag_name),
      }));
    } catch (error) {
      console.warn(`[RecommendationEngine] Failed to find articles by topic ${topic}:`, error);
      return [];
    }
  }

  /**
   * 根据话题查找沸点
   */
  private async findPinsByTopic(topic: string, limit: number): Promise<Recommendation[]> {
    try {
      const pins = await pinApi.searchPins(topic, limit * 2);

      return pins.pins.slice(0, limit).map(pin => ({
        article_id: pin.msg_Info.msg_id,
        title: pin.msg_Info.content.substring(0, 50) + '...',
        reason: `热门话题：${topic}`,
        confidence: 0.7,
        category: '沸点',
        tags: pin.topic ? [pin.topic.title] : [],
      }));
    } catch (error) {
      console.warn(`[RecommendationEngine] Failed to find pins by topic ${topic}:`, error);
      return [];
    }
  }

  /**
   * 计算兴趣匹配分数
   */
  private calculateInterestScore(article: any, userInterests: string[]): number {
    if (userInterests.length === 0) return 0.5;

    const title = article.article_info.title.toLowerCase();
    const brief = article.article_info.brief_content.toLowerCase();
    const tags = article.tags.map((tag: any) => tag.tag_name.toLowerCase());
    const category = article.category.category_name.toLowerCase();

    let score = 0;
    const normalizedInterests = userInterests.map(interest => interest.toLowerCase());

    normalizedInterests.forEach(interest => {
      // 标题匹配
      if (title.includes(interest)) score += 0.3;

      // 标签匹配
      if (tags.some((tag: string) => tag.includes(interest) || interest.includes(tag))) {
        score += 0.25;
      }

      // 分类匹配
      if (category.includes(interest) || interest.includes(category)) {
        score += 0.2;
      }

      // 简介匹配
      if (brief.includes(interest)) score += 0.15;
    });

    return Math.min(score, 1);
  }

  /**
   * 计算沸点兴趣匹配分数
   */
  private calculatePinInterestScore(pin: any, userInterests: string[]): number {
    if (userInterests.length === 0) return 0.5;

    const content = pin.msg_Info.content.toLowerCase();
    const topicTitle = pin.topic?.title?.toLowerCase() || '';

    let score = 0;
    const normalizedInterests = userInterests.map(interest => interest.toLowerCase());

    normalizedInterests.forEach(interest => {
      // 内容匹配
      if (content.includes(interest)) score += 0.4;

      // 话题匹配
      if (topicTitle.includes(interest) || interest.includes(topicTitle)) {
        score += 0.3;
      }
    });

    return Math.min(score, 1);
  }

  /**
   * 生成推荐理由
   */
  private generateRecommendationReason(interestScore: number, qualityAnalysis: any): string {
    const reasons = [];

    if (interestScore > 0.7) {
      reasons.push('高度匹配您的兴趣');
    } else if (interestScore > 0.4) {
      reasons.push('符合您的兴趣');
    }

    if (qualityAnalysis.quality_score > 80) {
      reasons.push('高质量内容');
    } else if (qualityAnalysis.quality_score > 70) {
      reasons.push('优质内容');
    }

    if (qualityAnalysis.prediction.trending_probability > 0.7) {
      reasons.push('可能成为热门');
    }

    return reasons.length > 0 ? reasons.join('，') : '推荐阅读';
  }

  /**
   * 生成沸点推荐理由
   */
  private generatePinRecommendationReason(interestScore: number, qualityAnalysis: any): string {
    const reasons = [];

    if (interestScore > 0.6) {
      reasons.push('符合您的兴趣');
    }

    if (qualityAnalysis.quality_score > 70) {
      reasons.push('高质量讨论');
    }

    if (qualityAnalysis.prediction.trending_probability > 0.6) {
      reasons.push('热门讨论');
    }

    return reasons.length > 0 ? reasons.join('，') : '推荐查看';
  }

  /**
   * 按质量过滤推荐
   */
  private async filterByQuality(
    recommendations: Recommendation[],
    minQualityScore: number
  ): Promise<Recommendation[]> {
    const filteredRecommendations = [];

    for (const rec of recommendations) {
      try {
        // 这里可以添加更详细的质量检查
        // 目前基于置信度进行简单过滤
        if (rec.confidence * 100 >= minQualityScore) {
          filteredRecommendations.push(rec);
        }
      } catch (error) {
        // 忽略单个推荐的质量检查错误
        continue;
      }
    }

    return filteredRecommendations;
  }

  /**
   * 推荐多样性优化
   */
  private diversifyRecommendations(
    recommendations: Recommendation[],
    targetCount: number
  ): Recommendation[] {
    if (recommendations.length <= targetCount) {
      return recommendations;
    }

    const diversified: Recommendation[] = [];
    const usedCategories = new Set<string>();
    const usedTags = new Set<string>();

    // 按置信度排序
    const sortedRecs = recommendations.sort((a, b) => b.confidence - a.confidence);

    // 优先选择不同分类和标签的推荐
    for (const rec of sortedRecs) {
      if (diversified.length >= targetCount) break;

      const categoryUsed = usedCategories.has(rec.category);
      const tagsUsed = rec.tags.some(tag => usedTags.has(tag));

      // 如果分类和标签都没用过，或者已经选择的推荐较少，则添加
      if (!categoryUsed || !tagsUsed || diversified.length < targetCount * 0.7) {
        diversified.push(rec);
        usedCategories.add(rec.category);
        rec.tags.forEach(tag => usedTags.add(tag));
      }
    }

    // 如果还没达到目标数量，添加剩余的高质量推荐
    if (diversified.length < targetCount) {
      const remaining = sortedRecs.filter(
        rec => !diversified.some(d => d.article_id === rec.article_id)
      );
      diversified.push(...remaining.slice(0, targetCount - diversified.length));
    }

    return diversified;
  }

  /**
   * 去重推荐
   */
  private deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    const unique: Recommendation[] = [];

    for (const rec of recommendations) {
      if (!seen.has(rec.article_id)) {
        seen.add(rec.article_id);
        unique.push(rec);
      }
    }

    return unique;
  }

  /**
   * 生成用户推荐
   */
  async generateUserRecommendations(
    params: {
      user_id?: string;
      user_interests?: string[];
      limit?: number;
      algorithm?: 'similarity' | 'influence' | 'hybrid';
    } = {}
  ) {
    const { user_id, user_interests = [], limit = 10, algorithm = 'hybrid' } = params;

    try {
      console.error(`[RecommendationEngine] Generating user recommendations using ${algorithm}`);

      let userRecommendations = [];

      switch (algorithm) {
        case 'similarity':
          userRecommendations = await this.similarityBasedUserRecommendations(user_id, limit);
          break;
        case 'influence':
          userRecommendations = await this.influenceBasedUserRecommendations(limit);
          break;
        case 'hybrid':
        default:
          userRecommendations = await this.hybridUserRecommendations(
            user_id,
            user_interests,
            limit
          );
          break;
      }

      return userRecommendations.slice(0, limit);
    } catch (error) {
      console.error('[RecommendationEngine] Failed to generate user recommendations:', error);
      return [];
    }
  }

  /**
   * 基于相似度的用户推荐
   */
  private async similarityBasedUserRecommendations(userId?: string, limit: number = 10) {
    if (!userId) {
      return this.influenceBasedUserRecommendations(limit);
    }

    try {
      const similarUsers = await this.findSimilarUsers(userId, limit * 2);
      const recommendations = [];

      for (const similarUserId of similarUsers) {
        try {
          const userInfo = await userApi.getUserInfo(similarUserId);
          const similarity = await userAnalyzer.analyzeUserSimilarity(userId, similarUserId);

          recommendations.push({
            user_id: similarUserId,
            user_name: userInfo.user_name,
            reason: `兴趣相似度：${Math.round(similarity.overall_similarity * 100)}%`,
            confidence: similarity.overall_similarity,
            similarity_score: similarity.overall_similarity,
            influence_score: this.calculateUserInfluenceScore(userInfo),
          });
        } catch (error) {
          continue;
        }
      }

      return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
    } catch (error) {
      console.warn('[RecommendationEngine] Similarity-based user recommendations failed:', error);
      return [];
    }
  }

  /**
   * 基于影响力的用户推荐
   */
  private async influenceBasedUserRecommendations(limit: number = 10) {
    try {
      const recommendedAuthors = await userApi.getRecommendedAuthors(limit * 2);

      return recommendedAuthors.slice(0, limit).map(author => ({
        user_id: author.user.user_id,
        user_name: author.user.user_name,
        reason: this.generateInfluenceReason(author),
        confidence: this.calculateUserInfluenceScore(author.user) / 100,
        similarity_score: 0,
        influence_score: this.calculateUserInfluenceScore(author.user),
      }));
    } catch (error) {
      console.warn('[RecommendationEngine] Influence-based user recommendations failed:', error);
      return [];
    }
  }

  /**
   * 混合用户推荐
   */
  private async hybridUserRecommendations(
    userId?: string,
    _userInterests: string[] = [],
    limit: number = 10
  ) {
    try {
      const recommendations = [];

      // 相似度推荐 (60%)
      if (userId) {
        const similarityRecs = await this.similarityBasedUserRecommendations(
          userId,
          Math.ceil(limit * 0.6)
        );
        recommendations.push(
          ...similarityRecs.map(rec => ({
            ...rec,
            confidence: rec.confidence * 0.6,
            reason: `相似度推荐：${rec.reason}`,
          }))
        );
      }

      // 影响力推荐 (40%)
      const influenceRecs = await this.influenceBasedUserRecommendations(Math.ceil(limit * 0.4));
      recommendations.push(
        ...influenceRecs.map(rec => ({
          ...rec,
          confidence: rec.confidence * 0.4,
          reason: `影响力推荐：${rec.reason}`,
        }))
      );

      // 去重并排序
      const uniqueRecommendations = this.deduplicateUserRecommendations(recommendations);

      return uniqueRecommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
    } catch (error) {
      console.warn('[RecommendationEngine] Hybrid user recommendations failed:', error);
      return this.influenceBasedUserRecommendations(limit);
    }
  }

  /**
   * 计算用户影响力分数
   */
  private calculateUserInfluenceScore(userInfo: any): number {
    return Math.min(
      userInfo.follower_count * 0.3 +
        userInfo.got_digg_count * 0.01 +
        userInfo.level * 10 +
        userInfo.post_article_count * 0.5,
      100
    );
  }

  /**
   * 生成影响力推荐理由
   */
  private generateInfluenceReason(author: any): string {
    const reasons = [];

    if (author.user.level >= 6) {
      reasons.push('高等级用户');
    }

    if (author.user.follower_count > 5000) {
      reasons.push('知名用户');
    }

    if (author.article_count > 50) {
      reasons.push('内容丰富');
    }

    if (author.total_diggs > 1000) {
      reasons.push('高质量创作者');
    }

    return reasons.length > 0 ? reasons.join('，') : '推荐关注';
  }

  /**
   * 去重用户推荐
   */
  private deduplicateUserRecommendations(recommendations: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const rec of recommendations) {
      if (!seen.has(rec.user_id)) {
        seen.add(rec.user_id);
        unique.push(rec);
      }
    }

    return unique;
  }

  /**
   * 实时推荐更新
   */
  async updateRecommendations(userId: string) {
    try {
      // 获取用户最新行为
      const userBehavior = await userAnalyzer.analyzeUserBehavior(userId);

      // 基于最新行为更新推荐
      const updatedRecommendations = await this.generateContentRecommendations({
        user_id: userId,
        user_interests: (userBehavior.creation_pattern.topic_diversity as any).top_topics || [],
        algorithm: 'hybrid',
        limit: 20,
      });

      return {
        user_id: userId,
        updated_at: new Date().toISOString(),
        recommendations: updatedRecommendations,
        recommendation_count: updatedRecommendations.length,
      };
    } catch (error) {
      console.error(
        `[RecommendationEngine] Failed to update recommendations for ${userId}:`,
        error
      );
      throw error;
    }
  }
}

// 导出单例实例
export const recommendationEngine = new RecommendationEngine();
