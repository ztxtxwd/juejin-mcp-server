import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { articleApi } from '../api/articles.js';
import { ArticleService } from '../services/article-service.js';

const articleService = new ArticleService();
import { contentAnalyzer } from '../analyzers/content-analyzer.js';

/**
 * 文章相关MCP工具
 */
export const articleTools: Tool[] = [
  {
    name: 'get_articles',
    description: '获取掘金文章列表，支持分类、排序、分页等参数，包含质量评分和趋势分析',
    inputSchema: {
      type: 'object',
      properties: {
        sort_type: {
          type: 'number',
          description: '排序类型：200推荐，300最新，3热榜3天，7热榜7天，30热榜30天',
          default: 200,
        },
        category_id: {
          type: 'string',
          description: '分类ID，如前端、后端等',
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
        include_quality_score: {
          type: 'boolean',
          description: '是否包含质量评分',
          default: true,
        },
        include_trend_info: {
          type: 'boolean',
          description: '是否包含趋势信息',
          default: false,
        },
        min_quality_score: {
          type: 'number',
          description: '最低质量分数过滤',
          minimum: 0,
          maximum: 100,
        },
      },
    },
  },
  {
    name: 'search_articles',
    description: '搜索掘金文章，支持关键词搜索和智能过滤',
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
        include_analysis: {
          type: 'boolean',
          description: '是否包含内容分析',
          default: false,
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_article_recommendations',
    description: '获取个性化文章推荐，基于用户兴趣和内容质量',
    inputSchema: {
      type: 'object',
      properties: {
        user_interests: {
          type: 'array',
          items: { type: 'string' },
          description: '用户兴趣标签列表',
        },
        limit: {
          type: 'number',
          description: '推荐数量',
          default: 10,
          maximum: 30,
        },
        min_quality_score: {
          type: 'number',
          description: '最低质量分数',
          default: 60,
          minimum: 0,
          maximum: 100,
        },
        exclude_ids: {
          type: 'array',
          items: { type: 'string' },
          description: '排除的文章ID列表',
        },
      },
    },
  },
  {
    name: 'analyze_article_quality',
    description: '分析文章质量，提供详细的质量评估和改进建议',
    inputSchema: {
      type: 'object',
      properties: {
        article_id: {
          type: 'string',
          description: '文章ID',
        },
        include_predictions: {
          type: 'boolean',
          description: '是否包含表现预测',
          default: true,
        },
      },
      required: ['article_id'],
    },
  },
  {
    name: 'get_trending_articles',
    description: '获取热门趋势文章，基于实时数据分析',
    inputSchema: {
      type: 'object',
      properties: {
        time_range: {
          type: 'number',
          description: '时间范围（小时）',
          default: 24,
          minimum: 1,
          maximum: 168,
        },
        category: {
          type: 'string',
          description: '分类过滤',
        },
        limit: {
          type: 'number',
          description: '返回数量',
          default: 15,
          maximum: 50,
        },
      },
    },
  },
];

/**
 * 文章工具处理器
 */
export class ArticleToolHandler {
  /**
   * 处理获取文章列表
   */
  async handleGetArticles(args: any) {
    try {
      const {
        sort_type = 200,
        category_id,
        limit = 20,
        // cursor, // 暂时未使用
        include_quality_score = true,
        min_quality_score,
      } = args;

      // 获取增强的文章列表
      const result = await articleService.getArticles(
        sort_type,
        limit,
        category_id,
        include_quality_score
      );

      // 应用质量过滤
      let filteredArticles = result.articles;
      if (min_quality_score !== undefined) {
        filteredArticles = result.articles.filter(
          (article: any) => article.quality_score >= min_quality_score
        );
      }

      const response = {
        articles: filteredArticles.map((article: any) => ({
          id: article.article_info?.article_id || '',
          title: article.article_info?.title || '无标题',
          brief: article.article_info?.brief_content || '',
          author: article.author_user_info?.user_name || '匿名用户',
          category: article.category?.category_name || '未分类',
          tags: (article.tags || []).map((tag: any) => tag?.tag_name || ''),
          stats: {
            views: article.article_info?.view_count || 0,
            likes: article.article_info?.digg_count || 0,
            comments: article.article_info?.comment_count || 0,
            collects: article.article_info?.collect_count || 0,
          },
          quality_score: article.quality_score || 0,
          trend_info: article.trend_info || {},
          readability: article.readability || {},
          publish_time: article.article_info?.rtime || '',
        })),
        total_count: filteredArticles.length,
        has_more: result.has_more,
        cursor: result.cursor,
      };

      return {
        content: [
          {
            type: 'text',
            text: `成功获取 ${filteredArticles.length} 篇文章\n\n${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取文章列表失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理搜索文章
   */
  async handleSearchArticles(args: any) {
    try {
      const { keyword, limit = 20, include_analysis = false } = args;

      const result = await articleApi.searchArticles(keyword, limit);

      const articles = await Promise.all(
        result.articles.map(async (article: any) => {
          const basicInfo = {
            id: article.article_info?.article_id || '',
            title: article.article_info?.title || '无标题',
            brief: article.article_info?.brief_content || '',
            author: article.author_user_info?.user_name || '匿名用户',
            category: article.category?.category_name || '未分类',
            tags: (article.tags || []).map((tag: any) => tag?.tag_name || ''),
            stats: {
              views: article.article_info?.view_count || 0,
              likes: article.article_info?.digg_count || 0,
              comments: article.article_info?.comment_count || 0,
            },
            publish_time: article.article_info?.rtime || '',
          };

          if (include_analysis) {
            const analysis = contentAnalyzer.analyzeContentQuality(article, 'article');
            return {
              ...basicInfo,
              quality_analysis: analysis,
              content_classification: contentAnalyzer.classifyContent(article, 'article'),
            };
          }

          return basicInfo;
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: `搜索关键词 "${keyword}" 找到 ${articles.length} 篇文章\n\n${JSON.stringify(
              {
                keyword,
                articles,
                total_found: articles.length,
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
            text: `搜索文章失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理文章推荐
   */
  async handleGetArticleRecommendations(args: any) {
    try {
      const { user_interests = [], limit = 10 } = args;

      const recommendations = await articleService.getRecommendations(user_interests, limit);

      return {
        content: [
          {
            type: 'text',
            text: `基于您的兴趣生成 ${recommendations.length} 个文章推荐\n\n${JSON.stringify(
              {
                user_interests,
                recommendations: recommendations.map((rec: any) => ({
                  id: rec.article_id,
                  title: rec.title,
                  reason: rec.reason,
                  confidence: Math.round(rec.confidence * 100),
                  category: rec.category,
                  tags: rec.tags,
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
            text: `生成文章推荐失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理文章质量分析
   */
  async handleAnalyzeArticleQuality(args: any) {
    try {
      const { article_id, include_predictions = true } = args;

      if (!article_id) {
        throw new Error('文章ID不能为空');
      }

      // 获取文章详情
      let article;
      try {
        article = await articleApi.getArticleDetail(article_id);
      } catch (error) {
        // 如果获取详情失败，尝试从文章列表中查找
        const articles = await articleApi.getArticleList({ limit: 50 });
        article = articles.articles.find(
          (item: any) => item.article_info?.article_id === article_id
        );

        if (!article) {
          throw new Error(`未找到文章: ${article_id}`);
        }
      }

      // 进行质量分析
      const qualityAnalysis = contentAnalyzer.analyzeContentQuality(article, 'article');
      const classification = contentAnalyzer.classifyContent(article, 'article');

      const analysis = {
        article_id,
        title: article.article_info?.title || '无标题',
        author: article.author_user_info?.user_name || '未知作者',
        quality_analysis: qualityAnalysis,
        content_classification: classification,
        improvement_suggestions: this.generateImprovementSuggestions(qualityAnalysis),
        analysis_timestamp: new Date().toISOString(),
      };

      if (include_predictions) {
        (analysis as any).performance_prediction = qualityAnalysis.prediction;
      }

      return {
        content: [
          {
            type: 'text',
            text: `文章质量分析完成\n\n${JSON.stringify(analysis, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `文章质量分析失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理获取热门文章
   */
  async handleGetTrendingArticles(args: any) {
    try {
      const { time_range = 24, category, limit = 15 } = args;

      // 获取热门文章
      const articles = await articleApi.getHotArticles(
        time_range <= 72 ? 3 : time_range <= 168 ? 7 : 30,
        limit
      );

      // 过滤分类
      let filteredArticles = articles.articles;
      if (category) {
        filteredArticles = articles.articles.filter((article: any) =>
          article.category?.category_name?.includes(category)
        );
      }

      const trendingArticles = filteredArticles.map((article: any) => ({
        id: article.article_info?.article_id || '',
        title: article.article_info?.title || '无标题',
        author: article.author_user_info?.user_name || '匿名用户',
        category: article.category?.category_name || '未分类',
        hot_index: article.article_info?.hot_index || 0,
        stats: {
          views: article.article_info?.view_count || 0,
          likes: article.article_info?.digg_count || 0,
          comments: article.article_info?.comment_count || 0,
        },
        trending_score:
          (article.article_info?.hot_index || 0) + (article.article_info?.digg_count || 0) * 0.1,
        publish_time: article.article_info?.rtime || '',
      }));

      return {
        content: [
          {
            type: 'text',
            text: `获取到 ${trendingArticles.length} 篇热门文章\n\n${JSON.stringify(
              {
                time_range_hours: time_range,
                category_filter: category,
                trending_articles: trendingArticles,
                total_count: trendingArticles.length,
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
            text: `获取热门文章失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 生成改进建议
   */
  private generateImprovementSuggestions(qualityAnalysis: any): string[] {
    const suggestions = [];

    if (qualityAnalysis.factors.engagement_rate < 50) {
      suggestions.push('提高内容互动性，增加问题或讨论点');
    }

    if (qualityAnalysis.factors.content_depth < 60) {
      suggestions.push('增加内容深度，提供更多技术细节');
    }

    if (qualityAnalysis.factors.originality < 70) {
      suggestions.push('增强内容原创性，避免模板化表达');
    }

    if (qualityAnalysis.quality_score < 70) {
      suggestions.push('优化标题吸引力和内容结构');
      suggestions.push('添加高质量的配图或代码示例');
    }

    return suggestions;
  }
}

// 导出工具处理器实例
export const articleToolHandler = new ArticleToolHandler();
