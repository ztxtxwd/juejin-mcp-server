import type { TrendAnalysis } from '../types/index.js';
import { articleApi } from '../api/articles.js';
import { pinApi } from '../api/pins.js';
import _ from 'lodash';
import { subHours } from 'date-fns';

/**
 * 趋势分析器
 * 提供高级的趋势识别、预测和分析功能
 */
export class TrendAnalyzer {
  /**
   * 分析热门趋势
   */
  async analyzeTrends(timeRange: number = 24): Promise<TrendAnalysis> {
    try {
      console.log(`[TrendAnalyzer] Analyzing trends for ${timeRange} hours`);

      // 并行获取数据
      const [articles, pins] = await Promise.all([
        articleApi.getBatchArticles(200, 3),
        pinApi.getBatchPins(200, 3),
      ]);

      // 过滤时间范围内的数据
      const recentArticles = this.filterByTimeRange(articles, timeRange, 'rtime');
      const recentPins = this.filterByTimeRange(pins, timeRange, 'ctime');

      // 分析话题趋势
      const trendingTopics = this.analyzeTrendingTopics(recentArticles, recentPins);

      // 分析热门标签
      const hotTags = this.analyzeHotTags(recentArticles);

      return {
        trending_topics: trendingTopics,
        hot_tags: hotTags,
        time_range: {
          start: new Date(Date.now() - timeRange * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[TrendAnalyzer] Failed to analyze trends:', error);
      throw error;
    }
  }

  /**
   * 按时间范围过滤数据
   */
  private filterByTimeRange(items: any[], timeRange: number, timeField: string) {
    const cutoffTime = subHours(new Date(), timeRange);

    return items.filter(item => {
      const timeValue =
        timeField === 'rtime' ? item.article_info?.[timeField] : item.msg_info?.[timeField];

      if (!timeValue) return false;

      const itemTime = new Date(timeValue);
      return itemTime >= cutoffTime;
    });
  }

  /**
   * 分析热门话题
   */
  private analyzeTrendingTopics(articles: any[], pins: any[]) {
    const topicMap = new Map<
      string,
      {
        score: number;
        growth_rate: number;
        article_count: number;
        pin_count: number;
        total_engagement: number;
        sources: Set<string>;
      }
    >();

    // 从文章中提取话题
    articles.forEach(article => {
      const topics = this.extractTopicsFromArticle(article);
      const engagement = this.calculateArticleEngagement(article);

      topics.forEach(topic => {
        this.updateTopicData(topicMap, topic, {
          article_count: 1,
          pin_count: 0,
          engagement,
          source: 'article',
        });
      });
    });

    // 从沸点中提取话题
    pins.forEach(pin => {
      const topics = this.extractTopicsFromPin(pin);
      const engagement = this.calculatePinEngagement(pin);

      topics.forEach(topic => {
        this.updateTopicData(topicMap, topic, {
          article_count: 0,
          pin_count: 1,
          engagement,
          source: 'pin',
        });
      });
    });

    // 计算趋势分数并排序
    return Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        score: this.calculateTopicScore(data),
        growth_rate: this.calculateGrowthRate(data),
        article_count: data.article_count,
        total_engagement: data.total_engagement,
        cross_platform: data.sources.size > 1,
        trend_strength: this.assessTrendStrength(data),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  /**
   * 从文章中提取话题
   */
  private extractTopicsFromArticle(article: any): string[] {
    const topics = [];

    // 从标题中提取关键词
    const title = article.article_info.title;
    const titleKeywords = this.extractKeywords(title);
    topics.push(...titleKeywords);

    // 从标签中提取
    if (article.tags) {
      const tagNames = article.tags.map((tag: any) => tag.tag_name);
      topics.push(...tagNames);
    }

    // 从分类中提取
    if (article.category) {
      topics.push(article.category.category_name);
    }

    return _.uniq(topics.filter(topic => topic.length > 1));
  }

  /**
   * 从沸点中提取话题
   */
  private extractTopicsFromPin(pin: any): string[] {
    const topics = [];

    // 从内容中提取话题标签
    const content = pin.msg_info.content;
    const hashtagMatches = content.match(/#([^#\s]+)/g);
    if (hashtagMatches) {
      topics.push(...hashtagMatches.map((tag: string) => tag.substring(1)));
    }

    // 从话题信息中提取
    if (pin.topic && pin.topic.title) {
      topics.push(pin.topic.title);
    }

    // 从内容中提取关键词
    const contentKeywords = this.extractKeywords(content);
    topics.push(...contentKeywords);

    return _.uniq(topics.filter(topic => topic.length > 1));
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简化的关键词提取，实际应该使用更复杂的NLP算法
    const techKeywords = [
      'JavaScript',
      'TypeScript',
      'React',
      'Vue',
      'Angular',
      'Node.js',
      'Python',
      'Java',
      'Go',
      'Rust',
      'C++',
      'PHP',
      '前端',
      '后端',
      '全栈',
      '移动端',
      'iOS',
      'Android',
      '人工智能',
      'AI',
      '机器学习',
      '深度学习',
      '大数据',
      '云计算',
      'Docker',
      'Kubernetes',
      '微服务',
      '算法',
      '数据结构',
      '设计模式',
      '架构',
      '面试',
      '求职',
      '职场',
      '技术分享',
    ];

    const keywords = [];
    const lowerText = text.toLowerCase();

    techKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    });

    // 提取中文技术词汇
    const chineseMatches = text.match(/[\u4e00-\u9fa5]{2,6}/g);
    if (chineseMatches) {
      const filteredChinese = chineseMatches.filter(
        word =>
          word.length >= 2 &&
          word.length <= 6 &&
          ![
            '的',
            '了',
            '在',
            '是',
            '有',
            '和',
            '就',
            '不',
            '都',
            '会',
            '说',
            '我',
            '你',
            '他',
          ].includes(word)
      );
      keywords.push(...filteredChinese.slice(0, 5)); // 限制数量
    }

    return _.uniq(keywords);
  }

  /**
   * 更新话题数据
   */
  private updateTopicData(topicMap: Map<string, any>, topic: string, data: any) {
    const normalizedTopic = topic.trim();
    if (normalizedTopic.length < 2) return;

    if (topicMap.has(normalizedTopic)) {
      const existing = topicMap.get(normalizedTopic)!;
      existing.article_count += data.article_count;
      existing.pin_count += data.pin_count;
      existing.total_engagement += data.engagement;
      existing.sources.add(data.source);
    } else {
      topicMap.set(normalizedTopic, {
        score: 0,
        growth_rate: 0,
        article_count: data.article_count,
        pin_count: data.pin_count,
        total_engagement: data.engagement,
        sources: new Set([data.source]),
      });
    }
  }

  /**
   * 计算文章参与度
   */
  private calculateArticleEngagement(article: any): number {
    const info = article.article_info;
    return info.digg_count + info.comment_count + info.collect_count;
  }

  /**
   * 计算沸点参与度
   */
  private calculatePinEngagement(pin: any): number {
    const info = pin.msg_info;
    return info.digg_count + info.comment_count;
  }

  /**
   * 计算话题分数
   */
  private calculateTopicScore(data: any): number {
    const totalMentions = data.article_count + data.pin_count;
    const avgEngagement = data.total_engagement / Math.max(totalMentions, 1);
    const crossPlatformBonus = data.sources.size > 1 ? 1.5 : 1.0;

    return (totalMentions * 0.4 + avgEngagement * 0.6) * crossPlatformBonus;
  }

  /**
   * 计算增长率
   */
  private calculateGrowthRate(data: any): number {
    // 简化的增长率计算，实际需要历史数据
    const totalActivity = data.article_count + data.pin_count + data.total_engagement;

    // 基于活跃度估算增长率
    if (totalActivity > 100) return 0.8;
    if (totalActivity > 50) return 0.6;
    if (totalActivity > 20) return 0.4;
    if (totalActivity > 10) return 0.2;
    return 0.1;
  }

  /**
   * 评估趋势强度
   */
  private assessTrendStrength(data: any): 'weak' | 'moderate' | 'strong' | 'viral' {
    const score = this.calculateTopicScore(data);

    if (score > 200) return 'viral';
    if (score > 100) return 'strong';
    if (score > 50) return 'moderate';
    return 'weak';
  }

  /**
   * 分析热门标签
   */
  private analyzeHotTags(articles: any[]) {
    const tagMap = new Map<
      string,
      {
        count: number;
        total_engagement: number;
        avg_engagement: number;
        recent_articles: number;
      }
    >();

    articles.forEach(article => {
      if (!article.tags) return;

      const engagement = this.calculateArticleEngagement(article);

      article.tags.forEach((tag: any) => {
        const tagName = tag.tag_name;

        if (tagMap.has(tagName)) {
          const tagData = tagMap.get(tagName)!;
          tagData.count++;
          tagData.total_engagement += engagement;
          tagData.avg_engagement = tagData.total_engagement / tagData.count;
          tagData.recent_articles++;
        } else {
          tagMap.set(tagName, {
            count: 1,
            total_engagement: engagement,
            avg_engagement: engagement,
            recent_articles: 1,
          });
        }
      });
    });

    return Array.from(tagMap.entries())
      .map(([tag_name, data]) => ({
        tag_name,
        heat_score: data.count * 0.5 + data.avg_engagement * 0.5,
        recent_articles: data.recent_articles,
        avg_engagement: Math.round(data.avg_engagement),
        growth_momentum: this.calculateTagMomentum(data),
      }))
      .sort((a, b) => b.heat_score - a.heat_score)
      .slice(0, 30);
  }

  /**
   * 计算标签动量
   */
  private calculateTagMomentum(data: any): 'high' | 'medium' | 'low' {
    if (data.recent_articles > 20 && data.avg_engagement > 50) return 'high';
    if (data.recent_articles > 10 && data.avg_engagement > 20) return 'medium';
    return 'low';
  }

  /**
   * 预测趋势发展
   */
  async predictTrendEvolution(topic: string, _timeRange: number = 24) {
    try {
      // 获取历史数据
      const [articles, pins] = await Promise.all([
        articleApi.getBatchArticles(300, 5),
        pinApi.getBatchPins(300, 5),
      ]);

      // 分析话题的历史表现
      const historicalData = this.analyzeTopicHistory(topic, articles, pins);

      // 生成预测
      const prediction = this.generateTrendPrediction(historicalData);

      return {
        topic,
        current_status: prediction.current_status,
        predicted_direction: prediction.direction,
        confidence: prediction.confidence,
        key_factors: prediction.factors,
        recommended_actions: prediction.actions,
        prediction_time: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[TrendAnalyzer] Failed to predict trend for ${topic}:`, error);
      throw error;
    }
  }

  /**
   * 分析话题历史
   */
  private analyzeTopicHistory(topic: string, articles: any[], pins: any[]) {
    const timeSlots = this.createTimeSlots(24, 4); // 6小时为一个时间段
    const history = timeSlots.map(slot => ({
      time_slot: slot,
      article_mentions: 0,
      pin_mentions: 0,
      total_engagement: 0,
    }));

    // 分析文章中的话题提及
    articles.forEach(article => {
      if (this.containsTopic(article, topic)) {
        const timeSlot = this.getTimeSlot(article.article_info.rtime, timeSlots);
        if (timeSlot !== -1) {
          history[timeSlot].article_mentions++;
          history[timeSlot].total_engagement += this.calculateArticleEngagement(article);
        }
      }
    });

    // 分析沸点中的话题提及
    pins.forEach(pin => {
      if (this.containsTopic(pin, topic)) {
        const timeSlot = this.getTimeSlot(pin.msg_info.ctime, timeSlots);
        if (timeSlot !== -1) {
          history[timeSlot].pin_mentions++;
          history[timeSlot].total_engagement += this.calculatePinEngagement(pin);
        }
      }
    });

    return history;
  }

  /**
   * 创建时间段
   */
  private createTimeSlots(hours: number, slots: number) {
    const slotDuration = hours / slots;
    const now = new Date();

    return Array.from({ length: slots }, (_, i) => {
      const start = subHours(now, (slots - i) * slotDuration);
      const end = subHours(now, (slots - i - 1) * slotDuration);
      return { start, end };
    });
  }

  /**
   * 检查是否包含话题
   */
  private containsTopic(item: any, topic: string): boolean {
    const lowerTopic = topic.toLowerCase();

    if (item.article_info) {
      // 文章
      const title = item.article_info.title.toLowerCase();
      const brief = item.article_info.brief_content.toLowerCase();
      const tags = item.tags?.map((tag: any) => tag.tag_name.toLowerCase()) || [];

      return (
        title.includes(lowerTopic) ||
        brief.includes(lowerTopic) ||
        tags.some((tag: string) => tag.includes(lowerTopic))
      );
    } else if (item.msg_info) {
      // 沸点
      const content = item.msg_info.content.toLowerCase();
      const topicTitle = item.topic?.title?.toLowerCase() || '';

      return content.includes(lowerTopic) || topicTitle.includes(lowerTopic);
    }

    return false;
  }

  /**
   * 获取时间段索引
   */
  private getTimeSlot(timeStr: string, timeSlots: any[]): number {
    const time = new Date(timeStr);

    for (let i = 0; i < timeSlots.length; i++) {
      if (time >= timeSlots[i].start && time < timeSlots[i].end) {
        return i;
      }
    }

    return -1;
  }

  /**
   * 生成趋势预测
   */
  private generateTrendPrediction(history: any[]) {
    // 计算趋势方向
    const recentActivity = history
      .slice(-2)
      .reduce(
        (sum, slot) => sum + slot.article_mentions + slot.pin_mentions + slot.total_engagement,
        0
      );
    const earlierActivity = history
      .slice(0, 2)
      .reduce(
        (sum, slot) => sum + slot.article_mentions + slot.pin_mentions + slot.total_engagement,
        0
      );

    let direction: 'rising' | 'stable' | 'declining' = 'stable';
    let confidence = 0.5;

    if (recentActivity > earlierActivity * 1.5) {
      direction = 'rising';
      confidence = 0.8;
    } else if (recentActivity < earlierActivity * 0.5) {
      direction = 'declining';
      confidence = 0.7;
    } else {
      confidence = 0.6;
    }

    // 评估当前状态
    const totalActivity = history.reduce(
      (sum, slot) => sum + slot.article_mentions + slot.pin_mentions,
      0
    );

    let currentStatus: 'hot' | 'warm' | 'cool' = 'cool';
    if (totalActivity > 50) currentStatus = 'hot';
    else if (totalActivity > 20) currentStatus = 'warm';

    // 识别关键因素
    const factors = [];
    if (recentActivity > 100) factors.push('高活跃度');
    if (history.some(slot => slot.article_mentions > 10)) factors.push('文章关注度高');
    if (history.some(slot => slot.pin_mentions > 20)) factors.push('沸点讨论热烈');
    if (history.some(slot => slot.total_engagement > 500)) factors.push('用户参与度高');

    // 生成建议行动
    const actions = [];
    if (direction === 'rising') {
      actions.push('抓住机会创作相关内容');
      actions.push('积极参与话题讨论');
    } else if (direction === 'declining') {
      actions.push('观察是否有新的发展');
      actions.push('考虑转向相关热门话题');
    } else {
      actions.push('持续关注话题动态');
      actions.push('寻找新的切入角度');
    }

    return {
      current_status: currentStatus,
      direction,
      confidence,
      factors,
      actions,
    };
  }

  /**
   * 识别新兴趋势
   */
  async identifyEmergingTrends(timeRange: number = 6) {
    try {
      // 获取最近的数据
      const [recentArticles, recentPins] = await Promise.all([
        articleApi.getBatchArticles(100, 2),
        pinApi.getBatchPins(100, 2),
      ]);

      // 过滤最近时间范围的数据
      const veryRecentArticles = this.filterByTimeRange(recentArticles, timeRange, 'rtime');
      const veryRecentPins = this.filterByTimeRange(recentPins, timeRange, 'ctime');

      // 提取新兴话题
      const emergingTopics = this.findEmergingTopics(veryRecentArticles, veryRecentPins);

      return {
        time_range_hours: timeRange,
        emerging_topics: emergingTopics,
        analysis_time: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[TrendAnalyzer] Failed to identify emerging trends:', error);
      throw error;
    }
  }

  /**
   * 发现新兴话题
   */
  private findEmergingTopics(articles: any[], pins: any[]) {
    const topicActivity = new Map<
      string,
      {
        mentions: number;
        engagement: number;
        velocity: number;
        sources: Set<string>;
      }
    >();

    // 分析文章话题
    articles.forEach(article => {
      const topics = this.extractTopicsFromArticle(article);
      const engagement = this.calculateArticleEngagement(article);

      topics.forEach(topic => {
        this.updateEmergingTopicData(topicActivity, topic, engagement, 'article');
      });
    });

    // 分析沸点话题
    pins.forEach(pin => {
      const topics = this.extractTopicsFromPin(pin);
      const engagement = this.calculatePinEngagement(pin);

      topics.forEach(topic => {
        this.updateEmergingTopicData(topicActivity, topic, engagement, 'pin');
      });
    });

    // 筛选和排序新兴话题
    return Array.from(topicActivity.entries())
      .filter(([_, data]) => data.mentions >= 3) // 至少被提及3次
      .map(([topic, data]) => ({
        topic,
        mentions: data.mentions,
        engagement_rate: data.engagement / data.mentions,
        velocity: data.velocity,
        cross_platform: data.sources.size > 1,
        emergence_score: this.calculateEmergenceScore(data),
      }))
      .sort((a, b) => b.emergence_score - a.emergence_score)
      .slice(0, 15);
  }

  /**
   * 更新新兴话题数据
   */
  private updateEmergingTopicData(
    topicMap: Map<string, any>,
    topic: string,
    engagement: number,
    source: string
  ) {
    if (topicMap.has(topic)) {
      const data = topicMap.get(topic)!;
      data.mentions++;
      data.engagement += engagement;
      data.velocity += 1; // 简化的速度计算
      data.sources.add(source);
    } else {
      topicMap.set(topic, {
        mentions: 1,
        engagement,
        velocity: 1,
        sources: new Set([source]),
      });
    }
  }

  /**
   * 计算新兴度分数
   */
  private calculateEmergenceScore(data: any): number {
    const mentionScore = Math.min(data.mentions * 10, 50);
    const engagementScore = Math.min(data.engagement / 10, 30);
    const velocityScore = Math.min(data.velocity * 5, 15);
    const crossPlatformBonus = data.sources.size > 1 ? 5 : 0;

    return mentionScore + engagementScore + velocityScore + crossPlatformBonus;
  }
}

// 导出单例实例
export const trendAnalyzer = new TrendAnalyzer();
