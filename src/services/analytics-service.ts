import { ArticleService } from './article-service.js';
import { PinService } from './pin-service.js';
import { articleApi } from '../api/articles.js';
import { pinApi } from '../api/pins.js';
import _ from 'lodash';
import { differenceInHours } from 'date-fns';

/**
 * 分析协调服务
 * 提供跨模块的数据分析和聚合功能
 */
export class AnalyticsService {
  private articleService = new ArticleService();
  private pinService = new PinService();

  /**
   * 生成综合趋势报告
   */
  async generateTrendReport(timeRange: number = 24) {
    try {
      console.error(`[AnalyticsService] Generating trend report for ${timeRange} hours`);

      // 并行获取各类数据
      const [articleTrends, pinTrends, topicAnalysis] = await Promise.all([
        this.analyzeArticleTrends(timeRange),
        this.analyzePinTrends(timeRange),
        this.pinService.getTopicAnalysis(timeRange),
      ]);

      // 识别跨平台热门话题
      const crossPlatformTrends = this.identifyCrossPlatformTrends(
        articleTrends,
        pinTrends,
        topicAnalysis
      );

      // 生成趋势预测
      const trendPredictions = this.generateTrendPredictions(crossPlatformTrends);

      return {
        time_range_hours: timeRange,
        analysis_time: new Date().toISOString(),
        article_trends: articleTrends,
        pin_trends: pinTrends,
        topic_analysis: topicAnalysis,
        cross_platform_trends: crossPlatformTrends,
        trend_predictions: trendPredictions,
        summary: this.generateTrendSummary(crossPlatformTrends),
      };
    } catch (error) {
      console.error('[AnalyticsService] Failed to generate trend report:', error);
      throw error;
    }
  }

  /**
   * 分析文章趋势
   */
  private async analyzeArticleTrends(timeRange: number) {
    const articles = await articleApi.getBatchArticles(200, 3);

    // 过滤时间范围内的文章
    const recentArticles = articles.filter(article => {
      const publishTime = new Date(article.article_info.rtime);
      const hoursAgo = differenceInHours(new Date(), publishTime);
      return hoursAgo <= timeRange;
    });

    // 分析标签趋势
    const tagTrends = this.analyzeTagTrends(recentArticles);

    // 分析分类趋势
    const categoryTrends = this.analyzeCategoryTrends(recentArticles);

    // 分析热度趋势
    const hotnessTrends = this.analyzeHotnessTrends(recentArticles);

    return {
      total_articles: recentArticles.length,
      tag_trends: tagTrends,
      category_trends: categoryTrends,
      hotness_trends: hotnessTrends,
      top_articles: this.getTopArticles(recentArticles),
    };
  }

  /**
   * 分析沸点趋势
   */
  private async analyzePinTrends(timeRange: number) {
    const pins = await pinApi.getBatchPins(200, 3);

    // 过滤时间范围内的沸点
    const recentPins = pins.filter(pin => {
      const publishTime = new Date(pin.msg_info.ctime);
      const hoursAgo = differenceInHours(new Date(), publishTime);
      return hoursAgo <= timeRange;
    });

    // 分析内容类型趋势
    const contentTypeTrends = this.analyzeContentTypeTrends(recentPins);

    // 分析互动趋势
    const engagementTrends = this.analyzeEngagementTrends(recentPins);

    // 分析情感趋势
    const sentimentTrends = this.analyzeSentimentTrends(recentPins);

    return {
      total_pins: recentPins.length,
      content_type_trends: contentTypeTrends,
      engagement_trends: engagementTrends,
      sentiment_trends: sentimentTrends,
      viral_pins: this.getViralPins(recentPins),
    };
  }

