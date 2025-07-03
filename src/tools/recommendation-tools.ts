import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { recommendationEngine } from '../analyzers/recommendation-engine.js';
import { userService } from '../services/user-service.js';

/**
 * 推荐相关MCP工具
 */
export const recommendationTools: Tool[] = [
  {
    name: 'get_recommendations',
    description: '获取个性化内容推荐，支持多种推荐算法和过滤条件',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: '用户ID（可选，用于个性化推荐）',
        },
        user_interests: {
          type: 'array',
          items: { type: 'string' },
          description: '用户兴趣标签列表',
        },
        content_type: {
          type: 'string',
          description: '内容类型',
          enum: ['article', 'pin', 'both'],
          default: 'both',
        },
        algorithm: {
          type: 'string',
          description: '推荐算法',
          enum: ['collaborative', 'content_based', 'hybrid', 'trending'],
          default: 'hybrid',
        },
        limit: {
          type: 'number',
          description: '推荐数量',
          default: 20,
          minimum: 1,
          maximum: 50,
        },
        min_quality_score: {
          type: 'number',
          description: '最低质量分数',
          default: 60,
          minimum: 0,
          maximum: 100,
        },
      },
    },
  },
  {
    name: 'get_user_recommendations',
    description: '获取用户推荐，发现相似用户或有影响力的用户',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: '当前用户ID（用于相似度计算）',
        },
        user_interests: {
          type: 'array',
          items: { type: 'string' },
          description: '用户兴趣标签列表',
        },
        algorithm: {
          type: 'string',
          description: '推荐算法',
          enum: ['similarity', 'influence', 'hybrid'],
          default: 'hybrid',
        },
        limit: {
          type: 'number',
          description: '推荐用户数量',
          default: 10,
          minimum: 1,
          maximum: 30,
        },
      },
    },
  },
  {
    name: 'generate_user_report',
    description: '生成用户分析报告，包含兴趣分析、行为模式和成长建议',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: '用户ID',
        },
        include_recommendations: {
          type: 'boolean',
          description: '是否包含个性化推荐',
          default: true,
        },
        include_growth_analysis: {
          type: 'boolean',
          description: '是否包含成长分析',
          default: true,
        },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'update_recommendations',
    description: '更新用户推荐，基于最新的用户行为和兴趣',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: '用户ID',
        },
        recent_interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content_id: { type: 'string' },
              interaction_type: {
                type: 'string',
                enum: ['view', 'like', 'comment', 'collect', 'share'],
              },
              timestamp: { type: 'string' },
            },
          },
          description: '最近的交互记录',
        },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_trending_recommendations',
    description: '获取基于当前趋势的推荐内容',
    inputSchema: {
      type: 'object',
      properties: {
        time_range: {
          type: 'number',
          description: '趋势分析时间范围（小时）',
          default: 24,
          minimum: 1,
          maximum: 168,
        },
        content_type: {
          type: 'string',
          description: '内容类型',
          enum: ['article', 'pin', 'both'],
          default: 'both',
        },
        limit: {
          type: 'number',
          description: '推荐数量',
          default: 15,
          minimum: 1,
          maximum: 30,
        },
        category_filter: {
          type: 'string',
          description: '分类过滤',
        },
      },
    },
  },
  {
    name: 'get_simple_recommendations',
    description: '获取简化版内容推荐，基于当前热门内容和用户兴趣快速生成',
    inputSchema: {
      type: 'object',
      properties: {
        user_interests: {
          type: 'array',
          items: { type: 'string' },
          description: '用户兴趣标签列表',
        },
        content_type: {
          type: 'string',
          description: '内容类型',
          enum: ['article', 'pin', 'both'],
          default: 'article',
        },
        limit: {
          type: 'number',
          description: '推荐数量',
          default: 10,
          minimum: 1,
          maximum: 20,
        },
        sort_by: {
          type: 'string',
          description: '排序方式',
          enum: ['relevance', 'popularity', 'recent'],
          default: 'relevance',
        },
      },
    },
  },
];

/**
 * 推荐工具处理器
 */
