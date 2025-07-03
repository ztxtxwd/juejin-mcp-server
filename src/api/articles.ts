import { apiClient } from './base.js';
import type { ArticleInfo, ArticleListParams, Category, Tag } from '../types/index.js';
import { JUEJIN_CONSTANTS } from '../utils/config.js';
import { articleCache, CacheKeyGenerator } from '../utils/cache.js';
import {
  globalConcurrencyController,
  globalRequestDeduplicator,
} from '../utils/batch-processor.js';

/**
 * 文章相关API
 */
export class ArticleApi {
  /**
   * 获取文章列表（带缓存优化）
   */
  async getArticleList(params: ArticleListParams = {}) {
    const cacheKey = CacheKeyGenerator.article(params);

    // 尝试从缓存获取
    const cached = articleCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 使用请求去重避免重复请求
    return globalRequestDeduplicator.execute(cacheKey, async () => {
      // 使用并发控制
      return globalConcurrencyController.execute(async () => {
        const requestData = {
          id_type: params.id_type || JUEJIN_CONSTANTS.ITEM_TYPE.ARTICLE,
          client_type: 2608,
          sort_type: params.sort_type || JUEJIN_CONSTANTS.SORT_TYPE.RECOMMEND,
          cursor: params.cursor || '0',
          limit: params.limit || 20,
        };

        const urlParams = {
          aid: '2608',
          uuid: '7114966512272967208',
        };

        const response = await apiClient.post<ArticleInfo[]>(
          JUEJIN_CONSTANTS.ENDPOINTS.ARTICLE_LIST,
          requestData,
          urlParams
        );

        // 过滤有效的文章数据并转换结构
        const validArticles = (response.data || [])
          .filter((item: any) => {
            return (
              item &&
              item.item_type === 2 && // 只要文章类型
              item.item_info &&
              item.item_info.article_info &&
              item.item_info.article_info.article_id
            );
          })
          .map((item: any) => {
            // 将嵌套的item_info结构平铺到顶层，保持与原有代码兼容
            return {
              ...item.item_info,
              item_type: item.item_type,
            };
          });

        const result = {
          articles: validArticles,
          cursor: response.cursor,
          has_more: response.has_more || false,
          count: response.count || 0,
        };

        // 缓存结果（5分钟TTL）
        articleCache.set(cacheKey, result, 300000);

        return result;
      });
    });
  }

  /**
   * 获取推荐文章
   */
  async getRecommendedArticles(limit: number = 20) {
    return this.getArticleList({
      sort_type: JUEJIN_CONSTANTS.SORT_TYPE.RECOMMEND,
      limit,
    });
  }

  /**
   * 获取最新文章
   */
  async getLatestArticles(limit: number = 20) {
    return this.getArticleList({
      sort_type: JUEJIN_CONSTANTS.SORT_TYPE.LATEST,
      limit,
    });
  }

  /**
   * 获取热榜文章
   */
  async getHotArticles(days: 3 | 7 | 30 = 7, limit: number = 20) {
    const sortTypeMap = {
      3: JUEJIN_CONSTANTS.SORT_TYPE.HOT_3_DAYS,
      7: JUEJIN_CONSTANTS.SORT_TYPE.HOT_7_DAYS,
      30: JUEJIN_CONSTANTS.SORT_TYPE.HOT_30_DAYS,
    };

    return this.getArticleList({
      sort_type: sortTypeMap[days],
      limit,
    });
  }

  /**
   * 按分类获取文章
   */
  async getArticlesByCategory(_categoryId: string, limit: number = 20) {
    // 注意：掘金API的分类筛选可能需要不同的端点
    // 这里先使用通用接口，后续可能需要调整
    return this.getArticleList({
      limit,
      // 分类筛选逻辑可能需要在业务层处理
    });
  }