  /**
   * 分析标签趋势
   */
  private analyzeTagTrends(articles: any[]) {
    const tagMap = new Map<
      string,
      {
        count: number;
        total_engagement: number;
        avg_engagement: number;
        growth_rate: number;
      }
    >();

    articles.forEach(article => {
      article.tags.forEach((tag: any) => {
        const engagement =
          article.article_info.digg_count +
          article.article_info.comment_count +
          article.article_info.collect_count;

        if (tagMap.has(tag.tag_name)) {
          const tagData = tagMap.get(tag.tag_name)!;
          tagData.count++;
          tagData.total_engagement += engagement;
          tagData.avg_engagement = tagData.total_engagement / tagData.count;
        } else {
          tagMap.set(tag.tag_name, {
            count: 1,
            total_engagement: engagement,
            avg_engagement: engagement,
            growth_rate: 0, // 需要历史数据计算
          });
        }
      });
    });

    return Array.from(tagMap.entries())
      .map(([tag, data]) => ({
        tag,
        ...data,
        heat_score: data.count * 0.6 + data.avg_engagement * 0.4,
      }))
      .sort((a, b) => b.heat_score - a.heat_score)
      .slice(0, 20);
  }

  /**
   * 分析分类趋势
   */
  private analyzeCategoryTrends(articles: any[]) {
    const categoryMap = new Map<
      string,
      {
        count: number;
        total_engagement: number;
        avg_quality_score: number;
      }
    >();

    articles.forEach(article => {
      const categoryName = article.category.category_name;
      const engagement =
        article.article_info.digg_count +
        article.article_info.comment_count +
        article.article_info.collect_count;

      const qualityScore = this.articleService.calculateQualityScore(article);

      if (categoryMap.has(categoryName)) {
        const categoryData = categoryMap.get(categoryName)!;
        categoryData.count++;
        categoryData.total_engagement += engagement;
        categoryData.avg_quality_score =
          (categoryData.avg_quality_score * (categoryData.count - 1) + qualityScore) /
          categoryData.count;
      } else {
        categoryMap.set(categoryName, {
          count: 1,
          total_engagement: engagement,
          avg_quality_score: qualityScore,
        });
      }
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        ...data,
        avg_engagement: data.total_engagement / data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 分析热度趋势
   */
  private analyzeHotnessTrends(articles: any[]) {
    const hourlyHotness = _.groupBy(articles, article => {
      const publishTime = new Date(article.article_info.rtime);
      return publishTime.getHours();
    });

    return Object.entries(hourlyHotness)
      .map(([hour, articles]) => ({
        hour: parseInt(hour),
        article_count: articles.length,
        avg_hotness:
          articles.reduce((sum, article) => sum + article.article_info.hot_index, 0) /
          articles.length,
        total_engagement: articles.reduce(
          (sum, article) =>
            sum +
            article.article_info.digg_count +
            article.article_info.comment_count +
            article.article_info.collect_count,
          0
        ),
      }))
      .sort((a, b) => a.hour - b.hour);
  }

  /**
   * 获取热门文章
   */
  private getTopArticles(articles: any[]) {
    return articles
      .map(article => ({
        article_id: article.article_info.article_id,
        title: article.article_info.title,
        author: article.author_user_info.user_name,
        engagement:
          article.article_info.digg_count +
          article.article_info.comment_count +
          article.article_info.collect_count,
        quality_score: this.articleService.calculateQualityScore(article),
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }

  /**
   * 分析内容类型趋势
   */
  private analyzeContentTypeTrends(pins: any[]) {
    const contentTypes = pins.map(pin => this.pinService.analyzeContent(pin).content_type);

    const typeStats = _.countBy(contentTypes);

    return Object.entries(typeStats)
      .map(([type, count]) => ({
        content_type: type,
        count,
        percentage: (count / pins.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 分析互动趋势
   */
  private analyzeEngagementTrends(pins: any[]) {
    const hourlyEngagement = _.groupBy(pins, pin => {
      const publishTime = new Date(pin.msg_info.ctime);
      return publishTime.getHours();
    });

    return Object.entries(hourlyEngagement)
      .map(([hour, pins]) => ({
        hour: parseInt(hour),
        pin_count: pins.length,
        total_diggs: pins.reduce((sum, pin) => sum + pin.msg_info.digg_count, 0),
        total_comments: pins.reduce((sum, pin) => sum + pin.msg_info.comment_count, 0),
        avg_engagement:
          pins.reduce((sum, pin) => sum + pin.msg_info.digg_count + pin.msg_info.comment_count, 0) /
          pins.length,
      }))
      .sort((a, b) => a.hour - b.hour);
  }

  /**
   * 分析情感趋势
   */
  private analyzeSentimentTrends(pins: any[]) {
    const sentiments = pins.map(pin => this.pinService.analyzeSentiment(pin).sentiment);

    const sentimentStats = _.countBy(sentiments);

    return Object.entries(sentimentStats)
      .map(([sentiment, count]) => ({
        sentiment,
        count,
        percentage: (count / pins.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 获取病毒式传播沸点
   */
  private getViralPins(pins: any[]) {
    return pins
      .map(pin => ({
        pin_id: pin.msg_info.msg_id,
        content: pin.msg_info.content.substring(0, 100) + '...',
        author: pin.author_user_info.user_name,
        engagement: pin.msg_info.digg_count + pin.msg_info.comment_count,
        viral_potential: this.pinService.calculatePinTrend(pin).viral_potential,
      }))
      .sort((a, b) => b.viral_potential - a.viral_potential)
      .slice(0, 10);
  }

  /**
   * 识别跨平台趋势
   */
  private identifyCrossPlatformTrends(articleTrends: any, _pinTrends: any, topicAnalysis: any) {
    const trends: any[] = [];

    // 分析文章标签和沸点话题的交集
    const articleTags = new Set(articleTrends.tag_trends.map((item: any) => item.tag));
    const pinTopics = new Set(topicAnalysis.trending_topics.map((item: any) => item.topic.title));

    // 找到共同话题
    const commonTopics = [...articleTags].filter(tag =>
      [...pinTopics].some(
        topic =>
          (topic as string).toLowerCase().includes((tag as string).toLowerCase()) ||
          (tag as string).toLowerCase().includes((topic as string).toLowerCase())
      )
    );

    commonTopics.forEach(topic => {
      const articleData = articleTrends.tag_trends.find((item: any) => item.tag === topic);
      const pinData = topicAnalysis.trending_topics.find((item: any) =>
        item.topic.title.toLowerCase().includes((topic as string).toLowerCase())
      );

      if (articleData && pinData) {
        trends.push({
          topic,
          cross_platform_score: (articleData.heat_score + pinData.heat_score) / 2,
          article_engagement: articleData.avg_engagement,
          pin_engagement: pinData.avg_engagement,
          total_mentions: articleData.count + pinData.pin_count,
          trend_strength: this.calculateTrendStrength(articleData, pinData),
        });
      }
    });

    return trends.sort((a, b) => b.cross_platform_score - a.cross_platform_score).slice(0, 10);
  }

  /**
   * 计算趋势强度
   */
  private calculateTrendStrength(
    articleData: any,
    pinData: any
  ): 'weak' | 'moderate' | 'strong' | 'viral' {
    const combinedScore = articleData.heat_score + pinData.heat_score;

    if (combinedScore > 100) return 'viral';
    if (combinedScore > 50) return 'strong';
    if (combinedScore > 20) return 'moderate';
    return 'weak';
  }

  /**
   * 生成趋势预测
   */
  private generateTrendPredictions(crossPlatformTrends: any[]) {
    return crossPlatformTrends.slice(0, 5).map(trend => ({
      topic: trend.topic,
      prediction: this.predictTrendDirection(trend),
      confidence: this.calculatePredictionConfidence(trend),
      recommended_actions: this.generateRecommendedActions(trend),
    }));
  }

  /**
   * 预测趋势方向
   */
  private predictTrendDirection(trend: any): 'rising' | 'stable' | 'declining' {
    // 简化的预测逻辑，实际应该基于历史数据
    if (trend.trend_strength === 'viral' || trend.trend_strength === 'strong') {
      return 'rising';
    } else if (trend.trend_strength === 'moderate') {
      return 'stable';
    } else {
      return 'declining';
    }
  }

  /**
   * 计算预测置信度
   */
  private calculatePredictionConfidence(trend: any): number {
    let confidence = 0.5; // 基础置信度

    if (trend.total_mentions > 50) confidence += 0.2;
    if (trend.cross_platform_score > 50) confidence += 0.2;
    if (trend.trend_strength === 'strong' || trend.trend_strength === 'viral') confidence += 0.1;

    return Math.min(confidence, 0.9);
  }

  /**
   * 生成推荐行动
   */
  private generateRecommendedActions(trend: any): string[] {
    const actions = [];

    if (trend.trend_strength === 'viral' || trend.trend_strength === 'strong') {
      actions.push('立即创作相关内容');
      actions.push('参与话题讨论');
    }

    if (trend.article_engagement > trend.pin_engagement) {
      actions.push('重点关注文章形式的内容');
    } else {
      actions.push('通过沸点形式参与讨论');
    }

    actions.push('关注话题发展动态');

    return actions;
  }

  /**
   * 生成趋势摘要
   */
  private generateTrendSummary(crossPlatformTrends: any[]) {
    const totalTrends = crossPlatformTrends.length;
    const strongTrends = crossPlatformTrends.filter(
      t => t.trend_strength === 'strong' || t.trend_strength === 'viral'
    ).length;

    const topTrend = crossPlatformTrends[0];

    return {
      total_trending_topics: totalTrends,
      strong_trends_count: strongTrends,
      top_trend: topTrend
        ? {
            topic: topTrend.topic,
            strength: topTrend.trend_strength,
            score: topTrend.cross_platform_score,
          }
        : null,
      trend_diversity: this.calculateTrendDiversity(crossPlatformTrends),
      overall_activity_level: this.assessOverallActivityLevel(crossPlatformTrends),
    };
  }

  /**
   * 计算趋势多样性
   */
  private calculateTrendDiversity(trends: any[]): 'low' | 'medium' | 'high' {
    const uniqueStrengths = new Set(trends.map(t => t.trend_strength));

    if (uniqueStrengths.size >= 3) return 'high';
    if (uniqueStrengths.size === 2) return 'medium';
    return 'low';
  }

  /**
   * 评估整体活跃度
   */
  private assessOverallActivityLevel(trends: any[]): 'low' | 'medium' | 'high' {
    const avgScore =
      trends.reduce((sum, trend) => sum + trend.cross_platform_score, 0) / trends.length;

    if (avgScore > 60) return 'high';
    if (avgScore > 30) return 'medium';
    return 'low';
  }

  /**
   * 生成内容推荐
   */
  async generateContentRecommendations(
    params: {
      user_interests?: string[];
      content_type?: 'article' | 'pin' | 'both';
      limit?: number;
    } = {}
  ) {
    const { user_interests = [], content_type = 'both', limit = 20 } = params;

    const recommendations = [];

    if (content_type === 'article' || content_type === 'both') {
      const articleRecs = await this.articleService.getRecommendations(
        user_interests,
        Math.ceil(limit / (content_type === 'both' ? 2 : 1))
      );
      recommendations.push(...articleRecs.map((rec: any) => ({ ...rec, type: 'article' })));
    }

    if (content_type === 'pin' || content_type === 'both') {
      const pinRecs = await this.pinService.getPinRecommendations({
        user_interests,
        limit: Math.ceil(limit / (content_type === 'both' ? 2 : 1)),
      });
      recommendations.push(...pinRecs.map((rec: any) => ({ ...rec, type: 'pin' })));
    }

    // 按置信度排序
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
  }

  /**
   * 生成平台洞察报告
   */
  async generatePlatformInsights() {
    try {
      const [trendReport, userStats] = await Promise.all([
        this.generateTrendReport(24),
        this.analyzePlatformUserStats(),
      ]);

      return {
        platform_health: this.assessPlatformHealth(trendReport, userStats),
        content_ecosystem: this.analyzeContentEcosystem(trendReport),
        user_engagement: userStats,
        growth_opportunities: this.identifyGrowthOpportunities(trendReport, userStats),
        recommendations: this.generatePlatformRecommendations(trendReport, userStats),
        report_time: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[AnalyticsService] Failed to generate platform insights:', error);
      throw error;
    }
  }

  /**
   * 分析平台用户统计
   */
  private async analyzePlatformUserStats() {
    // 这里需要更多的用户数据，目前提供基础分析框架
    return {
      active_users_estimate: 100000, // 模拟数据
      content_creators: 10000,
      avg_engagement_rate: 0.05,
      user_growth_rate: 0.1,
    };
  }

  /**
   * 评估平台健康度
   */
  private assessPlatformHealth(
    trendReport: any,
    userStats: any
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;

    if (trendReport.summary.overall_activity_level === 'high') score += 30;
    else if (trendReport.summary.overall_activity_level === 'medium') score += 20;
    else score += 10;

    if (trendReport.summary.trend_diversity === 'high') score += 25;
    else if (trendReport.summary.trend_diversity === 'medium') score += 15;
    else score += 5;

    if (userStats.avg_engagement_rate > 0.05) score += 25;
    else if (userStats.avg_engagement_rate > 0.03) score += 15;
    else score += 5;

    if (userStats.user_growth_rate > 0.1) score += 20;
    else if (userStats.user_growth_rate > 0.05) score += 10;
    else score += 5;

    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * 分析内容生态系统
   */
  private analyzeContentEcosystem(trendReport: any) {
    return {
      content_balance: this.assessContentBalance(trendReport),
      topic_coverage: trendReport.summary.total_trending_topics,
      engagement_distribution: this.analyzeEngagementDistribution(trendReport),
      content_quality_trend: this.assessContentQualityTrend(trendReport),
    };
  }

  /**
   * 评估内容平衡性
   */
  private assessContentBalance(trendReport: any): 'balanced' | 'article_heavy' | 'pin_heavy' {
    const articleCount = trendReport.article_trends.total_articles;
    const pinCount = trendReport.pin_trends.total_pins;

    const ratio = articleCount / pinCount;

    if (ratio > 1.5) return 'article_heavy';
    if (ratio < 0.67) return 'pin_heavy';
    return 'balanced';
  }

  /**
   * 分析参与度分布
   */
  private analyzeEngagementDistribution(_trendReport: any) {
    // 简化的参与度分布分析
    return {
      high_engagement_content_ratio: 0.2,
      medium_engagement_content_ratio: 0.5,
      low_engagement_content_ratio: 0.3,
    };
  }

  /**
   * 评估内容质量趋势
   */
  private assessContentQualityTrend(trendReport: any): 'improving' | 'stable' | 'declining' {
    // 基于文章质量分数的简化评估
    const avgQuality =
      trendReport.article_trends.category_trends.reduce(
        (sum: number, cat: any) => sum + cat.avg_quality_score,
        0
      ) / trendReport.article_trends.category_trends.length;

    if (avgQuality > 70) return 'improving';
    if (avgQuality > 50) return 'stable';
    return 'declining';
  }

  /**
   * 识别增长机会
   */
  private identifyGrowthOpportunities(trendReport: any, userStats: any) {
    const opportunities = [];

    if (trendReport.summary.trend_diversity === 'low') {
      opportunities.push('增加内容话题多样性');
    }

    if (userStats.avg_engagement_rate < 0.05) {
      opportunities.push('提升用户参与度');
    }

    if (trendReport.article_trends.total_articles < trendReport.pin_trends.total_pins * 0.5) {
      opportunities.push('鼓励更多深度内容创作');
    }

    opportunities.push('优化内容推荐算法');
    opportunities.push('加强社区互动功能');

    return opportunities;
  }

  /**
   * 生成平台建议
   */
  private generatePlatformRecommendations(_trendReport: any, _userStats: any) {
    const recommendations = [];

    recommendations.push('关注热门趋势，及时调整内容策略');
    recommendations.push('鼓励高质量内容创作');
    recommendations.push('优化用户体验，提升参与度');
    recommendations.push('加强内容分发和推荐机制');

    return recommendations;
  }
}

// 导出单例实例
export const analyticsService = new AnalyticsService();
