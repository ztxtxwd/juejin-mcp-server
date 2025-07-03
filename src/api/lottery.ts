import { apiClient } from './base.js';

/**
 * 抽奖和签到相关API
 * 注意：这些API通常需要用户认证，这里提供基础框架
 */
export class LotteryApi {
  /**
   * 获取当前矿石数
   */
  async getCurrentOre() {
    try {
      // 这个API需要用户认证
      const response = await apiClient.get('/growth_api/v1/get_cur_point');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get current ore:', error);
      return { ore_count: 0, error: 'Authentication required' };
    }
  }

  /**
   * 获取签到状态
   */
  async getCheckInStatus() {
    try {
      const response = await apiClient.get('/growth_api/v1/get_today_status');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get check-in status:', error);
      return { checked_in: false, error: 'Authentication required' };
    }
  }

  /**
   * 执行签到
   */
  async checkIn() {
    try {
      const response = await apiClient.post('/growth_api/v1/check_in');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to check in:', error);
      return { success: false, error: 'Authentication required' };
    }
  }

  /**
   * 获取签到天数信息
   */
  async getCheckInDays() {
    try {
      const response = await apiClient.get('/growth_api/v1/get_counts');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get check-in days:', error);
      return { total_days: 0, continuous_days: 0, error: 'Authentication required' };
    }
  }

  /**
   * 抽奖
   */
  async drawLottery() {
    try {
      const response = await apiClient.post('/growth_api/v1/lottery/draw');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to draw lottery:', error);
      return { success: false, error: 'Authentication required' };
    }
  }

  /**
   * 十连抽
   */
  async drawTenLottery() {
    try {
      const response = await apiClient.post('/growth_api/v1/lottery/ten_draw');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to draw ten lottery:', error);
      return { success: false, error: 'Authentication required' };
    }
  }

  /**
   * 获取奖品列表
   */
  async getPrizeList() {
    try {
      const response = await apiClient.get('/growth_api/v1/lottery/config');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get prize list:', error);
      return { prizes: [], error: 'Authentication required' };
    }
  }

  /**
   * 兑换奖品
   */
  async exchangePrize(prizeId: string) {
    try {
      const response = await apiClient.post('/growth_api/v1/redeem', {
        prize_id: prizeId,
      });
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to exchange prize:', error);
      return { success: false, error: 'Authentication required' };
    }
  }

  /**
   * 获取BUG列表
   */
  async getBugList() {
    try {
      const response = await apiClient.get('/growth_api/v1/get_bug_list');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get bug list:', error);
      return { bugs: [], error: 'Authentication required' };
    }
  }

  /**
   * 收集BUG
   */
  async collectBug(bugId: string) {
    try {
      const response = await apiClient.post('/growth_api/v1/collect_bug', {
        bug_id: bugId,
      });
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to collect bug:', error);
      return { success: false, error: 'Authentication required' };
    }
  }

  /**
   * 获取成长等级信息
   */
  async getGrowthLevel() {
    try {
      const response = await apiClient.get('/growth_api/v1/get_user_growth_info');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get growth level:', error);
      return { level: 0, exp: 0, error: 'Authentication required' };
    }
  }

  /**
   * 获取今日代码日历
   */
  async getTodayCodeCalendar() {
    try {
      const response = await apiClient.get('/growth_api/v1/get_today_code');
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get today code calendar:', error);
      return { code: '', description: '', error: 'Authentication required' };
    }
  }

  /**
   * 补签
   */
  async makeUpCheckIn(date: string) {
    try {
      const response = await apiClient.post('/growth_api/v1/make_up_check_in', {
        date,
      });
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to make up check in:', error);
      return { success: false, error: 'Authentication required' };
    }
  }

  /**
   * 获取用户积分历史
   */
  async getPointHistory(page: number = 1, limit: number = 20) {
    try {
      const response = await apiClient.get('/growth_api/v1/get_point_history', {
        page,
        limit,
      });
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get point history:', error);
      return { history: [], total: 0, error: 'Authentication required' };
    }
  }

  /**
   * 获取抽奖历史
   */
  async getLotteryHistory(page: number = 1, limit: number = 20) {
    try {
      const response = await apiClient.get('/growth_api/v1/lottery/history', {
        page,
        limit,
      });
      return response.data;
    } catch (error) {
      console.warn('[LotteryApi] Failed to get lottery history:', error);
      return { history: [], total: 0, error: 'Authentication required' };
    }
  }

  /**
   * 模拟获取公开的抽奖统计信息（不需要认证）
   */
  async getLotteryStats() {
    try {
      // 这里可以通过其他方式获取一些公开的统计信息
      // 比如通过分析用户数据等
      return {
        total_users: 1000000, // 模拟数据
        total_draws: 5000000,
        total_prizes: 100000,
        popular_prizes: [
          { name: '掘金徽章', count: 50000 },
          { name: '矿石', count: 30000 },
          { name: '掘金周边', count: 5000 },
        ],
        recent_winners: [], // 需要实际API支持
      };
    } catch (error) {
      console.warn('[LotteryApi] Failed to get lottery stats:', error);
      return {
        total_users: 0,
        total_draws: 0,
        total_prizes: 0,
        popular_prizes: [],
        recent_winners: [],
      };
    }
  }

  /**
   * 获取签到排行榜（模拟）
   */
  async getCheckInRanking(limit: number = 50) {
    try {
      // 这里需要实际的API支持，目前返回模拟数据
      return {
        ranking: Array.from({ length: Math.min(limit, 10) }, (_, index) => ({
          rank: index + 1,
          user_name: `用户${index + 1}`,
          continuous_days: 365 - index * 10,
          total_days: 400 - index * 5,
        })),
        total_users: 1000000,
        my_rank: null, // 需要用户认证
      };
    } catch (error) {
      console.warn('[LotteryApi] Failed to get check-in ranking:', error);
      return { ranking: [], total_users: 0, my_rank: null };
    }
  }
}

// 导出单例实例
export const lotteryApi = new LotteryApi();