  /**
   * 获取分类列表
   */
  async getCategoryList() {
    try {
      const response = await apiClient.get<Category[]>(JUEJIN_CONSTANTS.ENDPOINTS.CATEGORY_LIST);
      return response.data || [];
    } catch (error) {
      console.warn('[ArticleApi] Failed to get category list:', error);
      // 返回默认分类
      return this.getDefaultCategories();
    }
  }

  /**
   * 获取标签列表
   */
  async getTagList() {
    try {
      const response = await apiClient.get<Tag[]>(JUEJIN_CONSTANTS.ENDPOINTS.TAG_LIST);
      return response.data || [];
    } catch (error) {
      console.warn('[ArticleApi] Failed to get tag list:', error);
      return [];
    }
  }

  /**
   * 搜索文章（基于标题和内容）
   */
  async searchArticles(keyword: string, limit: number = 20) {
    // 掘金可能有专门的搜索API，这里先用基础接口模拟
    const articles = await this.getArticleList({ limit: limit * 2 });

    // 在客户端进行简单的关键词过滤
    const filteredArticles = articles.articles
      .filter((item: any) => {
        // 检查数据结构 - 现在数据已经平铺了
        if (!item || !item.article_info) return false;

        const article = item.article_info;
        const title = article.title || '';
        const content = article.brief_content || '';

        return (
          title.toLowerCase().includes(keyword.toLowerCase()) ||
          content.toLowerCase().includes(keyword.toLowerCase())
        );
      })
      .slice(0, limit);

    return {
      articles: filteredArticles,
      pins: [], // 搜索结果中没有沸点
      total: filteredArticles.length,
      cursor: articles.cursor,
      has_more: filteredArticles.length === limit,
    };
  }

  /**
   * 获取文章详细信息
   */
  async getArticleDetail(articleId: string) {
    // 这里需要具体的文章详情API端点
    // 目前先返回基础信息
    const articles = await this.getArticleList({ limit: 100 });
    const article = articles.articles.find(
      (item: any) => item.article_info.article_id === articleId
    );

    if (!article) {
      throw new Error(`Article not found: ${articleId}`);
    }

    return article;
  }

  /**
   * 获取默认分类（当API失败时使用）
   */
  private getDefaultCategories(): Category[] {
    return [
      {
        category_id: JUEJIN_CONSTANTS.CATEGORY_ID.FRONTEND,
        category_name: '前端',
        category_url: 'frontend',
        rank: 1,
        icon: '',
      },
      {
        category_id: JUEJIN_CONSTANTS.CATEGORY_ID.BACKEND,
        category_name: '后端',
        category_url: 'backend',
        rank: 2,
        icon: '',
      },
      {
        category_id: JUEJIN_CONSTANTS.CATEGORY_ID.ANDROID,
        category_name: 'Android',
        category_url: 'android',
        rank: 3,
        icon: '',
      },
      {
        category_id: JUEJIN_CONSTANTS.CATEGORY_ID.IOS,
        category_name: 'iOS',
        category_url: 'ios',
        rank: 4,
        icon: '',
      },
      {
        category_id: JUEJIN_CONSTANTS.CATEGORY_ID.AI,
        category_name: '人工智能',
        category_url: 'ai',
        rank: 5,
        icon: '',
      },
    ];
  }

  /**
   * 批量获取文章（用于数据分析）
   */
  async getBatchArticles(batchSize: number = 100, maxBatches: number = 5) {
    const allArticles: ArticleInfo[] = [];
    let cursor = '0';
    let batchCount = 0;

    while (batchCount < maxBatches) {
      try {
        const result = await this.getArticleList({
          cursor,
          limit: batchSize,
        });

        allArticles.push(...result.articles);

        if (!result.has_more || !result.cursor) {
          break;
        }

        cursor = result.cursor;
        batchCount++;

        // 避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`[ArticleApi] Batch ${batchCount} failed:`, error);
        break;
      }
    }

    return allArticles;
  }
}

// 导出单例实例
export const articleApi = new ArticleApi();
