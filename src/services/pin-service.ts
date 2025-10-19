import { pinApi } from '../api/pins.js';
import type { PinInfo, Topic } from '../types/index.js';
import _ from 'lodash';
import { differenceInHours, parseISO, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 沸点业务逻辑服务
 * 提供沸点数据的高级处理和分析功能
 */
export class PinService {
  /**
   * 获取增强的沸点列表
   */
  async getEnhancedPinList(
    params: {
      sort_type?: number;
      topic_id?: string;
      limit?: number;
      include_sentiment?: boolean;
      include_trend_info?: boolean;
    } = {}
  ) {
    const {
      sort_type,
      topic_id,
      limit = 20,
      include_sentiment = false,
      include_trend_info = false,
    } = params;

    // 获取基础沸点数据
    const result = await pinApi.getPinList({
      ...(sort_type && { sort_type }),
      ...(topic_id && { topic_id }),
      limit,
    });

    const validPins = result.pins.filter(pin => pin && pin.msg_Info);

    // 增强沸点信息
    const enhancedPins = await Promise.all(
      validPins.map(async pinInfo => {
        const enhanced: any = { ...pinInfo };

        // 添加情感分析
        if (include_sentiment) {
          enhanced.sentiment = this.analyzeSentiment(pinInfo);
        }

        // 添加趋势信息
        if (include_trend_info) {
          enhanced.trend_info = this.calculatePinTrend(pinInfo);
        }

        // 添加内容分析
        enhanced.content_analysis = this.analyzeContent(pinInfo);

        // 添加互动质量评分
        enhanced.engagement_quality = this.calculateEngagementQuality(pinInfo);

        return enhanced;
      })
    );

    return {
      ...result,
      pins: enhancedPins,
    };
  }

  /**
   * 分析沸点情感倾向
   */
  analyzeSentiment(pinInfo: PinInfo) {
    if (!pinInfo || !pinInfo.msg_Info) {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        scores: { positive: 0, negative: 0, question: 0 },
      };
    }
    const content = pinInfo.msg_Info.content;

    // 简单的情感词典方法
    const positiveWords = ['好', '棒', '赞', '优秀', '完美', '喜欢', '爱', '开心', '高兴', '满意'];
    const negativeWords = ['差', '烂', '糟', '讨厌', '失望', '难过', '生气', '愤怒', '不满'];
    const questionWords = ['?', '？', '怎么', '为什么', '如何', '什么'];

    let positiveScore = 0;
    let negativeScore = 0;
    let questionScore = 0;

    positiveWords.forEach(word => {
      if (content.includes(word)) positiveScore++;
    });

    negativeWords.forEach(word => {
      if (content.includes(word)) negativeScore++;
    });

    questionWords.forEach(word => {
      if (content.includes(word)) questionScore++;
    });

    // 确定主要情感
    let sentiment: 'positive' | 'negative' | 'neutral' | 'question' = 'neutral';
    let confidence = 0.5;

    if (questionScore > 0) {
      sentiment = 'question';
      confidence = 0.7;
    } else if (positiveScore > negativeScore) {
      sentiment = 'positive';
      confidence = Math.min(0.5 + positiveScore * 0.1, 0.9);
    } else if (negativeScore > positiveScore) {
      sentiment = 'negative';
      confidence = Math.min(0.5 + negativeScore * 0.1, 0.9);
    }

    return {
      sentiment,
      confidence,
      scores: {
        positive: positiveScore,
        negative: negativeScore,
        question: questionScore,
      },
    };
  }

  /**
   * 计算沸点趋势
   */
  calculatePinTrend(pinInfo: PinInfo) {
    if (!pinInfo || !pinInfo.msg_Info) {
      return {
        status: 'stable',
        engagement_rate: 0,
        hours_since_publish: 0,
        viral_potential: 0,
      };
    }
    const pin = pinInfo.msg_Info;
    const publishTime = parseISO(pin.ctime);
    const hoursAgo = differenceInHours(new Date(), publishTime);

    // 计算互动速率
    const engagementRate = this.calculateEngagementRate(pin, hoursAgo);

    // 判断趋势状态
    let trendStatus: 'viral' | 'rising' | 'stable' | 'declining' | 'new' = 'stable';

    if (hoursAgo < 1) {
      trendStatus = 'new';
    } else if (engagementRate > 10) {
      trendStatus = 'viral';
    } else if (engagementRate > 2) {
      trendStatus = 'rising';
    } else if (engagementRate < 0.1) {
      trendStatus = 'declining';
    }

    return {
      status: trendStatus,
      engagement_rate: engagementRate,
      hours_since_publish: hoursAgo,
      viral_potential: this.calculateViralPotential(pinInfo),
    };
  }

  /**
   * 计算互动速率
   */
  private calculateEngagementRate(pin: any, hoursAgo: number): number {
    if (hoursAgo === 0) return 0;

    const totalEngagement = pin.digg_count + pin.comment_count;
    return totalEngagement / hoursAgo;
  }

  /**
   * 计算病毒传播潜力
   */
  private calculateViralPotential(pinInfo: PinInfo): number {
    const pin = pinInfo.msg_Info;
    const author = pinInfo.author_user_info;

    let potential = 0;

    // 作者影响力
    potential += Math.min(author.follower_count / 1000, 30);

    // 内容特征
    if (pin.pic_list && pin.pic_list.length > 0) potential += 20; // 有图片
    if (pin.content.length > 50 && pin.content.length < 200) potential += 15; // 适中长度
    if (pin.content.includes('#')) potential += 10; // 包含话题标签

    // 互动质量
    if (pin.comment_count > 0) {
      const commentRatio = pin.comment_count / Math.max(pin.digg_count, 1);
      if (commentRatio > 0.2) potential += 15; // 高评论比例
    }

    // 发布时间（工作日晚上和周末更容易传播）
    const publishTime = parseISO(pin.ctime);
    const hour = publishTime.getHours();
    const dayOfWeek = publishTime.getDay();

    if ((hour >= 19 && hour <= 23) || dayOfWeek === 0 || dayOfWeek === 6) {
      potential += 10;
    }

    return Math.min(potential, 100);
  }

  /**
   * 分析沸点内容
   */
  analyzeContent(pinInfo: PinInfo) {
    if (!pinInfo || !pinInfo.msg_Info) {
      return {
        length: 0,
        has_images: false,
        image_count: 0,
        has_topic: false,
        has_mention: false,
        has_link: false,
        content_type: 'general',
        readability_score: 50,
      };
    }

    const content = pinInfo.msg_Info.content;

    return {
      length: content.length,
      has_images: pinInfo.msg_Info.pic_list && pinInfo.msg_Info.pic_list.length > 0,
      image_count: pinInfo.msg_Info.pic_list ? pinInfo.msg_Info.pic_list.length : 0,
      has_topic: content.includes('#'),
      has_mention: content.includes('@'),
      has_link: /https?:\/\//.test(content),
      content_type: this.classifyContentType(content),
      readability_score: this.calculateReadabilityScore(content),
    };
  }

  /**
   * 分类内容类型
   */
  private classifyContentType(content: string): string {
    if (content.includes('?') || content.includes('？')) return 'question';
    if (content.includes('分享') || content.includes('推荐')) return 'sharing';
    if (content.includes('求助') || content.includes('帮忙')) return 'help';
    if (content.includes('吐槽') || content.includes('抱怨')) return 'complaint';
    if (content.includes('感谢') || content.includes('谢谢')) return 'gratitude';
    if (/学习|教程|技巧/.test(content)) return 'learning';
    if (/工作|面试|招聘/.test(content)) return 'career';
    return 'general';
  }

  /**
   * 计算可读性评分
   */
  private calculateReadabilityScore(content: string): number {
    let score = 50; // 基础分数

    // 长度适中
    if (content.length >= 20 && content.length <= 200) score += 20;

    // 有标点符号
    if (/[，。！？；：]/.test(content)) score += 15;

    // 有换行（结构清晰）
    if (content.includes('\n')) score += 10;

    // 不全是英文
    if (!/^[a-zA-Z\s\d\W]*$/.test(content)) score += 5;

    return Math.min(score, 100);
  }

  /**
   * 计算互动质量评分
   */
  calculateEngagementQuality(pinInfo: PinInfo): number {
    if (!pinInfo || !pinInfo.msg_Info) {
      return 0;
    }
    const pin = pinInfo.msg_Info;
    const author = pinInfo.author_user_info;

    let quality = 0;

    // 基础互动数据
    const totalEngagement = pin.digg_count + pin.comment_count;
    if (totalEngagement > 0) quality += 20;
    if (totalEngagement > 10) quality += 20;
    if (totalEngagement > 50) quality += 20;

    // 互动比例
    if (pin.digg_count > 0 && pin.comment_count > 0) {
      const ratio = pin.comment_count / pin.digg_count;
      if (ratio > 0.1 && ratio < 1) quality += 20; // 健康的互动比例
    }

    // 作者活跃度
    if (author.post_shortmsg_count > 10) quality += 10;
    if (author.level >= 3) quality += 10;

    return Math.min(quality, 100);
  }

  /**
   * 获取热门话题分析
   */
  async getTopicAnalysis(timeRange: number = 24) {
    const pins = await pinApi.getBatchPins(200, 3);

    // 过滤时间范围内的沸点
    const recentPins = pins.filter(pin => {
      const publishTime = parseISO(pin.msg_Info.ctime);
      const hoursAgo = differenceInHours(new Date(), publishTime);
      return hoursAgo <= timeRange;
    });

    // 统计话题
    const topicMap = new Map<
      string,
      {
        topic: Topic;
        pin_count: number;
        total_engagement: number;
        avg_engagement: number;
        growth_rate: number;
      }
    >();

    recentPins.forEach(pin => {
      if (pin && pin.msg_Info && pin.topic && pin.topic.topic_id) {
        const topicId = pin.topic.topic_id;
        const engagement = pin.msg_Info.digg_count + pin.msg_Info.comment_count;

        if (topicMap.has(topicId)) {
          const topic = topicMap.get(topicId)!;
          topic.pin_count++;
          topic.total_engagement += engagement;
          topic.avg_engagement = topic.total_engagement / topic.pin_count;
        } else {
          topicMap.set(topicId, {
            topic: pin.topic,
            pin_count: 1,
            total_engagement: engagement,
            avg_engagement: engagement,
            growth_rate: 0, // 需要历史数据计算
          });
        }
      }
    });

    // 计算热度分数并排序
    const topicAnalysis = Array.from(topicMap.values())
      .map(item => ({
        ...item,
        heat_score: item.pin_count * 0.4 + item.avg_engagement * 0.6,
      }))
      .sort((a, b) => b.heat_score - a.heat_score);

    return {
      time_range_hours: timeRange,
      total_topics: topicAnalysis.length,
      total_pins: recentPins.length,
      trending_topics: topicAnalysis.slice(0, 20),
      analysis_time: new Date().toISOString(),
    };
  }

  /**
   * 获取沸点推荐
   */
  async getPinRecommendations(
    params: {
      user_interests?: string[];
      exclude_ids?: string[];
      limit?: number;
      content_types?: string[];
    } = {}
  ) {
    const { user_interests = [], exclude_ids = [], limit = 10, content_types = [] } = params;

    const pins = await pinApi.getBatchPins(100, 2);

    // 过滤和评分
    const scoredPins = pins
      .filter(pin => pin && pin.msg_Info && !exclude_ids.includes(pin.msg_Info.msg_id))
      .map(pin => {
        const contentAnalysis = this.analyzeContent(pin);
        const engagementQuality = this.calculateEngagementQuality(pin);
        const interestScore = this.calculatePinInterestScore(pin, user_interests);

        // 内容类型过滤
        if (content_types.length > 0 && !content_types.includes(contentAnalysis.content_type)) {
          return null;
        }

        const totalScore = engagementQuality * 0.4 + interestScore * 0.6;

        return {
          pin,
          engagement_quality: engagementQuality,
          interest_score: interestScore,
          total_score: totalScore,
          content_type: contentAnalysis.content_type,
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b!.total_score - a!.total_score)
      .slice(0, limit);

    return scoredPins.map(item => ({
      pin_id: item!.pin.msg_Info.msg_id,
      content: item!.pin.msg_Info.content.substring(0, 100) + '...',
      reason: this.generatePinRecommendationReason(item!),
      confidence: item!.total_score / 100,
      content_type: item!.content_type,
      author: item!.pin.author_user_info?.user_name || '未知用户',
    }));
  }

  /**
   * 计算沸点兴趣匹配分数
   */
  private calculatePinInterestScore(pinInfo: PinInfo, userInterests: string[]): number {
    if (userInterests.length === 0 || !pinInfo || !pinInfo.msg_Info) return 50;

    const content = pinInfo.msg_Info.content.toLowerCase();
    const topicTitle = pinInfo.topic?.title?.toLowerCase() || '';

    let matchScore = 0;
    const normalizedInterests = userInterests.map(interest => interest.toLowerCase());

    normalizedInterests.forEach(interest => {
      if (content.includes(interest)) matchScore += 30;
      if (topicTitle.includes(interest)) matchScore += 20;
    });

    return Math.min(matchScore, 100);
  }

  /**
   * 生成沸点推荐理由
   */
  private generatePinRecommendationReason(item: any): string {
    const reasons = [];

    if (item.engagement_quality >= 80) {
      reasons.push('高质量互动');
    }

    if (item.interest_score >= 70) {
      reasons.push('符合您的兴趣');
    }

    if (item.pin.author_user_info.level >= 5) {
      reasons.push('知名用户');
    }

    const contentType = item.content_type;
    const typeMap: Record<string, string> = {
      question: '有趣的问题',
      sharing: '值得分享',
      learning: '学习内容',
      career: '职场相关',
    };

    if (typeMap[contentType]) {
      reasons.push(typeMap[contentType]);
    }

    return reasons.length > 0 ? reasons.join('，') : '推荐查看';
  }

  /**
   * 获取沸点统计报告
   */
  async getPinStatsReport(timeRange: number = 24) {
    const pins = await pinApi.getBatchPins(200, 3);

    // 过滤时间范围
    const recentPins = pins.filter(pin => {
      const publishTime = parseISO(pin.msg_Info.ctime);
      const hoursAgo = differenceInHours(new Date(), publishTime);
      return hoursAgo <= timeRange;
    });

    // 基础统计
    const totalPins = recentPins.length;
    const totalDiggs = recentPins.reduce((sum, pin) => sum + (pin.msg_Info?.digg_count || 0), 0);
    const totalComments = recentPins.reduce(
      (sum, pin) => sum + (pin.msg_Info?.comment_count || 0),
      0
    );

    // 内容类型分布
    const contentTypes = recentPins
      .filter(pin => pin.msg_Info)
      .map(pin => this.classifyContentType(pin.msg_Info.content));
    const contentTypeStats = _.countBy(contentTypes);

    // 活跃时段分析
    const hourlyStats = _.groupBy(
      recentPins.filter(pin => pin.msg_Info),
      pin => {
        const hour = parseISO(pin.msg_Info.ctime).getHours();
        return hour;
      }
    );

    const hourlyActivity = Object.entries(hourlyStats)
      .map(([hour, pins]) => ({
        hour: parseInt(hour),
        pin_count: pins.length,
        avg_engagement:
          pins.reduce((sum, pin) => sum + pin.msg_Info.digg_count + pin.msg_Info.comment_count, 0) /
          pins.length,
      }))
      .sort((a, b) => a.hour - b.hour);

    return {
      time_range_hours: timeRange,
      summary: {
        total_pins: totalPins,
        total_diggs: totalDiggs,
        total_comments: totalComments,
        avg_diggs_per_pin: totalPins > 0 ? Math.round(totalDiggs / totalPins) : 0,
        avg_comments_per_pin: totalPins > 0 ? Math.round(totalComments / totalPins) : 0,
      },
      content_type_distribution: contentTypeStats,
      hourly_activity: hourlyActivity,
      top_authors: this.getTopAuthors(recentPins),
      engagement_trends: this.calculateEngagementTrends(recentPins),
    };
  }

  /**
   * 获取最活跃作者
   */
  private getTopAuthors(pins: PinInfo[]) {
    const authorMap = new Map<
      string,
      {
        user_name: string;
        pin_count: number;
        total_engagement: number;
      }
    >();

    pins.forEach(pin => {
      if (!pin.msg_Info || !pin.author_user_info) return;

      const userId = pin.author_user_info.user_id;
      const engagement = pin.msg_Info.digg_count + pin.msg_Info.comment_count;

      if (authorMap.has(userId)) {
        const author = authorMap.get(userId)!;
        author.pin_count++;
        author.total_engagement += engagement;
      } else {
        authorMap.set(userId, {
          user_name: pin.author_user_info.user_name,
          pin_count: 1,
          total_engagement: engagement,
        });
      }
    });

    return Array.from(authorMap.values())
      .sort((a, b) => b.total_engagement - a.total_engagement)
      .slice(0, 10);
  }

  /**
   * 计算互动趋势
   */
  private calculateEngagementTrends(pins: PinInfo[]) {
    // 按小时分组计算趋势
    const hourlyEngagement = _.groupBy(pins, pin => {
      const publishTime = parseISO(pin.msg_Info.ctime);
      return format(publishTime, 'yyyy-MM-dd HH:00', { locale: zhCN });
    });

    return Object.entries(hourlyEngagement)
      .map(([hour, pins]) => {
        const validPins = pins.filter(pin => pin.msg_Info);
        return {
          hour,
          total_engagement: validPins.reduce(
            (sum, pin) => sum + pin.msg_Info.digg_count + pin.msg_Info.comment_count,
            0
          ),
          pin_count: validPins.length,
          avg_engagement:
            validPins.length > 0
              ? validPins.reduce(
                  (sum, pin) => sum + pin.msg_Info.digg_count + pin.msg_Info.comment_count,
                  0
                ) / validPins.length
              : 0,
        };
      })
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }
}

// 导出单例实例
export const pinService = new PinService();
