import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { pinApi } from '../api/pins.js';
import { pinService } from '../services/pin-service.js';
/**
 * 沸点相关MCP工具
 */
export const pinTools: Tool[] = [
  {
    name: 'get_pins',
    description: '获取掘金沸点列表，支持话题、排序等参数，包含情感分析和趋势信息',
    inputSchema: {
      type: 'object',
      properties: {
        sort_type: {
          type: 'number',
          description: '排序类型：300最新',
          default: 300,
        },
        topic_id: {
          type: 'string',
          description: '话题ID过滤',
        },
        limit: {
          type: 'number',
          description: '返回数量限制',
          default: 20,
          maximum: 100,
        },
        cursor: {
          type: 'string',
          description: '分页游标',
        },
        include_sentiment: {
          type: 'boolean',
          description: '是否包含情感分析',
          default: true,
        },
        include_trend_info: {
          type: 'boolean',
          description: '是否包含趋势信息',
          default: false,
        },
      },
    },
  },
  {
    name: 'search_pins',
    description: '搜索掘金沸点，支持关键词搜索和内容分析',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: '搜索关键词',
        },
        limit: {
          type: 'number',
          description: '返回数量限制',
          default: 20,
          maximum: 50,
        },
        content_type: {
          type: 'string',
          description: '内容类型过滤',
          enum: [
            'question',
            'sharing',
            'help',
            'complaint',
            'gratitude',
            'learning',
            'career',
            'general',
          ],
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_hot_topics',
    description: '获取热门话题分析，识别当前最受关注的讨论话题',
    inputSchema: {
      type: 'object',
      properties: {
        time_range: {
          type: 'number',
          description: '分析时间范围（小时）',
          default: 24,
          minimum: 1,
          maximum: 168,
        },
        limit: {
          type: 'number',
          description: '返回话题数量',
          default: 20,
          maximum: 50,
        },
      },
    },
  },
  {
    name: 'analyze_pin_trends',
    description: '分析沸点趋势，提供详细的数据统计和洞察',
    inputSchema: {
      type: 'object',
      properties: {
        time_range: {
          type: 'number',
          description: '分析时间范围（小时）',
          default: 24,
          minimum: 1,
          maximum: 168,
        },
        include_sentiment_analysis: {
          type: 'boolean',
          description: '是否包含情感分析',
          default: true,
        },
      },
    },
  },
  {
    name: 'get_pin_recommendations',
    description: '获取个性化沸点推荐，基于用户兴趣和内容质量',
    inputSchema: {
      type: 'object',
      properties: {
        user_interests: {
          type: 'array',
          items: { type: 'string' },
          description: '用户兴趣标签列表',
        },
        content_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'question',
              'sharing',
              'help',
              'complaint',
              'gratitude',
              'learning',
              'career',
              'general',
            ],
          },
          description: '偏好的内容类型',
        },
        limit: {
          type: 'number',
          description: '推荐数量',
          default: 10,
          maximum: 30,
        },
        exclude_ids: {
          type: 'array',
          items: { type: 'string' },
          description: '排除的沸点ID列表',
        },
      },
    },
  },
];

/**
 * 沸点工具处理器
 */
