import { userApi } from '../api/users.js';
import type { UserInfo, UserProfile } from '../types/index.js';
import _ from 'lodash';

/**
 * 用户业务逻辑服务
 * 提供用户数据的高级处理和分析功能
 */
export class UserService {
  /**
   * 构建用户画像
   */
  async buildUserProfile(userId: string): Promise<UserProfile> {
    try {
      // 获取用户基础信息
      const userInfo = await userApi.getUserInfo(userId);

      // 分析用户兴趣
      const interests = await userApi.analyzeUserInterests(userId);

      // 获取用户统计（用于后续扩展）
      // const stats = await userApi.getUserStats(userId);

      // 分析活动模式
      const activityPattern = await this.analyzeActivityPattern(userInfo);

      // 识别专业领域
      const expertiseAreas = this.identifyExpertiseAreas(interests, userInfo);

      return {
        user_id: userId,
        basic_info: {
          user_name: userInfo.user_name,
          level: userInfo.level,
          join_days: 30, // 估算值
        },
        creation_pattern: {
          topic_diversity: { unique_topics: 0, diversity_score: 0 },
        },
        interaction_pattern: {
          engagement_style: 'balanced' as const,
        },
        influence_network: {
          network_quality: 'medium' as const,
        },
        growth_trajectory: {
          growth_stage: 'growing' as const,
        },
        behavior_score: 75,
        user_type: 'regular_contributor',
        analysis_time: new Date().toISOString(),
        interests: interests.interests.map(item => ({
          tag: item.tag,
          weight: item.weight,
        })),
        activity_pattern: activityPattern,
        expertise_areas: expertiseAreas,
      } as any;
    } catch (error) {
      console.warn(`[UserService] Failed to build user profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 分析用户活动模式
   */
  private async analyzeActivityPattern(userInfo: UserInfo) {
    // 基于用户数据推断活动模式
    const totalContent = userInfo.post_article_count + userInfo.post_shortmsg_count;

    // 判断参与度等级
    let engagementLevel: 'low' | 'medium' | 'high' = 'low';
    if (totalContent > 100) {
      engagementLevel = 'high';
    } else if (totalContent > 20) {
      engagementLevel = 'medium';
    }

    // 推断偏好的内容类型
    const preferredContentTypes = [];
    if (userInfo.post_article_count > userInfo.post_shortmsg_count) {
      preferredContentTypes.push('articles');
    } else {
      preferredContentTypes.push('pins');
    }

    // 基于互动数据推断活跃时间（这里是模拟，实际需要更多数据）
    const activeHours = this.estimateActiveHours(userInfo);

    return {
      active_hours: activeHours,
      preferred_content_types: preferredContentTypes,
      engagement_level: engagementLevel,
    };
  }

  /**
   * 估算活跃时间
   */
  private estimateActiveHours(userInfo: UserInfo): number[] {
    // 基于用户等级和活跃度推断可能的活跃时间
    // 这里是简化的启发式方法

    if (userInfo.level >= 5) {
      // 高等级用户可能在工作时间和晚上都活跃
      return [9, 10, 11, 14, 15, 16, 20, 21, 22];
    } else if (userInfo.post_article_count > 10) {
      // 有一定创作经验的用户可能晚上更活跃
      return [19, 20, 21, 22, 23];
    } else {
      // 普通用户可能在休息时间浏览
      return [12, 13, 18, 19, 20];
    }
  }

  /**
   * 识别专业领域
   */
  private identifyExpertiseAreas(interests: any, userInfo: UserInfo): string[] {
    const expertiseAreas = [];

    // 基于兴趣标签识别
    if (interests.interests.length > 0) {
      const topInterests = interests.interests
        .filter((item: any) => item.weight > 0.3)
        .map((item: any) => item.tag);

      expertiseAreas.push(...topInterests.slice(0, 3));
    }

    // 基于分类识别
    if (interests.categories.length > 0) {
      const topCategories = interests.categories
        .filter((item: any) => item.weight > 0.4)
        .map((item: any) => item.category);

      expertiseAreas.push(...topCategories.slice(0, 2));
    }

    // 基于用户等级和影响力推断
    if (userInfo.level >= 6 && userInfo.follower_count > 1000) {
      expertiseAreas.push('技术专家');
    }

    if (userInfo.post_article_count > 50) {
      expertiseAreas.push('内容创作');
    }

    return _.uniq(expertiseAreas);
  }

  /**
   * 计算用户影响力分数
   */
  calculateInfluenceScore(userInfo: UserInfo): number {
    const weights = {
      followers: 0.3,
      content_quality: 0.25,
      engagement: 0.25,
      level: 0.2,
    };

    // 粉丝数评分 (0-100)
    const followersScore = Math.min(userInfo.follower_count / 100, 100);

    // 内容质量评分
    const contentQualityScore = this.calculateContentQualityScore(userInfo);

    // 参与度评分
    const engagementScore = this.calculateUserEngagementScore(userInfo);

    // 等级评分
    const levelScore = Math.min(userInfo.level * 15, 100);

    const totalScore =
      followersScore * weights.followers +
      contentQualityScore * weights.content_quality +
      engagementScore * weights.engagement +
      levelScore * weights.level;

    return Math.round(totalScore);
  }

  /**
   * 计算内容质量评分
   */
  private calculateContentQualityScore(userInfo: UserInfo): number {
    if (userInfo.post_article_count === 0) return 0;

    // 平均获赞数
    const avgDiggs = userInfo.got_digg_count / userInfo.post_article_count;

    // 平均浏览数
    const avgViews = userInfo.got_view_count / userInfo.post_article_count;

    // 互动率
    const engagementRate = avgDiggs / Math.max(avgViews, 1);

    let score = 0;

    // 基于平均获赞数评分
    if (avgDiggs > 100) score += 40;
    else if (avgDiggs > 50) score += 30;
    else if (avgDiggs > 20) score += 20;
    else if (avgDiggs > 5) score += 10;

    // 基于互动率评分
    if (engagementRate > 0.05) score += 30;
    else if (engagementRate > 0.02) score += 20;
    else if (engagementRate > 0.01) score += 10;

    // 基于内容数量评分
    if (userInfo.post_article_count > 50) score += 20;
    else if (userInfo.post_article_count > 20) score += 15;
    else if (userInfo.post_article_count > 10) score += 10;

    // 基于原创性评分（假设大部分是原创）
    score += 10;

    return Math.min(score, 100);
  }

  /**
   * 计算用户参与度评分
   */
  private calculateUserEngagementScore(userInfo: UserInfo): number {
    let score = 0;

    // 发布频率评分
    const totalPosts = userInfo.post_article_count + userInfo.post_shortmsg_count;
    if (totalPosts > 100) score += 30;
    else if (totalPosts > 50) score += 25;
    else if (totalPosts > 20) score += 20;
    else if (totalPosts > 5) score += 15;

    // 互动活跃度评分
    const totalInteractions = userInfo.digg_article_count + userInfo.digg_shortmsg_count;
    if (totalInteractions > 1000) score += 25;
    else if (totalInteractions > 500) score += 20;
    else if (totalInteractions > 100) score += 15;
    else if (totalInteractions > 20) score += 10;

    // 社交活跃度评分
    if (userInfo.followee_count > 100) score += 15;
    else if (userInfo.followee_count > 50) score += 10;
    else if (userInfo.followee_count > 20) score += 5;

    // 影响力评分
    if (userInfo.follower_count > userInfo.followee_count * 2) score += 20;
    else if (userInfo.follower_count > userInfo.followee_count) score += 10;

    // 平台等级评分
    score += Math.min(userInfo.level * 2, 10);

    return Math.min(score, 100);
  }

  /**
   * 用户相似度计算
   */
  async calculateUserSimilarity(userId1: string, userId2: string): Promise<number> {
    try {
      const [profile1, profile2] = await Promise.all([
        this.buildUserProfile(userId1),
        this.buildUserProfile(userId2),
      ]);

      // 兴趣相似度
      const interestSimilarity = this.calculateInterestSimilarity(
        profile1.interests,
        profile2.interests
      );

      // 专业领域相似度
      const expertiseSimilarity = this.calculateExpertiseSimilarity(
        profile1.expertise_areas,
        profile2.expertise_areas
      );

      // 活动模式相似度
      const activitySimilarity = this.calculateActivitySimilarity(
        profile1.activity_pattern,
        profile2.activity_pattern
      );

      // 综合相似度
      const totalSimilarity =
        interestSimilarity * 0.5 + expertiseSimilarity * 0.3 + activitySimilarity * 0.2;

      return Math.round(totalSimilarity * 100) / 100;
    } catch (error) {
      console.warn(
        `[UserService] Failed to calculate similarity between ${userId1} and ${userId2}:`,
        error
      );
      return 0;
    }
  }

  /**
   * 计算兴趣相似度
   */
  private calculateInterestSimilarity(interests1: any[], interests2: any[]): number {
    if (interests1.length === 0 || interests2.length === 0) return 0;

    const tags1 = new Set(interests1.map(item => item.tag));
    const tags2 = new Set(interests2.map(item => item.tag));

    const intersection = new Set([...tags1].filter(tag => tags2.has(tag)));
    const union = new Set([...tags1, ...tags2]);

    return intersection.size / union.size;
  }

  /**
   * 计算专业领域相似度
   */
  private calculateExpertiseSimilarity(expertise1: string[], expertise2: string[]): number {
    if (expertise1.length === 0 || expertise2.length === 0) return 0;

    const set1 = new Set(expertise1);
    const set2 = new Set(expertise2);

    const intersection = new Set([...set1].filter(area => set2.has(area)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * 计算活动模式相似度
   */
  private calculateActivitySimilarity(activity1: any, activity2: any): number {
    let similarity = 0;

    // 参与度等级相似度
    if (activity1.engagement_level === activity2.engagement_level) {
      similarity += 0.4;
    }

    // 内容类型偏好相似度
    const types1 = new Set(activity1.preferred_content_types);
    const types2 = new Set(activity2.preferred_content_types);
    const typeIntersection = new Set([...types1].filter(type => types2.has(type)));
    const typeUnion = new Set([...types1, ...types2]);

    if (typeUnion.size > 0) {
      similarity += (typeIntersection.size / typeUnion.size) * 0.3;
    }

    // 活跃时间相似度
    const hours1 = new Set(activity1.active_hours);
    const hours2 = new Set(activity2.active_hours);
    const hourIntersection = new Set([...hours1].filter(hour => hours2.has(hour)));
    const hourUnion = new Set([...hours1, ...hours2]);

    if (hourUnion.size > 0) {
      similarity += (hourIntersection.size / hourUnion.size) * 0.3;
    }

    return similarity;
  }

  /**
   * 获取用户推荐
   */
  async getUserRecommendations(userId: string, limit: number = 10) {
    try {
      // const userProfile = await this.buildUserProfile(userId); // 用于后续扩展

      // 获取推荐作者
      const recommendedAuthors = await userApi.getRecommendedAuthors(50);

      // 基于用户画像进行筛选和评分
      const scoredUsers = await Promise.all(
        recommendedAuthors.map(async author => {
          const similarity = await this.calculateUserSimilarity(userId, author.user.user_id);
          const influenceScore = this.calculateInfluenceScore(author.user);

          const totalScore = similarity * 0.6 + (influenceScore / 100) * 0.4;

          return {
            user: author.user,
            similarity_score: similarity,
            influence_score: influenceScore,
            total_score: totalScore,
            reason: this.generateUserRecommendationReason(author, similarity, influenceScore),
          };
        })
      );

      // 排序并返回前N个
      return scoredUsers
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, limit)
        .map(item => ({
          user_id: item.user.user_id,
          user_name: item.user.user_name,
          reason: item.reason,
          confidence: item.total_score,
          similarity_score: item.similarity_score,
          influence_score: item.influence_score,
        }));
    } catch (error) {
      console.warn(`[UserService] Failed to get user recommendations for ${userId}:`, error);
      return [];
    }
  }

  /**
   * 生成用户推荐理由
   */
  private generateUserRecommendationReason(
    author: any,
    similarity: number,
    influence: number
  ): string {
    const reasons = [];

    if (similarity > 0.7) {
      reasons.push('兴趣相似');
    } else if (similarity > 0.4) {
      reasons.push('部分兴趣相同');
    }

    if (influence > 80) {
      reasons.push('技术专家');
    } else if (influence > 60) {
      reasons.push('活跃作者');
    }

    if (author.user.level >= 6) {
      reasons.push('高等级用户');
    }

    if (author.user.follower_count > 5000) {
      reasons.push('知名用户');
    }

    if (author.article_count > 20) {
      reasons.push('内容丰富');
    }

    return reasons.length > 0 ? reasons.join('，') : '推荐关注';
  }

  /**
   * 生成用户分析报告
   */
  async generateUserReport(userId: string) {
    try {
      const [userInfo, userStats, userProfile] = await Promise.all([
        userApi.getUserInfo(userId),
        userApi.getUserStats(userId),
        this.buildUserProfile(userId),
      ]);

      const influenceScore = this.calculateInfluenceScore(userInfo);

      return {
        user_id: userId,
        basic_info: {
          user_name: userInfo.user_name,
          level: userInfo.level,
          company: userInfo.company,
          job_title: userInfo.job_title,
        },
        statistics: userStats.basic_stats,
        influence_analysis: {
          influence_score: influenceScore,
          ranking_estimate: this.estimateUserRanking(influenceScore),
          strengths: this.identifyUserStrengths(userInfo),
          growth_potential: this.assessGrowthPotential(userInfo),
        },
        profile_analysis: userProfile,
        recommendations: {
          content_suggestions: this.generateContentSuggestions(userProfile),
          engagement_tips: this.generateEngagementTips(userInfo),
        },
        report_time: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`[UserService] Failed to generate user report for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 估算用户排名
   */
  private estimateUserRanking(influenceScore: number): string {
    if (influenceScore >= 90) return 'Top 1%';
    if (influenceScore >= 80) return 'Top 5%';
    if (influenceScore >= 70) return 'Top 10%';
    if (influenceScore >= 60) return 'Top 20%';
    if (influenceScore >= 50) return 'Top 30%';
    return 'Top 50%';
  }

  /**
   * 识别用户优势
   */
  private identifyUserStrengths(userInfo: UserInfo): string[] {
    const strengths = [];

    if (userInfo.follower_count > 1000) strengths.push('影响力强');
    if (userInfo.post_article_count > 50) strengths.push('内容创作能力强');
    if (userInfo.level >= 6) strengths.push('平台活跃度高');
    if (userInfo.got_digg_count / Math.max(userInfo.post_article_count, 1) > 50) {
      strengths.push('内容质量高');
    }
    if (userInfo.follower_count > userInfo.followee_count * 2) {
      strengths.push('个人品牌建设好');
    }

    return strengths;
  }

  /**
   * 评估成长潜力
   */
  private assessGrowthPotential(userInfo: UserInfo): string {
    let score = 0;

    if (userInfo.level < 6) score += 20; // 还有等级提升空间
    if (userInfo.post_article_count < 100) score += 15; // 内容创作空间
    if (userInfo.follower_count < 5000) score += 25; // 影响力增长空间
    if (userInfo.got_view_count / Math.max(userInfo.post_article_count, 1) < 1000) {
      score += 20; // 内容传播空间
    }

    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * 生成内容建议
   */
  private generateContentSuggestions(profile: UserProfile): string[] {
    const suggestions = [];

    if (profile.interests.length > 0) {
      const topInterest = profile.interests[0].tag;
      suggestions.push(`多创作${topInterest}相关内容`);
    }

    if (profile.activity_pattern.engagement_level === 'low') {
      suggestions.push('增加内容发布频率');
    }

    if (profile.expertise_areas.length > 0) {
      suggestions.push(`深耕${profile.expertise_areas[0]}领域`);
    }

    suggestions.push('尝试不同类型的内容形式');
    suggestions.push('关注热门话题和趋势');

    return suggestions;
  }

  /**
   * 生成互动建议
   */
  private generateEngagementTips(userInfo: UserInfo): string[] {
    const tips = [];

    if (userInfo.digg_article_count < userInfo.post_article_count * 5) {
      tips.push('多为他人的优质内容点赞');
    }

    if (userInfo.followee_count < 50) {
      tips.push('关注更多同领域的专家');
    }

    if (userInfo.post_shortmsg_count < userInfo.post_article_count) {
      tips.push('增加沸点互动，提高活跃度');
    }

    tips.push('积极参与评论讨论');
    tips.push('定期分享学习心得');

    return tips;
  }
}

// 导出单例实例
export const userService = new UserService();
