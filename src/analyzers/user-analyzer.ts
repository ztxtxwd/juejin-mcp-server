import { userApi } from '../api/users.js';
import { articleApi } from '../api/articles.js';
import { pinApi } from '../api/pins.js';
import _ from 'lodash';
import { differenceInDays } from 'date-fns';

/**
 * 用户分析器
 * 提供深度的用户行为分析、兴趣挖掘和影响力评估
 */
export class UserAnalyzer {
  /**
   * 深度用户行为分析
   */
  async analyzeUserBehavior(userId: string) {
    try {
      console.error(`[UserAnalyzer] Analyzing user behavior for ${userId}`);

      // 获取用户基础信息
      const userInfo = await userApi.getUserInfo(userId);

      // 分析用户内容创作模式
      const creationPattern = await this.analyzeCreationPattern(userId);

      // 分析用户互动模式
      const interactionPattern = this.analyzeInteractionPattern(userInfo);

      // 分析用户影响力网络
      const influenceNetwork = await this.analyzeInfluenceNetwork(userId);

      // 分析用户成长轨迹
      const growthTrajectory = this.analyzeGrowthTrajectory(userInfo);

      return {
        user_id: userId,
        basic_info: {
          user_name: userInfo.user_name,
          level: userInfo.level,
          join_days: this.estimateJoinDays(userInfo),
        },
        creation_pattern: creationPattern,
        interaction_pattern: interactionPattern,
        influence_network: influenceNetwork,
        growth_trajectory: growthTrajectory,
        behavior_score: this.calculateBehaviorScore(creationPattern, interactionPattern),
        user_type: this.classifyUserType(userInfo, creationPattern, interactionPattern),
        analysis_time: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[UserAnalyzer] Failed to analyze user behavior for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 分析用户内容创作模式
   */
  private async analyzeCreationPattern(userId: string) {
    try {
      // 获取用户的文章和沸点数据
      const [articles, pins] = await Promise.all([
        this.getUserArticles(userId),
        this.getUserPins(userId),
      ]);

      return {
        content_frequency: this.analyzeContentFrequency(articles, pins),
        content_quality: this.analyzeContentQuality(articles, pins),
        topic_diversity: this.analyzeTopicDiversity(articles, pins),
        engagement_effectiveness: this.analyzeEngagementEffectiveness(articles, pins),
        creation_consistency: this.analyzeCreationConsistency(articles, pins),
        preferred_formats: this.analyzePreferredFormats(articles, pins),
      };
    } catch (error) {
      console.warn(`[UserAnalyzer] Failed to analyze creation pattern for ${userId}:`, error);
      return this.getDefaultCreationPattern();
    }
  }

  /**
   * 获取用户文章（模拟，实际需要专门的API）
   */
  private async getUserArticles(userId: string) {
    try {
      const allArticles = await articleApi.getBatchArticles(200, 3);
      return allArticles.filter(article => article.author_user_info.user_id === userId);
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取用户沸点（模拟，实际需要专门的API）
   */
  private async getUserPins(userId: string) {
    try {
      const allPins = await pinApi.getBatchPins(200, 3);
      return allPins.filter(pin => pin.author_user_info.user_id === userId);
    } catch (error) {
      return [];
    }
  }

  /**
   * 分析内容发布频率
   */
  private analyzeContentFrequency(articles: any[], pins: any[]) {
    const totalContent = articles.length + pins.length;

    if (totalContent === 0) {
      return {
        articles_per_month: 0,
        pins_per_month: 0,
        total_per_month: 0,
        frequency_level: 'inactive' as const,
      };
    }

    // 估算月均发布量（基于最近内容的时间跨度）
    const allDates = [
      ...articles.map(a => new Date(a.article_info.rtime)),
      ...pins.map(p => new Date(p.msg_info.ctime)),
    ].sort((a, b) => a.getTime() - b.getTime());

    const timeSpanDays =
      allDates.length > 1 ? differenceInDays(allDates[allDates.length - 1], allDates[0]) : 30;

    const months = Math.max(timeSpanDays / 30, 1);

    const articlesPerMonth = articles.length / months;
    const pinsPerMonth = pins.length / months;
    const totalPerMonth = totalContent / months;

    let frequencyLevel: 'inactive' | 'low' | 'medium' | 'high' | 'very_high' = 'low';
    if (totalPerMonth > 20) frequencyLevel = 'very_high';
    else if (totalPerMonth > 10) frequencyLevel = 'high';
    else if (totalPerMonth > 5) frequencyLevel = 'medium';
    else if (totalPerMonth > 1) frequencyLevel = 'low';
    else frequencyLevel = 'inactive';

    return {
      articles_per_month: Math.round(articlesPerMonth * 10) / 10,
      pins_per_month: Math.round(pinsPerMonth * 10) / 10,
      total_per_month: Math.round(totalPerMonth * 10) / 10,
      frequency_level: frequencyLevel,
    };
  }

  /**
   * 分析内容质量
   */
  private analyzeContentQuality(articles: any[], pins: any[]) {
    if (articles.length === 0 && pins.length === 0) {
      return {
        avg_article_engagement: 0,
        avg_pin_engagement: 0,
        quality_consistency: 0,
        high_quality_ratio: 0,
      };
    }

    // 文章质量分析
    const articleEngagements = articles.map(
      article =>
        article.article_info.digg_count +
        article.article_info.comment_count +
        article.article_info.collect_count
    );
    const avgArticleEngagement = articleEngagements.length > 0 ? _.mean(articleEngagements) : 0;

    // 沸点质量分析
    const pinEngagements = pins.map(pin => pin.msg_info.digg_count + pin.msg_info.comment_count);
    const avgPinEngagement = pinEngagements.length > 0 ? _.mean(pinEngagements) : 0;

    // 质量一致性（标准差的倒数）
    const allEngagements = [...articleEngagements, ...pinEngagements];
    const qualityConsistency =
      allEngagements.length > 1 ? 1 / (this.calculateStandardDeviation(allEngagements) + 1) : 1;

    // 高质量内容比例
    const highQualityThreshold = Math.max(avgArticleEngagement, avgPinEngagement) * 1.5;
    const highQualityCount = allEngagements.filter(eng => eng > highQualityThreshold).length;
    const highQualityRatio =
      allEngagements.length > 0 ? highQualityCount / allEngagements.length : 0;

    return {
      avg_article_engagement: Math.round(avgArticleEngagement),
      avg_pin_engagement: Math.round(avgPinEngagement),
      quality_consistency: Math.round(qualityConsistency * 100) / 100,
      high_quality_ratio: Math.round(highQualityRatio * 100) / 100,
    };
  }

  /**
   * 分析话题多样性
   */
  private analyzeTopicDiversity(articles: any[], pins: any[]) {
    const topics = new Set<string>();

    // 从文章中提取话题
    articles.forEach(article => {
      if (article.tags) {
        article.tags.forEach((tag: any) => topics.add(tag.tag_name));
      }
      if (article.category) {
        topics.add(article.category.category_name);
      }
    });

    // 从沸点中提取话题
    pins.forEach(pin => {
      if (pin.topic && pin.topic.title) {
        topics.add(pin.topic.title);
      }
      // 提取话题标签
      const content = pin.msg_info.content;
      const hashtagMatches = content.match(/#([^#\s]+)/g);
      if (hashtagMatches) {
        hashtagMatches.forEach((tag: string) => topics.add(tag.substring(1)));
      }
    });

    const totalContent = articles.length + pins.length;
    const diversityScore = totalContent > 0 ? topics.size / totalContent : 0;

    return {
      unique_topics: topics.size,
      diversity_score: Math.round(diversityScore * 100) / 100,
      diversity_level: this.classifyDiversityLevel(diversityScore),
      top_topics: Array.from(topics).slice(0, 10),
    };
  }

  /**
   * 分析参与效果
   */
  private analyzeEngagementEffectiveness(articles: any[], pins: any[]) {
    const totalViews = articles.reduce(
      (sum, article) => sum + (article.article_info.view_count || 0),
      0
    );
    const totalEngagement = [
      ...articles.map(a => a.article_info.digg_count + a.article_info.comment_count),
      ...pins.map(p => p.msg_info.digg_count + p.msg_info.comment_count),
    ].reduce((sum, eng) => sum + eng, 0);

    const engagementRate = totalViews > 0 ? totalEngagement / totalViews : 0;

    return {
      total_views: totalViews,
      total_engagement: totalEngagement,
      engagement_rate: Math.round(engagementRate * 10000) / 10000,
      effectiveness_level: this.classifyEffectivenessLevel(engagementRate),
    };
  }

  /**
   * 分析创作一致性
   */
  private analyzeCreationConsistency(articles: any[], pins: any[]) {
    const allDates = [
      ...articles.map(a => new Date(a.article_info.rtime)),
      ...pins.map(p => new Date(p.msg_info.ctime)),
    ].sort((a, b) => a.getTime() - b.getTime());

    if (allDates.length < 2) {
      return {
        consistency_score: 0,
        avg_interval_days: 0,
        consistency_level: 'irregular' as const,
      };
    }

    // 计算发布间隔
    const intervals = [];
    for (let i = 1; i < allDates.length; i++) {
      const intervalDays = differenceInDays(allDates[i], allDates[i - 1]);
      intervals.push(intervalDays);
    }

    const avgInterval = _.mean(intervals);
    const intervalStd = this.calculateStandardDeviation(intervals);
    const consistencyScore = avgInterval > 0 ? 1 / (intervalStd / avgInterval + 1) : 0;

    return {
      consistency_score: Math.round(consistencyScore * 100) / 100,
      avg_interval_days: Math.round(avgInterval * 10) / 10,
      consistency_level: this.classifyConsistencyLevel(consistencyScore),
    };
  }

  /**
   * 分析偏好格式
   */
  private analyzePreferredFormats(articles: any[], pins: any[]) {
    const totalContent = articles.length + pins.length;

    if (totalContent === 0) {
      return {
        article_ratio: 0,
        pin_ratio: 0,
        preferred_format: 'none' as const,
      };
    }

    const articleRatio = articles.length / totalContent;
    const pinRatio = pins.length / totalContent;

    let preferredFormat: 'articles' | 'pins' | 'balanced' | 'none' = 'balanced';
    if (articleRatio > 0.7) preferredFormat = 'articles';
    else if (pinRatio > 0.7) preferredFormat = 'pins';
    else if (totalContent === 0) preferredFormat = 'none';

    return {
      article_ratio: Math.round(articleRatio * 100) / 100,
      pin_ratio: Math.round(pinRatio * 100) / 100,
      preferred_format: preferredFormat,
    };
  }

  /**
   * 分析用户互动模式
   */
  private analyzeInteractionPattern(userInfo: any) {
    const totalInteractions = userInfo.digg_article_count + userInfo.digg_shortmsg_count;
    const totalContent = userInfo.post_article_count + userInfo.post_shortmsg_count;

    // 互动比例
    const interactionRatio = totalContent > 0 ? totalInteractions / totalContent : 0;

    // 社交活跃度
    const socialActivity = {
      following_ratio: userInfo.followee_count / Math.max(userInfo.follower_count, 1),
      influence_ratio: userInfo.follower_count / Math.max(userInfo.followee_count, 1),
      social_balance: this.calculateSocialBalance(userInfo),
    };

    return {
      interaction_ratio: Math.round(interactionRatio * 100) / 100,
      social_activity: socialActivity,
      engagement_style: this.classifyEngagementStyle(userInfo),
      community_involvement: this.assessCommunityInvolvement(userInfo),
    };
  }

  /**
   * 分析影响力网络
   */
  private async analyzeInfluenceNetwork(userId: string) {
    // 这里需要更多的API支持来获取关注关系
    // 目前提供基础的影响力分析框架

    try {
      const userInfo = await userApi.getUserInfo(userId);

      return {
        network_size: userInfo.follower_count + userInfo.followee_count,
        influence_score: this.calculateInfluenceScore(userInfo),
        network_quality: this.assessNetworkQuality(userInfo),
        growth_potential: this.assessNetworkGrowthPotential(userInfo),
      };
    } catch (error) {
      return {
        network_size: 0,
        influence_score: 0,
        network_quality: 'unknown',
        growth_potential: 'unknown',
      };
    }
  }

  /**
   * 分析成长轨迹
   */
  private analyzeGrowthTrajectory(userInfo: any) {
    const joinDays = this.estimateJoinDays(userInfo);
    const dailyContentRate =
      joinDays > 0 ? (userInfo.post_article_count + userInfo.post_shortmsg_count) / joinDays : 0;
    const dailyEngagementRate = joinDays > 0 ? userInfo.got_digg_count / joinDays : 0;

    return {
      estimated_join_days: joinDays,
      daily_content_rate: Math.round(dailyContentRate * 1000) / 1000,
      daily_engagement_rate: Math.round(dailyEngagementRate * 100) / 100,
      growth_stage: this.classifyGrowthStage(userInfo),
      growth_momentum: this.calculateGrowthMomentum(userInfo),
    };
  }

  /**
   * 计算行为评分
   */
  private calculateBehaviorScore(creationPattern: any, interactionPattern: any): number {
    let score = 0;

    // 创作活跃度评分
    switch (creationPattern.content_frequency.frequency_level) {
      case 'very_high':
        score += 30;
        break;
      case 'high':
        score += 25;
        break;
      case 'medium':
        score += 20;
        break;
      case 'low':
        score += 10;
        break;
      default:
        score += 0;
    }

    // 内容质量评分
    if (creationPattern.content_quality.high_quality_ratio > 0.3) score += 25;
    else if (creationPattern.content_quality.high_quality_ratio > 0.1) score += 15;
    else score += 5;

    // 话题多样性评分
    if (creationPattern.topic_diversity.diversity_score > 0.5) score += 20;
    else if (creationPattern.topic_diversity.diversity_score > 0.3) score += 15;
    else score += 10;

    // 互动参与评分
    if (interactionPattern.interaction_ratio > 5) score += 15;
    else if (interactionPattern.interaction_ratio > 2) score += 10;
    else score += 5;

    // 社交平衡评分
    if (interactionPattern.social_activity.social_balance > 0.7) score += 10;
    else if (interactionPattern.social_activity.social_balance > 0.5) score += 5;

    return Math.min(score, 100);
  }

  /**
   * 分类用户类型
   */
  private classifyUserType(userInfo: any, creationPattern: any, interactionPattern: any): string {
    const totalContent = userInfo.post_article_count + userInfo.post_shortmsg_count;
    const avgEngagement =
      creationPattern.content_quality.avg_article_engagement +
      creationPattern.content_quality.avg_pin_engagement;

    if (userInfo.level >= 6 && userInfo.follower_count > 5000) {
      return 'influencer'; // 影响者
    } else if (totalContent > 50 && avgEngagement > 100) {
      return 'content_creator'; // 内容创作者
    } else if (interactionPattern.interaction_ratio > 10) {
      return 'active_participant'; // 活跃参与者
    } else if (totalContent > 20) {
      return 'regular_contributor'; // 常规贡献者
    } else if (totalContent > 5) {
      return 'occasional_poster'; // 偶尔发布者
    } else {
      return 'lurker'; // 潜水者
    }
  }

  // 辅助方法
  private getDefaultCreationPattern() {
    return {
      content_frequency: { frequency_level: 'inactive', total_per_month: 0 },
      content_quality: { avg_article_engagement: 0, avg_pin_engagement: 0 },
      topic_diversity: { unique_topics: 0, diversity_score: 0 },
      engagement_effectiveness: { engagement_rate: 0 },
      creation_consistency: { consistency_score: 0 },
      preferred_formats: { preferred_format: 'none' },
    };
  }

  private classifyDiversityLevel(score: number): 'low' | 'medium' | 'high' {
    if (score > 0.5) return 'high';
    if (score > 0.3) return 'medium';
    return 'low';
  }

  private classifyEffectivenessLevel(rate: number): 'low' | 'medium' | 'high' {
    if (rate > 0.05) return 'high';
    if (rate > 0.02) return 'medium';
    return 'low';
  }

  private classifyConsistencyLevel(score: number): 'irregular' | 'somewhat_regular' | 'regular' {
    if (score > 0.7) return 'regular';
    if (score > 0.4) return 'somewhat_regular';
    return 'irregular';
  }

  private calculateSocialBalance(userInfo: any): number {
    const total = userInfo.follower_count + userInfo.followee_count;
    if (total === 0) return 0;

    const ratio =
      Math.min(userInfo.follower_count, userInfo.followee_count) /
      Math.max(userInfo.follower_count, userInfo.followee_count);
    return Math.round(ratio * 100) / 100;
  }

  private classifyEngagementStyle(
    userInfo: any
  ): 'creator_focused' | 'community_focused' | 'balanced' {
    const creationScore = userInfo.post_article_count + userInfo.post_shortmsg_count;
    const interactionScore = userInfo.digg_article_count + userInfo.digg_shortmsg_count;

    if (creationScore > interactionScore * 2) return 'creator_focused';
    if (interactionScore > creationScore * 2) return 'community_focused';
    return 'balanced';
  }

  private assessCommunityInvolvement(userInfo: any): 'low' | 'medium' | 'high' {
    const totalActivity =
      userInfo.post_article_count +
      userInfo.post_shortmsg_count +
      userInfo.digg_article_count +
      userInfo.digg_shortmsg_count;

    if (totalActivity > 500) return 'high';
    if (totalActivity > 100) return 'medium';
    return 'low';
  }

  private calculateInfluenceScore(userInfo: any): number {
    return Math.min(
      userInfo.follower_count * 0.3 + userInfo.got_digg_count * 0.01 + userInfo.level * 10,
      100
    );
  }

  private assessNetworkQuality(userInfo: any): 'low' | 'medium' | 'high' | 'unknown' {
    const influenceRatio = userInfo.follower_count / Math.max(userInfo.followee_count, 1);

    if (influenceRatio > 3) return 'high';
    if (influenceRatio > 1) return 'medium';
    return 'low';
  }

  private assessNetworkGrowthPotential(userInfo: any): 'low' | 'medium' | 'high' | 'unknown' {
    if (userInfo.level < 6 && userInfo.post_article_count > 10) return 'high';
    if (userInfo.level < 4 && userInfo.follower_count < 1000) return 'medium';
    return 'low';
  }

  private estimateJoinDays(userInfo: any): number {
    // 基于用户等级和内容数量估算加入天数
    const basedays = userInfo.level * 30; // 假设每级需要30天
    const contentDays = (userInfo.post_article_count + userInfo.post_shortmsg_count) * 2;
    return Math.max(basedays, contentDays, 30);
  }

  private classifyGrowthStage(userInfo: any): 'newcomer' | 'growing' | 'established' | 'veteran' {
    if (userInfo.level <= 2) return 'newcomer';
    if (userInfo.level <= 4) return 'growing';
    if (userInfo.level <= 6) return 'established';
    return 'veteran';
  }

  private calculateGrowthMomentum(userInfo: any): 'low' | 'medium' | 'high' {
    const contentPerLevel =
      (userInfo.post_article_count + userInfo.post_shortmsg_count) / Math.max(userInfo.level, 1);

    if (contentPerLevel > 20) return 'high';
    if (contentPerLevel > 10) return 'medium';
    return 'low';
  }

  /**
   * 批量用户行为分析
   */
  async batchAnalyzeUsers(userIds: string[]) {
    const results = [];

    for (const userId of userIds) {
      try {
        const analysis = await this.analyzeUserBehavior(userId);
        results.push(analysis);

        // 避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`[UserAnalyzer] Failed to analyze user ${userId}:`, error);
        results.push({
          user_id: userId,
          error: 'Analysis failed',
        });
      }
    }

    return results;
  }

  /**
   * 用户相似度分析
   */
  async analyzeUserSimilarity(userId1: string, userId2: string) {
    try {
      const [behavior1, behavior2] = await Promise.all([
        this.analyzeUserBehavior(userId1),
        this.analyzeUserBehavior(userId2),
      ]);

      const similarity = {
        creation_similarity: this.calculateCreationSimilarity(
          behavior1.creation_pattern,
          behavior2.creation_pattern
        ),
        interaction_similarity: this.calculateInteractionSimilarity(
          behavior1.interaction_pattern,
          behavior2.interaction_pattern
        ),
        topic_similarity: this.calculateTopicSimilarity(
          (behavior1.creation_pattern.topic_diversity as any).top_topics || [],
          (behavior2.creation_pattern.topic_diversity as any).top_topics || []
        ),
      };

      const overallSimilarity =
        similarity.creation_similarity * 0.4 +
        similarity.interaction_similarity * 0.3 +
        similarity.topic_similarity * 0.3;

      return {
        user1_id: userId1,
        user2_id: userId2,
        overall_similarity: Math.round(overallSimilarity * 100) / 100,
        detailed_similarity: similarity,
        similarity_level: this.classifySimilarityLevel(overallSimilarity),
      };
    } catch (error) {
      console.error(
        `[UserAnalyzer] Failed to analyze similarity between ${userId1} and ${userId2}:`,
        error
      );
      throw error;
    }
  }

  private calculateCreationSimilarity(pattern1: any, pattern2: any): number {
    // 简化的创作模式相似度计算
    let similarity = 0;

    // 频率相似度
    if (pattern1.content_frequency.frequency_level === pattern2.content_frequency.frequency_level) {
      similarity += 0.3;
    }

    // 格式偏好相似度
    if (
      pattern1.preferred_formats.preferred_format === pattern2.preferred_formats.preferred_format
    ) {
      similarity += 0.3;
    }

    // 质量水平相似度
    const qualityDiff = Math.abs(
      pattern1.content_quality.high_quality_ratio - pattern2.content_quality.high_quality_ratio
    );
    similarity += (1 - qualityDiff) * 0.4;

    return Math.max(0, Math.min(similarity, 1));
  }

  private calculateInteractionSimilarity(pattern1: any, pattern2: any): number {
    let similarity = 0;

    // 参与风格相似度
    if (pattern1.engagement_style === pattern2.engagement_style) {
      similarity += 0.5;
    }

    // 社区参与度相似度
    if (pattern1.community_involvement === pattern2.community_involvement) {
      similarity += 0.5;
    }

    return similarity;
  }

  private calculateTopicSimilarity(topics1: string[], topics2: string[]): number {
    if (topics1.length === 0 || topics2.length === 0) return 0;

    const set1 = new Set(topics1.map(t => t.toLowerCase()));
    const set2 = new Set(topics2.map(t => t.toLowerCase()));

    const intersection = new Set([...set1].filter(t => set2.has(t)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private classifySimilarityLevel(similarity: number): 'low' | 'medium' | 'high' {
    if (similarity > 0.7) return 'high';
    if (similarity > 0.4) return 'medium';
    return 'low';
  }

  /**
   * 计算标准差
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = _.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = _.mean(squaredDiffs);

    return Math.sqrt(avgSquaredDiff);
  }
}

// 导出单例实例
export const userAnalyzer = new UserAnalyzer();