export class PinToolHandler {
  /**
   * 处理获取沸点列表
   */
  async handleGetPins(args: any) {
    try {
      const {
        sort_type = 300,
        topic_id,
        limit = 20,
        // cursor, // 暂时未使用
        include_sentiment = true,
        include_trend_info = false,
      } = args;

      // 获取增强的沸点列表
      const result = await pinService.getEnhancedPinList({
        sort_type,
        topic_id,
        limit,
        include_sentiment,
        include_trend_info,
      });

      const response = {
        pins: result.pins.map(pin => ({
          id: pin.msg_info.msg_id,
          content: pin.msg_info.content,
          author: pin.author_user_info.user_name,
          topic: pin.topic?.title || null,
          images: pin.msg_info.pic_list || [],
          stats: {
            likes: pin.msg_info.digg_count,
            comments: pin.msg_info.comment_count,
          },
          sentiment: pin.sentiment,
          trend_info: pin.trend_info,
          content_analysis: pin.content_analysis,
          engagement_quality: pin.engagement_quality,
          publish_time: pin.msg_info.ctime,
        })),
        total_count: result.pins.length,
        has_more: result.has_more,
        cursor: result.cursor,
      };

      return {
        content: [
          {
            type: 'text',
            text: `成功获取 ${result.pins.length} 条沸点\n\n${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取沸点列表失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理搜索沸点
   */
  async handleSearchPins(args: any) {
    try {
      const { keyword, limit = 20, content_type } = args;

      const result = await pinApi.searchPins(keyword, limit);

      // 过滤内容类型
      let filteredPins = result.pins;
      if (content_type) {
        filteredPins = result.pins.filter(pin => {
          const analysis = pinService.analyzeContent(pin);
          return analysis.content_type === content_type;
        });
      }

      const pins = filteredPins.map(pin => {
        const contentAnalysis = pinService.analyzeContent(pin);
        const sentiment = pinService.analyzeSentiment(pin);

        return {
          id: pin.msg_info.msg_id,
          content: pin.msg_info.content,
          author: pin.author_user_info.user_name,
          topic: pin.topic?.title || null,
          images: pin.msg_info.pic_list || [],
          stats: {
            likes: pin.msg_info.digg_count,
            comments: pin.msg_info.comment_count,
          },
          content_type: contentAnalysis.content_type,
          sentiment: sentiment.sentiment,
          sentiment_confidence: sentiment.confidence,
          publish_time: pin.msg_info.ctime,
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: `搜索关键词 "${keyword}" 找到 ${pins.length} 条沸点\n\n${JSON.stringify(
              {
                keyword,
                content_type_filter: content_type,
                pins,
                total_found: pins.length,
              },
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `搜索沸点失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理获取热门话题
   */
  async handleGetHotTopics(args: any) {
    try {
      const { time_range = 24, limit = 20 } = args;

      const topicAnalysis = await pinService.getTopicAnalysis(time_range);

      const hotTopics = topicAnalysis.trending_topics.slice(0, limit).map(topic => ({
        topic: topic.topic.title,
        topic_id: topic.topic.topic_id,
        pin_count: topic.pin_count,
        total_engagement: topic.total_engagement,
        avg_engagement: topic.avg_engagement,
        heat_score: topic.heat_score,
        growth_rate: topic.growth_rate || 0,
      }));

      return {
        content: [
          {
            type: 'text',
            text: `分析 ${time_range} 小时内的热门话题\n\n${JSON.stringify(
              {
                time_range_hours: time_range,
                analysis_summary: {
                  total_topics: topicAnalysis.total_topics,
                  total_pins: topicAnalysis.total_pins,
                  analysis_time: topicAnalysis.analysis_time,
                },
                hot_topics: hotTopics,
              },
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取热门话题失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理沸点趋势分析
   */
  async handleAnalyzePinTrends(args: any) {
    try {
      const { time_range = 24, include_sentiment_analysis = true } = args;

      const statsReport = await pinService.getPinStatsReport(time_range);

      const trendAnalysis = {
        time_range_hours: time_range,
        summary: statsReport.summary,
        content_distribution: {
          content_types: statsReport.content_type_distribution,
          most_popular_type: this.getMostPopularContentType(statsReport.content_type_distribution),
        },
        activity_patterns: {
          hourly_activity: statsReport.hourly_activity,
          peak_hours: this.getPeakHours(statsReport.hourly_activity),
        },
        top_contributors: statsReport.top_authors.slice(0, 10),
        engagement_insights: this.generateEngagementInsights(statsReport),
      };

      if (include_sentiment_analysis) {
        // 获取情感分析数据
        const pins = await pinApi.getBatchPins(100, 2);
        const sentimentData = this.analyzeSentimentDistribution(pins);
        (trendAnalysis as any).sentiment_analysis = sentimentData;
      }

      return {
        content: [
          {
            type: 'text',
            text: `沸点趋势分析完成\n\n${JSON.stringify(trendAnalysis, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `沸点趋势分析失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理沸点推荐
   */
  async handleGetPinRecommendations(args: any) {
    try {
      const { user_interests = [], content_types = [], limit = 10, exclude_ids = [] } = args;

      const recommendations = await pinService.getPinRecommendations({
        user_interests,
        content_types,
        limit,
        exclude_ids,
      });

      return {
        content: [
          {
            type: 'text',
            text: `基于您的兴趣生成 ${recommendations.length} 个沸点推荐\n\n${JSON.stringify(
              {
                user_interests,
                content_type_preferences: content_types,
                recommendations: recommendations.map(rec => ({
                  id: rec.pin_id,
                  content: rec.content,
                  author: rec.author,
                  content_type: rec.content_type,
                  reason: rec.reason,
                  confidence: Math.round(rec.confidence * 100),
                })),
                total_recommendations: recommendations.length,
              },
              null,
              2
            )}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `生成沸点推荐失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 获取最受欢迎的内容类型
   */
  private getMostPopularContentType(distribution: any): string {
    let maxCount = 0;
    let mostPopular = 'general';

    Object.entries(distribution).forEach(([type, count]) => {
      if (typeof count === 'number' && count > maxCount) {
        maxCount = count;
        mostPopular = type;
      }
    });

    return mostPopular;
  }

  /**
   * 获取活跃高峰时段
   */
  private getPeakHours(hourlyActivity: any[]): number[] {
    return hourlyActivity
      .sort((a, b) => b.avg_engagement - a.avg_engagement)
      .slice(0, 3)
      .map(item => item.hour)
      .sort((a, b) => a - b);
  }

  /**
   * 生成参与度洞察
   */
  private generateEngagementInsights(statsReport: any): any {
    const summary = statsReport.summary;

    return {
      engagement_rate:
        summary.total_pins > 0
          ? (summary.total_diggs + summary.total_comments) / summary.total_pins
          : 0,
      interaction_ratio: summary.total_diggs > 0 ? summary.total_comments / summary.total_diggs : 0,
      activity_level: this.assessActivityLevel(summary),
      insights: this.generateInsightMessages(summary),
    };
  }

  /**
   * 评估活跃度等级
   */
  private assessActivityLevel(summary: any): string {
    const totalActivity = summary.total_diggs + summary.total_comments;

    if (totalActivity > 1000) return 'very_high';
    if (totalActivity > 500) return 'high';
    if (totalActivity > 200) return 'medium';
    return 'low';
  }

  /**
   * 生成洞察消息
   */
  private generateInsightMessages(summary: any): string[] {
    const insights = [];

    if (summary.avg_diggs_per_pin > 10) {
      insights.push('沸点获赞率较高，内容质量良好');
    }

    if (summary.avg_comments_per_pin > 2) {
      insights.push('讨论活跃，用户参与度高');
    }

    if (summary.total_pins > 100) {
      insights.push('发布频率高，社区活跃');
    }

    return insights;
  }

  /**
   * 分析情感分布
   */
  private analyzeSentimentDistribution(pins: any[]): any {
    const sentiments = pins.map(pin => pinService.analyzeSentiment(pin).sentiment);
    const distribution = sentiments.reduce(
      (acc, sentiment) => {
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const total = sentiments.length;
    const percentages = Object.entries(distribution).reduce(
      (acc, [sentiment, count]) => {
        acc[sentiment] = Math.round((count / total) * 100);
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      distribution,
      percentages,
      dominant_sentiment: this.getDominantSentiment(distribution),
      total_analyzed: total,
    };
  }

  /**
   * 获取主导情感
   */
  private getDominantSentiment(distribution: Record<string, number>): string {
    let maxCount = 0;
    let dominant = 'neutral';

    Object.entries(distribution).forEach(([sentiment, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = sentiment;
      }
    });

    return dominant;
  }
}

// 导出工具处理器实例
export const pinToolHandler = new PinToolHandler();
