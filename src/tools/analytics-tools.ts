import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { analyticsService } from '../services/analytics-service.js';
import { trendAnalyzer } from '../analyzers/trend-analyzer.js';
import { userAnalyzer } from '../analyzers/user-analyzer.js';
import { contentAnalyzer } from '../analyzers/content-analyzer.js';

/**
 * 分析相关MCP工具
 */
export const analyticsTools: Tool[] = [
  {
    name: 'analyze_trends',
    description: '分析当前热门趋势和话题，识别上升趋势和跨平台热点',
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
        category: {
          type: 'string',
          description: '分析的分类领域',
        },
        include_predictions: {
          type: 'boolean',
          description: '是否包含趋势预测',
          default: true,
        },
      },
    },
  },
  {
    name: 'get_simple_trends',
    description: '获取简化版趋势分析，基于当前数据快速分析热门标签和话题',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '返回趋势数量',
          default: 10,
          minimum: 5,
          maximum: 30,
        },
        include_authors: {
          type: 'boolean',
          description: '是否包含活跃作者分析',
          default: true,
        },
      },
    },
  },
  {
    name: 'analyze_content_quality',
    description: '评估内容质量和受欢迎程度，提供详细的质量分析报告',
    inputSchema: {
      type: 'object',
      properties: {
        content_id: {
          type: 'string',
          description: '内容ID（文章或沸点）',
        },
        content_type: {
          type: 'string',
          description: '内容类型',
          enum: ['article', 'pin'],
        },
        include_improvement_suggestions: {
          type: 'boolean',
          description: '是否包含改进建议',
          default: true,
        },
      },
      required: ['content_id', 'content_type'],
    },
  },
  {
    name: 'analyze_user_interests',
    description: '分析用户兴趣和行为模式，构建用户画像',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: '用户ID',
        },
        include_behavior_analysis: {
          type: 'boolean',
          description: '是否包含行为分析',
          default: true,
        },
        include_similarity_analysis: {
          type: 'boolean',
          description: '是否包含相似用户分析',
          default: false,
        },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'generate_trend_report',
    description: '生成综合趋势分析报告，包含跨平台数据和预测',
    inputSchema: {
      type: 'object',
      properties: {
        time_range: {
          type: 'number',
          description: '报告时间范围（小时）',
          default: 24,
          minimum: 1,
          maximum: 168,
        },
        include_platform_insights: {
          type: 'boolean',
          description: '是否包含平台洞察',
          default: true,
        },
      },
    },
  },
  {
    name: 'compare_content',
    description: '比较不同内容的表现和特征',
    inputSchema: {
      type: 'object',
      properties: {
        content_ids: {
          type: 'array',
          items: { type: 'string' },
          description: '要比较的内容ID列表',
          minItems: 2,
          maxItems: 5,
        },
        content_type: {
          type: 'string',
          description: '内容类型',
          enum: ['article', 'pin'],
        },
        comparison_metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['quality', 'engagement', 'trending_potential', 'readability'],
          },
          description: '比较维度',
          default: ['quality', 'engagement'],
        },
      },
      required: ['content_ids', 'content_type'],
    },
  },
  {
    name: 'predict_popularity',
    description: '预测内容受欢迎程度和传播潜力',
    inputSchema: {
      type: 'object',
      properties: {
        content_id: {
          type: 'string',
          description: '内容ID',
        },
        content_type: {
          type: 'string',
          description: '内容类型',
          enum: ['article', 'pin'],
        },
        prediction_horizon: {
          type: 'number',
          description: '预测时间范围（小时）',
          default: 24,
          minimum: 1,
          maximum: 168,
        },
      },
      required: ['content_id', 'content_type'],
    },
  },
];

/**
 * 分析工具处理器
 */
