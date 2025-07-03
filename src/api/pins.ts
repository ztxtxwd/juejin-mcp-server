import { apiClient } from './base.js';
import type { PinInfo, PinListParams, Topic } from '../types/index.js';
import { JUEJIN_CONSTANTS } from '../utils/config.js';

/**
 * 沸点相关API
 */
export class PinApi {
  /**
   * 获取沸点列表
   */
  async getPinList(params: PinListParams = {}) {
    const requestData = {
      id_type: params.id_type || JUEJIN_CONSTANTS.ITEM_TYPE.PIN,
      sort_type: params.sort_type || JUEJIN_CONSTANTS.SORT_TYPE.LATEST,
      cursor: params.cursor || '0',
      limit: params.limit || 20,
    };

    const urlParams = {
      aid: '2608',
      uuid: '7114966512272967208',
    };

    const response = await apiClient.post<PinInfo[]>(
      JUEJIN_CONSTANTS.ENDPOINTS.PIN_LIST,
      requestData,
      urlParams
    );

    return {
      pins: response.data || [],
      cursor: response.cursor,
      has_more: response.has_more || false,
      count: response.count || 0,
    };
  }

  /**
   * 获取最新沸点
   */
  async getLatestPins(limit: number = 20) {
    return this.getPinList({
      sort_type: JUEJIN_CONSTANTS.SORT_TYPE.LATEST,
      limit,
    });
  }

  /**
   * 按话题获取沸点
   */
  async getPinsByTopic(topicId: string, limit: number = 20) {
    return this.getPinList({
      topic_id: topicId,
      limit,
    });
  }

  /**
   * 获取热门话题列表
   */
  async getHotTopics() {
    try {
      // 这里需要具体的热门话题API端点
      // 目前先通过分析沸点数据来获取热门话题
      const pins = await this.getPinList({ limit: 100 });
      const topicMap = new Map<string, { topic: Topic; count: number }>();

      pins.pins.forEach(pinInfo => {
        if (pinInfo.topic && pinInfo.topic.topic_id) {
          const topicId = pinInfo.topic.topic_id;
          if (topicMap.has(topicId)) {
            topicMap.get(topicId)!.count++;
          } else {
            topicMap.set(topicId, {
              topic: pinInfo.topic,
              count: 1,
            });
          }
        }
      });

      // 按出现次数排序
      return Array.from(topicMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(item => ({
          ...item.topic,
          pin_count: item.count,
        }));
    } catch (error) {
      console.warn('[PinApi] Failed to get hot topics:', error);
      return [];
    }
  }

  /**
   * 搜索沸点
   */
  async searchPins(keyword: string, limit: number = 20) {
    const pins = await this.getPinList({ limit: limit * 2 });

    // 在客户端进行简单的关键词过滤
    const filteredPins = pins.pins
      .filter(pinInfo => {
        const pin = pinInfo.msg_info;
        return pin.content.toLowerCase().includes(keyword.toLowerCase());
      })
      .slice(0, limit);

    return {
      articles: [], // 搜索结果中没有文章
      pins: filteredPins,
      total: filteredPins.length,
      cursor: pins.cursor,
      has_more: filteredPins.length === limit,
    };
  }

  /**
   * 获取沸点详细信息
   */
  async getPinDetail(pinId: string) {
    const pins = await this.getPinList({ limit: 100 });
    const pin = pins.pins.find(pinInfo => pinInfo.msg_info.msg_id === pinId);

    if (!pin) {
      throw new Error(`Pin not found: ${pinId}`);
    }

    return pin;
  }

  /**
   * 获取用户沸点
   */
  async getUserPins(userId: string, limit: number = 20) {
    const pins = await this.getPinList({ limit: limit * 2 });

    const userPins = pins.pins
      .filter(pinInfo => pinInfo.msg_info.user_id === userId)
      .slice(0, limit);

    return {
      pins: userPins,
      cursor: pins.cursor,
      has_more: userPins.length === limit,
      count: userPins.length,
      user_id: userId,
    };
  }

  /**
   * 获取热门沸点（基于互动数据）
   */
  async getHotPins(limit: number = 20) {
    const pins = await this.getPinList({ limit: limit * 3 });

    // 计算热度分数：点赞数 * 0.6 + 评论数 * 0.4
    const hotPins = pins.pins
      .map(pinInfo => ({
        ...pinInfo,
        heat_score: pinInfo.msg_info.digg_count * 0.6 + pinInfo.msg_info.comment_count * 0.4,
      }))
      .sort((a, b) => b.heat_score - a.heat_score)
      .slice(0, limit);

    return {
      pins: hotPins,
      cursor: pins.cursor,
      has_more: hotPins.length === limit,
      count: hotPins.length,
    };
  }

  /**
   * 批量获取沸点（用于数据分析）
   */
  async getBatchPins(batchSize: number = 100, maxBatches: number = 5) {
    const allPins: PinInfo[] = [];
    let cursor = '0';
    let batchCount = 0;

    while (batchCount < maxBatches) {
      try {
        const result = await this.getPinList({
          cursor,
          limit: batchSize,
        });

        allPins.push(...result.pins);

        if (!result.has_more || !result.cursor) {
          break;
        }

        cursor = result.cursor;
        batchCount++;

        // 避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`[PinApi] Batch ${batchCount} failed:`, error);
        break;
      }
    }

    return allPins;
  }

  /**
   * 获取沸点统计信息
   */
  async getPinStats(pins?: PinInfo[]) {
    if (!pins) {
      const result = await this.getPinList({ limit: 100 });
      pins = result.pins;
    }

    const stats = {
      total_pins: pins.length,
      total_diggs: pins.reduce((sum, pin) => sum + pin.msg_info.digg_count, 0),
      total_comments: pins.reduce((sum, pin) => sum + pin.msg_info.comment_count, 0),
      avg_diggs: 0,
      avg_comments: 0,
      top_topics: [] as Array<{ topic: string; count: number }>,
      active_users: [] as Array<{ user_name: string; pin_count: number }>,
    };

    if (stats.total_pins > 0) {
      stats.avg_diggs = Math.round(stats.total_diggs / stats.total_pins);
      stats.avg_comments = Math.round(stats.total_comments / stats.total_pins);
    }

    // 统计热门话题
    const topicMap = new Map<string, number>();
    pins.forEach(pin => {
      if (pin.topic && pin.topic.title) {
        const topic = pin.topic.title;
        topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
      }
    });

    stats.top_topics = Array.from(topicMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 统计活跃用户
    const userMap = new Map<string, number>();
    pins.forEach(pin => {
      const userName = pin.author_user_info.user_name;
      userMap.set(userName, (userMap.get(userName) || 0) + 1);
    });

    stats.active_users = Array.from(userMap.entries())
      .map(([user_name, pin_count]) => ({ user_name, pin_count }))
      .sort((a, b) => b.pin_count - a.pin_count)
      .slice(0, 10);

    return stats;
  }
}

// 导出单例实例
export const pinApi = new PinApi();