export class RecommendationToolHandler {
  /**
   * 处理获取推荐
   */
  async handleGetRecommendations(args: any) {
    try {
      const {
        user_id,
        user_interests = [],
        content_type = 'both',
        algorithm = 'hybrid',
        limit = 20,
        min_quality_score = 60,
      } = args;

      const recommendations = await recommendationEngine.generateContentRecommendations({
        user_id,
        user_interests,
        content_type,
        algorithm,
        limit,
        min_quality_score,
      });

      const response = {
        algorithm_used: algorithm,
        content_type,
        user_context: {
          user_id: user_id || 'anonymous',
          interests: user_interests,
        },
        recommendations: recommendations.map(rec => ({
          id: rec.article_id,
          title: rec.title,
          reason: rec.reason,
          confidence: Math.round(rec.confidence * 100),
          category: rec.category,
          tags: rec.tags,
          recommendation_score: Math.round(rec.confidence * 100),
        })),
        total_recommendations: recommendations.length,
        quality_threshold: min_quality_score,
      };

      return {
        content: [
          {
            type: 'text',
            text: `生成 ${recommendations.length} 个${algorithm}推荐\n\n${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取推荐失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理用户推荐
   */
  async handleGetUserRecommendations(args: any) {
    try {
      const { user_id, user_interests = [], algorithm = 'hybrid', limit = 10 } = args;

      const userRecommendations = await recommendationEngine.generateUserRecommendations({
        user_id,
        user_interests,
        algorithm,
        limit,
      });

      const response = {
        algorithm_used: algorithm,
        base_user: user_id || 'anonymous',
        user_interests,
        recommended_users: userRecommendations.map(rec => ({
          user_id: rec.user_id,
          user_name: rec.user_name,
          reason: rec.reason,
          confidence: Math.round(rec.confidence * 100),
          similarity_score: Math.round((rec.similarity_score || 0) * 100),
          influence_score: Math.round(rec.influence_score || 0),
        })),
        total_recommendations: userRecommendations.length,
      };

      return {
        content: [
          {
            type: 'text',
            text: `生成 ${userRecommendations.length} 个用户推荐\n\n${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取用户推荐失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理生成用户报告
   */
  async handleGenerateUserReport(args: any) {
    try {
      const { user_id, include_recommendations = true, include_growth_analysis = true } = args;

      const userReport = await userService.generateUserReport(user_id);

      const report = {
        user_id,
        report_time: userReport.report_time,
        basic_profile: userReport.basic_info,
        statistics_summary: {
          level: userReport.statistics.level,
          followers: userReport.statistics.follower_count,
          articles: userReport.statistics.post_article_count,
          pins: userReport.statistics.post_shortmsg_count,
        },
        influence_analysis: userReport.influence_analysis,
        interests_and_expertise: {
          primary_interests: userReport.profile_analysis.interests.slice(0, 10),
          expertise_areas: userReport.profile_analysis.expertise_areas,
          activity_level: userReport.profile_analysis.activity_pattern.engagement_level,
        },
      };

      if (include_growth_analysis) {
        (report as any).growth_analysis = {
          current_stage: userReport.influence_analysis.growth_potential,
          strengths: userReport.influence_analysis.strengths,
          improvement_areas: userReport.recommendations.engagement_tips,
        };
      }

      if (include_recommendations) {
        const contentRecs = await recommendationEngine.generateContentRecommendations({
          user_id,
          user_interests: userReport.profile_analysis.interests.map(i => i.tag),
          limit: 10,
        });

        const userRecs = await recommendationEngine.generateUserRecommendations({
          user_id,
          limit: 5,
        });

        (report as any).personalized_recommendations = {
          content_recommendations: contentRecs.slice(0, 5).map(rec => ({
            title: rec.title,
            reason: rec.reason,
            confidence: Math.round(rec.confidence * 100),
          })),
          user_recommendations: userRecs.slice(0, 3).map(rec => ({
            user_name: rec.user_name,
            reason: rec.reason,
            confidence: Math.round(rec.confidence * 100),
          })),
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `用户分析报告生成完成\n\n${JSON.stringify(report, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `生成用户报告失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理更新推荐
   */
  async handleUpdateRecommendations(args: any) {
    try {
      const { user_id, recent_interactions = [] } = args;

      // 分析最近的交互行为
      const interactionAnalysis = this.analyzeRecentInteractions(recent_interactions);

      // 基于交互更新用户兴趣
      const updatedInterests = this.extractInterestsFromInteractions(recent_interactions);

      // 生成更新的推荐
      const updatedRecommendations = await recommendationEngine.updateRecommendations(user_id);

      const response = {
        user_id,
        update_time: new Date().toISOString(),
        interaction_analysis: interactionAnalysis,
        updated_interests: updatedInterests,
        new_recommendations: updatedRecommendations.recommendations.slice(0, 15).map(rec => ({
          id: rec.article_id,
          title: rec.title,
          reason: rec.reason,
          confidence: Math.round(rec.confidence * 100),
          is_new: true,
        })),
        recommendation_changes: {
          total_new: updatedRecommendations.recommendations.length,
          algorithm_adjustments: this.getAlgorithmAdjustments(interactionAnalysis),
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: `推荐更新完成\n\n${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `更新推荐失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理获取趋势推荐
   */
  async handleGetTrendingRecommendations(args: any) {
    try {
      const { time_range = 24, content_type = 'both', limit = 15, category_filter } = args;

      const trendingRecommendations = await recommendationEngine.generateContentRecommendations({
        content_type,
        algorithm: 'trending',
        limit,
      });

      // 过滤分类
      let filteredRecommendations = trendingRecommendations;
      if (category_filter) {
        filteredRecommendations = trendingRecommendations.filter(rec =>
          rec.category.toLowerCase().includes(category_filter.toLowerCase())
        );
      }

      const response = {
        time_range_hours: time_range,
        content_type,
        category_filter,
        trending_recommendations: filteredRecommendations.map(rec => ({
          id: rec.article_id,
          title: rec.title,
          category: rec.category,
          tags: rec.tags,
          trending_reason: rec.reason,
          confidence: Math.round(rec.confidence * 100),
          trend_strength: this.calculateTrendStrength(rec.confidence),
        })),
        total_recommendations: filteredRecommendations.length,
        trend_analysis: {
          hot_categories: this.getHotCategories(filteredRecommendations),
          emerging_topics: this.getEmergingTopics(filteredRecommendations),
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: `获取 ${filteredRecommendations.length} 个趋势推荐\n\n${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取趋势推荐失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理获取简化推荐
   */
  async handleGetSimpleRecommendations(args: any) {
    try {
      const {
        user_interests = [],
        content_type = 'article',
        limit = 10,
        sort_by = 'relevance',
      } = args;

      // 获取基础数据
      const { articleApi } = await import('../api/articles.js');
      const { pinApi } = await import('../api/pins.js');

      let recommendations: any[] = [];

      if (content_type === 'article' || content_type === 'both') {
        const articles = await articleApi.getBatchArticles(100, 1);
        const articleRecs = this.generateSimpleArticleRecommendations(
          articles,
          user_interests,
          Math.ceil(limit * (content_type === 'both' ? 0.7 : 1))
        );
        recommendations.push(...articleRecs);
      }

      if (content_type === 'pin' || content_type === 'both') {
        const pins = await pinApi.getBatchPins(100, 1);
        const pinRecs = this.generateSimplePinRecommendations(
          pins,
          user_interests,
          Math.ceil(limit * (content_type === 'both' ? 0.3 : 1))
        );
        recommendations.push(...pinRecs);
      }

      // 排序
      if (sort_by === 'popularity') {
        recommendations.sort((a, b) => b.popularity_score - a.popularity_score);
      } else if (sort_by === 'recent') {
        recommendations.sort(
          (a, b) => new Date(b.publish_time).getTime() - new Date(a.publish_time).getTime()
        );
      } else {
        recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
      }

      recommendations = recommendations.slice(0, limit);

      const response = {
        algorithm_used: 'simple_content_based',
        content_type,
        user_context: {
          interests: user_interests,
          sort_preference: sort_by,
        },
        recommendations,
        total_recommendations: recommendations.length,
        generation_time: new Date().toISOString(),
      };

      return {
        content: [
          {
            type: 'text',
            text: `生成 ${recommendations.length} 个简化推荐\n\n${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取简化推荐失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 生成简单的文章推荐
   */
  private generateSimpleArticleRecommendations(
    articles: any[],
    userInterests: string[],
    limit: number
  ) {
    return articles
      .map(article => {
        const info = article.article_info || {};
        const relevanceScore = this.calculateSimpleRelevanceScore(article, userInterests);
        const popularityScore = this.calculatePopularityScore(info);

        return {
          content_id: info.article_id || '',
          type: 'article',
          title: info.title || '无标题',
          brief: info.brief_content || '',
          author: article.author_user_info?.user_name || '匿名用户',
          category: article.category?.category_name || '未分类',
          tags: (article.tags || []).map((tag: any) => tag.tag_name || tag),
          stats: {
            views: info.view_count || 0,
            likes: info.digg_count || 0,
            comments: info.comment_count || 0,
          },
          relevance_score: relevanceScore,
          popularity_score: popularityScore,
          publish_time: info.rtime || new Date().toISOString(),
          recommendation_reason: this.generateSimpleReason(
            relevanceScore,
            popularityScore,
            userInterests,
            article
          ),
        };
      })
      .filter(item => item.relevance_score > 0.1 || item.popularity_score > 50)
      .slice(0, limit);
  }

  /**
   * 生成简单的沸点推荐
   */
  private generateSimplePinRecommendations(pins: any[], userInterests: string[], limit: number) {
    return pins
      .map(pin => {
        const info = pin.msg_info || {};
        const relevanceScore = this.calculateSimplePinRelevanceScore(pin, userInterests);
        const popularityScore = info.digg_count + info.comment_count;

        return {
          content_id: info.msg_id || '',
          type: 'pin',
          content: info.content?.slice(0, 200) || '',
          author: pin.author_user_info?.user_name || '匿名用户',
          topic: pin.topic?.title || '无话题',
          stats: {
            likes: info.digg_count || 0,
            comments: info.comment_count || 0,
          },
          relevance_score: relevanceScore,
          popularity_score: popularityScore,
          publish_time: info.ctime || new Date().toISOString(),
          recommendation_reason: this.generateSimplePinReason(
            relevanceScore,
            popularityScore,
            userInterests
          ),
        };
      })
      .filter(item => item.relevance_score > 0.1 || item.popularity_score > 10)
      .slice(0, limit);
  }

  /**
   * 计算简单的相关性分数
   */
  private calculateSimpleRelevanceScore(article: any, userInterests: string[]): number {
    if (!userInterests.length) return 0.5;

    let score = 0;
    const title = (article.article_info?.title || '').toLowerCase();
    const content = (article.article_info?.brief_content || '').toLowerCase();
    const category = (article.category?.category_name || '').toLowerCase();
    const tags = (article.tags || []).map((tag: any) => (tag.tag_name || tag).toLowerCase());

    userInterests.forEach(interest => {
      const interestLower = interest.toLowerCase();

      // 标题匹配权重最高
      if (title.includes(interestLower)) score += 0.4;

      // 分类匹配
      if (category.includes(interestLower)) score += 0.3;

      // 标签匹配
      if (tags.some((tag: string) => tag.includes(interestLower))) score += 0.2;

      // 内容匹配
      if (content.includes(interestLower)) score += 0.1;
    });

    return Math.min(score, 1.0);
  }

  /**
   * 计算沸点相关性分数
   */
  private calculateSimplePinRelevanceScore(pin: any, userInterests: string[]): number {
    if (!userInterests.length) return 0.5;

    let score = 0;
    const content = (pin.msg_info?.content || '').toLowerCase();
    const topic = (pin.topic?.title || '').toLowerCase();

    userInterests.forEach(interest => {
      const interestLower = interest.toLowerCase();

      if (topic.includes(interestLower)) score += 0.5;
      if (content.includes(interestLower)) score += 0.3;
    });

    return Math.min(score, 1.0);
  }

  /**
   * 计算人气分数
   */
  private calculatePopularityScore(info: any): number {
    const views = info.view_count || 0;
    const likes = info.digg_count || 0;
    const comments = info.comment_count || 0;

    return views * 0.01 + likes * 5 + comments * 10;
  }

  /**
   * 生成简单的推荐理由
   */
  private generateSimpleReason(
    relevanceScore: number,
    popularityScore: number,
    userInterests: string[],
    article: any
  ): string {
    const reasons = [];

    if (relevanceScore > 0.6) {
      reasons.push(`与您的兴趣 "${userInterests.join(', ')}" 高度匹配`);
    } else if (relevanceScore > 0.3) {
      reasons.push(`与您的兴趣相关`);
    }

    if (popularityScore > 200) {
      reasons.push('热门文章');
    } else if (popularityScore > 100) {
      reasons.push('受欢迎内容');
    }

    const category = article.category?.category_name;
    if (
      category &&
      userInterests.some(interest => category.toLowerCase().includes(interest.toLowerCase()))
    ) {
      reasons.push(`${category}分类推荐`);
    }

    return reasons.length > 0 ? reasons.join(', ') : '推荐内容';
  }

  /**
   * 生成沸点推荐理由
   */
  private generateSimplePinReason(
    relevanceScore: number,
    popularityScore: number,
    userInterests: string[]
  ): string {
    const reasons = [];

    if (relevanceScore > 0.6) {
      reasons.push(`与您的兴趣 "${userInterests.join(', ')}" 匹配`);
    }

    if (popularityScore > 50) {
      reasons.push('热门沸点');
    } else if (popularityScore > 20) {
      reasons.push('活跃讨论');
    }

    return reasons.length > 0 ? reasons.join(', ') : '推荐沸点';
  }

  // 辅助方法
  private analyzeRecentInteractions(interactions: any[]) {
    const interactionTypes = interactions.reduce(
      (acc, interaction) => {
        acc[interaction.interaction_type] = (acc[interaction.interaction_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalInteractions = interactions.length;
    const mostFrequentType =
      Object.entries(interactionTypes).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || 'none';

    return {
      total_interactions: totalInteractions,
      interaction_distribution: interactionTypes,
      most_frequent_type: mostFrequentType,
      engagement_level: this.calculateEngagementLevel(totalInteractions),
    };
  }

  private extractInterestsFromInteractions(_interactions: any[]): string[] {
    // 这里应该基于交互的内容提取兴趣
    // 目前返回模拟数据
    const interests = ['JavaScript', 'React', '前端开发'];
    return interests;
  }

  private getAlgorithmAdjustments(interactionAnalysis: any): string[] {
    const adjustments = [];

    if (interactionAnalysis.most_frequent_type === 'like') {
      adjustments.push('增加基于点赞行为的推荐权重');
    }

    if (interactionAnalysis.engagement_level === 'high') {
      adjustments.push('提高推荐内容的多样性');
    }

    return adjustments;
  }

  private calculateEngagementLevel(interactionCount: number): string {
    if (interactionCount > 20) return 'high';
    if (interactionCount > 10) return 'medium';
    return 'low';
  }

  private calculateTrendStrength(confidence: number): string {
    if (confidence > 0.8) return 'strong';
    if (confidence > 0.6) return 'moderate';
    return 'weak';
  }

  private getHotCategories(recommendations: any[]): string[] {
    const categoryCount = recommendations.reduce(
      (acc, rec) => {
        acc[rec.category] = (acc[rec.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([category]) => category);
  }

  private getEmergingTopics(recommendations: any[]): string[] {
    const allTags = recommendations.flatMap(rec => rec.tags);
    const tagCount = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(tagCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([tag]) => tag);
  }
}

// 导出工具处理器实例
export const recommendationToolHandler = new RecommendationToolHandler();