export class AnalyticsToolHandler {
  /**
   * 处理趋势分析
   */
  async handleAnalyzeTrends(args: any) {
    try {
      const { time_range = 24, category, include_predictions = true } = args;

      const trendAnalysis = await trendAnalyzer.analyzeTrends(time_range);

      let filteredTopics = trendAnalysis.trending_topics;
      if (category) {
        filteredTopics = trendAnalysis.trending_topics.filter(topic =>
          topic.topic.toLowerCase().includes(category.toLowerCase())
        );
      }

      const analysis = {
        time_range_hours: time_range,
        category_filter: category,
        trending_topics: filteredTopics.slice(0, 20).map(topic => ({
          topic: topic.topic,
          score: Math.round(topic.score),
          growth_rate: Math.round(topic.growth_rate * 100),
          article_count: topic.article_count,
          total_engagement: topic.total_engagement,
          cross_platform: topic.cross_platform,
          trend_strength: topic.trend_strength,
        })),
        hot_tags: trendAnalysis.hot_tags.slice(0, 15).map(tag => ({
          tag: tag.tag_name,
          heat_score: Math.round(tag.heat_score),
          recent_articles: tag.recent_articles,
          growth_momentum: tag.growth_momentum,
        })),
        analysis_summary: {
          total_trending_topics: filteredTopics.length,
          strong_trends: filteredTopics.filter(
            t => t.trend_strength === 'strong' || t.trend_strength === 'viral'
          ).length,
          cross_platform_trends: filteredTopics.filter(t => t.cross_platform).length,
        },
      };

      if (include_predictions && filteredTopics.length > 0) {
        const topTopic = filteredTopics[0];
        const prediction = await trendAnalyzer.predictTrendEvolution(topTopic.topic, time_range);
        (analysis as any).trend_prediction = prediction;
      }

      return {
        content: [
          {
            type: 'text',
            text: `趋势分析完成\n\n${JSON.stringify(analysis, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `趋势分析失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理内容质量分析
   */
  async handleAnalyzeContentQuality(args: any) {
    try {
      const { content_id, content_type, include_improvement_suggestions = true } = args;

      // 根据内容类型获取内容
      let content;
      if (content_type === 'article') {
        const { articleApi } = await import('../api/articles.js');
        content = await articleApi.getArticleDetail(content_id);
      } else {
        const { pinApi } = await import('../api/pins.js');
        content = await pinApi.getPinDetail(content_id);
      }

      // 进行质量分析
      const qualityAnalysis = contentAnalyzer.analyzeContentQuality(content, content_type);
      const classification = contentAnalyzer.classifyContent(content, content_type);

      const analysis = {
        content_id,
        content_type,
        title:
          content_type === 'article'
            ? content.article_info.title
            : content.msg_Info.content.substring(0, 50) + '...',
        quality_analysis: {
          overall_score: qualityAnalysis.quality_score,
          factors: qualityAnalysis.factors,
          prediction: qualityAnalysis.prediction,
        },
        content_classification: classification,
        performance_metrics: this.calculatePerformanceMetrics(content, content_type),
      };

      if (include_improvement_suggestions) {
        (analysis as any).improvement_suggestions = this.generateImprovementSuggestions(
          qualityAnalysis,
          content_type
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `内容质量分析完成\n\n${JSON.stringify(analysis, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `内容质量分析失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理用户兴趣分析
   */
  async handleAnalyzeUserInterests(args: any) {
    try {
      const {
        user_id,
        include_behavior_analysis = true,
        include_similarity_analysis = false,
      } = args;

      const userProfile = await userAnalyzer.analyzeUserBehavior(user_id);

      const analysis = {
        user_id,
        basic_info: userProfile.basic_info,
        interests_analysis: {
          primary_interests:
            (userProfile.creation_pattern.topic_diversity as any).top_topics?.slice(0, 10) || [],
          interest_diversity:
            (userProfile.creation_pattern.topic_diversity as any).diversity_level || 'unknown',
          expertise_areas: userProfile.user_type,
        },
        activity_pattern: {
          content_frequency: userProfile.creation_pattern.content_frequency.frequency_level,
          preferred_format: userProfile.creation_pattern.preferred_formats.preferred_format,
          engagement_style: userProfile.interaction_pattern.engagement_style,
          community_involvement: userProfile.interaction_pattern.community_involvement,
        },
        user_classification: userProfile.user_type,
        behavior_score: userProfile.behavior_score,
      };

      if (include_behavior_analysis) {
        (analysis as any).detailed_behavior = {
          creation_pattern: userProfile.creation_pattern,
          interaction_pattern: userProfile.interaction_pattern,
          growth_trajectory: userProfile.growth_trajectory,
        };
      }

      if (include_similarity_analysis) {
        // 这里可以添加相似用户分析
        (analysis as any).similar_users_hint = '相似用户分析需要额外的用户ID进行比较';
      }

      return {
        content: [
          {
            type: 'text',
            text: `用户兴趣分析完成\n\n${JSON.stringify(analysis, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `用户兴趣分析失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理简化趋势分析
   */
  async handleGetSimpleTrends(args: any) {
    try {
      const { limit = 10, include_authors = true } = args;

      // 获取基础数据
      const { articleApi } = await import('../api/articles.js');
      const { pinApi } = await import('../api/pins.js');

      const [articles, pins] = await Promise.all([
        articleApi.getBatchArticles(50, 1),
        pinApi.getBatchPins(50, 1),
      ]);

      console.error(`[SimpleTrends] 获取数据: ${articles.length} 篇文章, ${pins.length} 个沸点`);

      // 简化版趋势分析
      const trends = this.analyzeSimpleTrends(articles, pins, limit, include_authors);

      return {
        content: [
          {
            type: 'text',
            text: `简化趋势分析完成\n\n${JSON.stringify(trends, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `简化趋势分析失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 简化版趋势分析实现
   */
  private analyzeSimpleTrends(
    articles: any[],
    pins: any[],
    limit: number,
    includeAuthors: boolean
  ) {
    const tagCount = new Map<
      string,
      { count: number; articles: number; pins: number; engagement: number }
    >();
    const authorCount = new Map<
      string,
      { count: number; totalEngagement: number; articles: string[] }
    >();
    const categoryCount = new Map<string, { count: number; engagement: number }>();

    // 分析文章
    articles.forEach(article => {
      const info = article.article_info || {};
      const engagement =
        (info.digg_count || 0) + (info.comment_count || 0) + (info.view_count || 0) * 0.01;

      // 统计标签
      if (article.tags) {
        article.tags.forEach((tag: any) => {
          const tagName = tag.tag_name || tag;
          if (tagName && tagName.length > 1) {
            const current = tagCount.get(tagName) || {
              count: 0,
              articles: 0,
              pins: 0,
              engagement: 0,
            };
            tagCount.set(tagName, {
              count: current.count + 1,
              articles: current.articles + 1,
              pins: current.pins,
              engagement: current.engagement + engagement,
            });
          }
        });
      }

      // 统计作者
      if (includeAuthors) {
        const authorName = article.author_user_info?.user_name;
        if (authorName) {
          const current = authorCount.get(authorName) || {
            count: 0,
            totalEngagement: 0,
            articles: [],
          };
          authorCount.set(authorName, {
            count: current.count + 1,
            totalEngagement: current.totalEngagement + engagement,
            articles: [...current.articles, info.title || '未知标题'].slice(0, 3),
          });
        }
      }

      // 统计分类
      const categoryName = article.category?.category_name;
      if (categoryName) {
        const current = categoryCount.get(categoryName) || { count: 0, engagement: 0 };
        categoryCount.set(categoryName, {
          count: current.count + 1,
          engagement: current.engagement + engagement,
        });
      }
    });

    // 分析沸点
    pins.forEach(pin => {
      const info = pin.msg_Info || {};
      const engagement = (info.digg_count || 0) + (info.comment_count || 0);

      // 从沸点内容中提取话题标签
      const content = info.content || '';
      const hashtagMatches = content.match(/#([^#\s]+)/g);
      if (hashtagMatches) {
        hashtagMatches.forEach((tag: string) => {
          const tagName = tag.substring(1);
          if (tagName.length > 1) {
            const current = tagCount.get(tagName) || {
              count: 0,
              articles: 0,
              pins: 0,
              engagement: 0,
            };
            tagCount.set(tagName, {
              count: current.count + 1,
              articles: current.articles,
              pins: current.pins + 1,
              engagement: current.engagement + engagement,
            });
          }
        });
      }

      // 话题信息
      if (pin.topic?.title) {
        const topicName = pin.topic.title;
        const current = tagCount.get(topicName) || {
          count: 0,
          articles: 0,
          pins: 0,
          engagement: 0,
        };
        tagCount.set(topicName, {
          count: current.count + 1,
          articles: current.articles,
          pins: current.pins + 1,
          engagement: current.engagement + engagement,
        });
      }
    });

    // 生成结果
    const result: any = {
      analysis_time: new Date().toISOString(),
      data_sources: {
        articles_analyzed: articles.length,
        pins_analyzed: pins.length,
      },
      trending_topics: Array.from(tagCount.entries())
        .map(([topic, data]) => ({
          topic,
          total_mentions: data.count,
          article_mentions: data.articles,
          pin_mentions: data.pins,
          total_engagement: Math.round(data.engagement),
          trend_score: Math.round(data.engagement + data.count * 10),
          cross_platform: data.articles > 0 && data.pins > 0,
        }))
        .sort((a, b) => b.trend_score - a.trend_score)
        .slice(0, limit),

      hot_categories: Array.from(categoryCount.entries())
        .map(([category, data]) => ({
          category,
          article_count: data.count,
          avg_engagement: Math.round(data.engagement / data.count),
          total_engagement: Math.round(data.engagement),
        }))
        .sort((a, b) => b.total_engagement - a.total_engagement)
        .slice(0, Math.min(limit, 5)),
    };

    if (includeAuthors) {
      result.active_authors = Array.from(authorCount.entries())
        .map(([author, data]) => ({
          author_name: author,
          article_count: data.count,
          total_engagement: Math.round(data.totalEngagement),
          avg_engagement: Math.round(data.totalEngagement / data.count),
          recent_articles: data.articles,
        }))
        .sort((a, b) => b.total_engagement - a.total_engagement)
        .slice(0, Math.min(limit, 8));
    }

    return result;
  }

  /**
   * 处理生成趋势报告
   */
  async handleGenerateTrendReport(args: any) {
    try {
      const { time_range = 24, include_platform_insights = true } = args;

      const trendReport = await analyticsService.generateTrendReport(time_range);

      const report = {
        report_metadata: {
          time_range_hours: time_range,
          analysis_time: trendReport.analysis_time,
          data_sources: ['articles', 'pins', 'topics'],
        },
        executive_summary: trendReport.summary,
        trending_analysis: {
          cross_platform_trends: trendReport.cross_platform_trends.slice(0, 10),
          article_trends: {
            top_tags: trendReport.article_trends.tag_trends.slice(0, 10),
            category_performance: trendReport.article_trends.category_trends,
          },
          pin_trends: {
            content_types: trendReport.pin_trends.content_type_trends,
            viral_content: trendReport.pin_trends.viral_pins.slice(0, 5),
          },
        },
        predictions: trendReport.trend_predictions,
        recommendations: this.generateTrendRecommendations(trendReport),
      };

      if (include_platform_insights) {
        const platformInsights = await analyticsService.generatePlatformInsights();
        (report as any).platform_insights = {
          platform_health: platformInsights.platform_health,
          content_ecosystem: platformInsights.content_ecosystem,
          growth_opportunities: platformInsights.growth_opportunities,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `趋势报告生成完成\n\n${JSON.stringify(report, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `生成趋势报告失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理内容比较
   */
  async handleCompareContent(args: any) {
    try {
      const { content_ids, content_type, comparison_metrics = ['quality', 'engagement'] } = args;

      const comparisons = [];

      for (const contentId of content_ids) {
        try {
          let content;
          if (content_type === 'article') {
            const { articleApi } = await import('../api/articles.js');
            content = await articleApi.getArticleDetail(contentId);
          } else {
            const { pinApi } = await import('../api/pins.js');
            content = await pinApi.getPinDetail(contentId);
          }

          const analysis = contentAnalyzer.analyzeContentQuality(content, content_type);
          const metrics = this.calculatePerformanceMetrics(content, content_type);

          comparisons.push({
            content_id: contentId,
            title:
              content_type === 'article'
                ? content.article_info.title
                : content.msg_Info.content.substring(0, 50) + '...',
            quality_score: analysis.quality_score,
            engagement_metrics: metrics,
            trending_potential: analysis.prediction.trending_probability,
            classification: contentAnalyzer.classifyContent(content, content_type),
          });
        } catch (error) {
          comparisons.push({
            content_id: contentId,
            error: `分析失败: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const comparison = {
        content_type,
        comparison_metrics,
        content_comparisons: comparisons,
        summary: this.generateComparisonSummary(comparisons, comparison_metrics),
      };

      return {
        content: [
          {
            type: 'text',
            text: `内容比较分析完成\n\n${JSON.stringify(comparison, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `内容比较失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理受欢迎程度预测
   */
  async handlePredictPopularity(args: any) {
    try {
      const { content_id, content_type, prediction_horizon = 24 } = args;

      // 获取内容
      let content;
      if (content_type === 'article') {
        const { articleApi } = await import('../api/articles.js');
        content = await articleApi.getArticleDetail(content_id);
      } else {
        const { pinApi } = await import('../api/pins.js');
        content = await pinApi.getPinDetail(content_id);
      }

      // 进行质量分析和预测
      const qualityAnalysis = contentAnalyzer.analyzeContentQuality(content, content_type);
      const currentMetrics = this.calculatePerformanceMetrics(content, content_type);

      const prediction = {
        content_id,
        content_type,
        prediction_horizon_hours: prediction_horizon,
        current_performance: currentMetrics,
        quality_factors: qualityAnalysis.factors,
        predictions: {
          ...qualityAnalysis.prediction,
          confidence_level: this.calculatePredictionConfidence(qualityAnalysis, currentMetrics),
        },
        risk_factors: this.identifyRiskFactors(qualityAnalysis, content_type),
        optimization_suggestions: this.generateOptimizationSuggestions(
          qualityAnalysis,
          content_type
        ),
      };

      return {
        content: [
          {
            type: 'text',
            text: `受欢迎程度预测完成\n\n${JSON.stringify(prediction, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `受欢迎程度预测失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // 辅助方法
  private calculatePerformanceMetrics(content: any, contentType: string) {
    if (contentType === 'article') {
      const article = content.article_info;
      return {
        views: article.view_count,
        likes: article.digg_count,
        comments: article.comment_count,
        collects: article.collect_count,
        engagement_rate:
          article.view_count > 0
            ? (article.digg_count + article.comment_count + article.collect_count) /
              article.view_count
            : 0,
      };
    } else {
      const pin = content.msg_Info;
      return {
        likes: pin.digg_count,
        comments: pin.comment_count,
        engagement_rate: pin.digg_count + pin.comment_count,
      };
    }
  }

  private generateImprovementSuggestions(qualityAnalysis: any, contentType: string): string[] {
    const suggestions = [];

    if (qualityAnalysis.quality_score < 70) {
      suggestions.push('提升整体内容质量');
    }

    if (qualityAnalysis.factors.engagement_rate < 50) {
      suggestions.push('增加互动元素，提高用户参与度');
    }

    if (qualityAnalysis.factors.content_depth < 60) {
      suggestions.push('增加内容深度和技术细节');
    }

    if (contentType === 'article' && qualityAnalysis.factors.originality < 70) {
      suggestions.push('提高内容原创性，避免模板化');
    }

    return suggestions;
  }

  private generateTrendRecommendations(trendReport: any): string[] {
    const recommendations = [];

    if (trendReport.summary.strong_trends_count > 5) {
      recommendations.push('当前有多个强势趋势，建议关注跨平台热点');
    }

    if (trendReport.cross_platform_trends.length > 0) {
      const topTrend = trendReport.cross_platform_trends[0];
      recommendations.push(`重点关注话题：${topTrend.topic}`);
    }

    recommendations.push('建议定期监控趋势变化，及时调整内容策略');

    return recommendations;
  }

  private generateComparisonSummary(comparisons: any[], _metrics: string[]) {
    const validComparisons = comparisons.filter(c => !c.error);

    if (validComparisons.length === 0) {
      return { error: '没有有效的比较数据' };
    }

    const bestPerformer = validComparisons.reduce((best, current) =>
      current.quality_score > best.quality_score ? current : best
    );

    return {
      total_compared: validComparisons.length,
      best_performer: {
        content_id: bestPerformer.content_id,
        quality_score: bestPerformer.quality_score,
      },
      average_quality:
        validComparisons.reduce((sum, c) => sum + c.quality_score, 0) / validComparisons.length,
      quality_range: {
        min: Math.min(...validComparisons.map(c => c.quality_score)),
        max: Math.max(...validComparisons.map(c => c.quality_score)),
      },
    };
  }

  private calculatePredictionConfidence(qualityAnalysis: any, currentMetrics: any): number {
    let confidence = 0.5;

    if (qualityAnalysis.quality_score > 80) confidence += 0.2;
    if (currentMetrics.engagement_rate > 0.05) confidence += 0.2;
    if (qualityAnalysis.prediction.trending_probability > 0.7) confidence += 0.1;

    return Math.min(confidence, 0.9);
  }

  private identifyRiskFactors(qualityAnalysis: any, contentType: string): string[] {
    const risks = [];

    if (qualityAnalysis.quality_score < 50) {
      risks.push('内容质量偏低');
    }

    if (qualityAnalysis.factors.engagement_rate < 30) {
      risks.push('用户参与度不足');
    }

    if (contentType === 'article' && qualityAnalysis.factors.content_depth < 40) {
      risks.push('内容深度不够');
    }

    return risks;
  }

  private generateOptimizationSuggestions(qualityAnalysis: any, contentType: string): string[] {
    const suggestions = [];

    if (qualityAnalysis.factors.engagement_rate < 60) {
      suggestions.push('优化标题和开头，提高吸引力');
    }

    if (contentType === 'article') {
      suggestions.push('添加高质量的图片和代码示例');
      suggestions.push('优化文章结构，使用小标题分段');
    } else {
      suggestions.push('增加互动性内容，如问题或投票');
      suggestions.push('使用相关话题标签增加曝光');
    }

    return suggestions;
  }
}

// 导出工具处理器实例
export const analyticsToolHandler = new AnalyticsToolHandler();
