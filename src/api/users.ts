import { apiClient } from './base.js';
import type { UserInfo } from '../types/index.js';
import { JUEJIN_CONSTANTS } from '../utils/config.js';

/**
 * 用户相关API
 */
export class UserApi {
  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string) {
    try {
      const response = await apiClient.get<UserInfo>(JUEJIN_CONSTANTS.ENDPOINTS.USER_INFO, {
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      console.warn(`[UserApi] Failed to get user info for ${userId}:`, error);
      throw new Error(`User not found: ${userId}`);
    }
  }

  /**
   * 批量获取用户信息
   */
  async getBatchUserInfo(userIds: string[]) {
    const users: UserInfo[] = [];
    const errors: Array<{ userId: string; error: string }> = [];

    // 并发获取用户信息，但限制并发数
    const batchSize = 5;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const promises = batch.map(async userId => {
        try {
          const user = await this.getUserInfo(userId);
          return { success: true, user, userId };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            userId,
          };
        }
      });

      const results = await Promise.all(promises);

      results.forEach(result => {
        if (result.success && result.user) {
          users.push(result.user);
        } else {
          errors.push({
            userId: result.userId || 'unknown',
            error: result.error || 'Unknown error',
          });
        }
      });

      // 避免请求过于频繁
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { users, errors };
  }

  /**
   * 获取推荐作者列表
   */
  async getRecommendedAuthors(limit: number = 20) {
    try {
      // 这里需要具体的推荐作者API端点
      // 目前先通过文章数据来获取活跃作者
      const { articleApi } = await import('./articles.js');
      const articles = await articleApi.getBatchArticles(100, 2);

      // 统计作者活跃度
      const authorMap = new Map<
        string,
        {
          user: UserInfo;
          article_count: number;
          total_diggs: number;
          total_views: number;
        }
      >();

      articles.forEach(articleInfo => {
        const user = articleInfo.author_user_info;
        const article = articleInfo.article_info;
        const userId = user.user_id;

        if (authorMap.has(userId)) {
          const author = authorMap.get(userId)!;
          author.article_count++;
          author.total_diggs += article.digg_count;
          author.total_views += article.view_count;
        } else {
          authorMap.set(userId, {
            user,
            article_count: 1,
            total_diggs: article.digg_count,
            total_views: article.view_count,
          });
        }
      });

      // 计算推荐分数并排序
      const recommendedAuthors = Array.from(authorMap.values())
        .map(author => ({
          ...author,
          score:
            author.article_count * 0.3 +
            author.total_diggs * 0.4 +
            author.total_views * 0.0001 +
            author.user.level * 0.3,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return recommendedAuthors;
    } catch (error) {
      console.warn('[UserApi] Failed to get recommended authors:', error);
      return [];
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(keyword: string, limit: number = 20) {
    try {
      // 通过文章和沸点数据来搜索用户
      const { articleApi } = await import('./articles.js');
      const { pinApi } = await import('./pins.js');

      const [articles, pins] = await Promise.all([
        articleApi.getBatchArticles(50, 1),
        pinApi.getBatchPins(50, 1),
      ]);

      const userMap = new Map<string, UserInfo>();

      // 从文章中收集用户
      articles.forEach(articleInfo => {
        const user = articleInfo.author_user_info;
        if (
          user.user_name.toLowerCase().includes(keyword.toLowerCase()) ||
          user.company.toLowerCase().includes(keyword.toLowerCase()) ||
          user.job_title.toLowerCase().includes(keyword.toLowerCase())
        ) {
          userMap.set(user.user_id, user);
        }
      });

      // 从沸点中收集用户
      pins.forEach(pinInfo => {
        const user = pinInfo.author_user_info;
        if (
          user.user_name.toLowerCase().includes(keyword.toLowerCase()) ||
          user.company.toLowerCase().includes(keyword.toLowerCase()) ||
          user.job_title.toLowerCase().includes(keyword.toLowerCase())
        ) {
          userMap.set(user.user_id, user);
        }
      });

      const users = Array.from(userMap.values()).slice(0, limit);

      return {
        users,
        count: users.length,
        keyword,
      };
    } catch (error) {
      console.warn('[UserApi] Failed to search users:', error);
      return { users: [], count: 0, keyword };
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId: string) {
    try {
      const user = await this.getUserInfo(userId);

      // 基础统计信息
      const stats = {
        user_id: userId,
        user_name: user.user_name,
        basic_stats: {
          level: user.level,
          power: user.power,
          followee_count: user.followee_count,
          follower_count: user.follower_count,
          post_article_count: user.post_article_count,
          post_shortmsg_count: user.post_shortmsg_count,
          got_digg_count: user.got_digg_count,
          got_view_count: user.got_view_count,
        },
        engagement_rate: 0,
        influence_score: 0,
        activity_level: 'unknown' as 'low' | 'medium' | 'high' | 'unknown',
      };

      // 计算参与度
      if (user.post_article_count > 0) {
        stats.engagement_rate = user.got_digg_count / user.post_article_count;
      }

      // 计算影响力分数
      stats.influence_score =
        user.follower_count * 0.3 +
        user.got_digg_count * 0.4 +
        user.got_view_count * 0.0001 +
        user.level * 10;

      // 判断活跃度
      if (user.post_article_count + user.post_shortmsg_count > 100) {
        stats.activity_level = 'high';
      } else if (user.post_article_count + user.post_shortmsg_count > 20) {
        stats.activity_level = 'medium';
      } else if (user.post_article_count + user.post_shortmsg_count > 0) {
        stats.activity_level = 'low';
      }

      return stats;
    } catch (error) {
      console.warn(`[UserApi] Failed to get user stats for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 获取用户排行榜
   */
  async getUserRanking(
    type: 'followers' | 'articles' | 'diggs' | 'views' = 'followers',
    limit: number = 50
  ) {
    try {
      const { articleApi } = await import('./articles.js');
      const articles = await articleApi.getBatchArticles(200, 3);

      const userMap = new Map<string, UserInfo>();
      articles.forEach(articleInfo => {
        const user = articleInfo.author_user_info;
        userMap.set(user.user_id, user);
      });

      const users = Array.from(userMap.values());

      // 根据类型排序
      let sortedUsers: UserInfo[];
      switch (type) {
        case 'followers':
          sortedUsers = users.sort((a, b) => b.follower_count - a.follower_count);
          break;
        case 'articles':
          sortedUsers = users.sort((a, b) => b.post_article_count - a.post_article_count);
          break;
        case 'diggs':
          sortedUsers = users.sort((a, b) => b.got_digg_count - a.got_digg_count);
          break;
        case 'views':
          sortedUsers = users.sort((a, b) => b.got_view_count - a.got_view_count);
          break;
        default:
          sortedUsers = users;
      }

      return {
        ranking: sortedUsers.slice(0, limit).map((user, index) => ({
          rank: index + 1,
          user,
          value: this.getRankingValue(user, type),
        })),
        type,
        total_users: users.length,
      };
    } catch (error) {
      console.warn(`[UserApi] Failed to get user ranking for ${type}:`, error);
      return { ranking: [], type, total_users: 0 };
    }
  }

  /**
   * 获取排行榜对应的数值
   */
  private getRankingValue(user: UserInfo, type: string): number {
    switch (type) {
      case 'followers':
        return user.follower_count;
      case 'articles':
        return user.post_article_count;
      case 'diggs':
        return user.got_digg_count;
      case 'views':
        return user.got_view_count;
      default:
        return 0;
    }
  }

  /**
   * 分析用户兴趣标签
   */
  async analyzeUserInterests(userId: string) {
    try {
      const { articleApi } = await import('./articles.js');
      const articles = await articleApi.getBatchArticles(100, 2);

      // 找到该用户的文章
      const userArticles = articles.filter(
        articleInfo => articleInfo.author_user_info.user_id === userId
      );

      if (userArticles.length === 0) {
        return { user_id: userId, interests: [], categories: [] };
      }

      // 统计标签
      const tagMap = new Map<string, number>();
      const categoryMap = new Map<string, number>();

      userArticles.forEach(articleInfo => {
        // 统计标签
        articleInfo.tags.forEach(tag => {
          tagMap.set(tag.tag_name, (tagMap.get(tag.tag_name) || 0) + 1);
        });

        // 统计分类
        const categoryName = articleInfo.category.category_name;
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
      });

      // 转换为兴趣数组并排序
      const interests = Array.from(tagMap.entries())
        .map(([tag, count]) => ({
          tag,
          count,
          weight: count / userArticles.length,
        }))
        .sort((a, b) => b.count - a.count);

      const categories = Array.from(categoryMap.entries())
        .map(([category, count]) => ({
          category,
          count,
          weight: count / userArticles.length,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        user_id: userId,
        total_articles: userArticles.length,
        interests,
        categories,
      };
    } catch (error) {
      console.warn(`[UserApi] Failed to analyze user interests for ${userId}:`, error);
      return { user_id: userId, interests: [], categories: [] };
    }
  }
}

// 导出单例实例
export const userApi = new UserApi();
