import type { ContentQuality } from '../types/index.js';
import _ from 'lodash';

/**
 * 内容分析器
 * 提供深度的内容质量分析、分类和评估功能
 */
export class ContentAnalyzer {
  /**
   * 深度内容质量分析
   */
  analyzeContentQuality(content: any, type: 'article' | 'pin'): ContentQuality {
    if (type === 'article') {
      return this.analyzeArticleQuality(content);
    } else {
      return this.analyzePinQuality(content);
    }
  }

  /**
   * 分析文章质量
   */
  private analyzeArticleQuality(articleInfo: any): ContentQuality {
    const article = articleInfo.article_info;
    const author = articleInfo.author_user_info;

    // 多维度质量评估
    const qualityFactors = {
      content_structure: this.analyzeContentStructure(article),
      engagement_quality: this.analyzeEngagementQuality(article),
      author_credibility: this.analyzeAuthorCredibility(author),
      technical_depth: this.analyzeTechnicalDepth(article, articleInfo.tags),
      readability: this.analyzeReadability(article.title, article.brief_content),
      originality: this.analyzeOriginality(article),
      timeliness: this.analyzeTimeliness(article),
      visual_appeal: this.analyzeVisualAppeal(article),
    };

    // 计算综合质量分数
    const qualityScore = this.calculateOverallQuality(qualityFactors);

    // 生成预测
    const prediction = this.predictContentPerformance(articleInfo, qualityFactors);

    return {
      article_id: article.article_id,
      quality_score: qualityScore,
      factors: {
        engagement_rate: qualityFactors.engagement_quality,
        content_depth: qualityFactors.technical_depth,
        originality: qualityFactors.originality,
        user_feedback: qualityFactors.author_credibility,
      },
      prediction,
    };
  }

  /**
   * 分析沸点质量
   */
  private analyzePinQuality(pinInfo: any): ContentQuality {
    const pin = pinInfo.msg_Info;
    const author = pinInfo.author_user_info;

    const qualityFactors = {
      content_relevance: this.analyzePinRelevance(pin),
      engagement_potential: this.analyzePinEngagementPotential(pin),
      author_influence: this.analyzeAuthorInfluence(author),
      content_creativity: this.analyzePinCreativity(pin),
      discussion_value: this.analyzeDiscussionValue(pin),
      viral_potential: this.analyzeViralPotential(pinInfo),
    };

    const qualityScore = this.calculatePinQuality(qualityFactors);
    const prediction = this.predictPinPerformance(pinInfo, qualityFactors);

    return {
      article_id: pin.msg_id,
      quality_score: qualityScore,
      factors: {
        engagement_rate: qualityFactors.engagement_potential,
        content_depth: qualityFactors.content_relevance,
        originality: qualityFactors.content_creativity,
        user_feedback: qualityFactors.author_influence,
      },
      prediction,
    };
  }

  /**
   * 分析内容结构
   */
  private analyzeContentStructure(article: any): number {
    let score = 0;

    // 标题质量
    const title = article.title;
    if (title.length >= 10 && title.length <= 60) score += 20;
    if (title.includes('?') || title.includes('！')) score += 5; // 有吸引力的标题
    if (/\d+/.test(title)) score += 5; // 包含数字

    // 简介质量
    const brief = article.brief_content;
    if (brief.length >= 50 && brief.length <= 200) score += 15;
    if (brief.includes('。') || brief.includes('！')) score += 5; // 有完整句子

    // 封面图片
    if (article.cover_image) score += 15;

    // 内容长度推断（基于简介）
    if (brief.length > 100) score += 10; // 可能是长文

    return Math.min(score, 100);
  }

  /**
   * 分析参与质量
   */
  private analyzeEngagementQuality(article: any): number {
    const views = article.view_count || 1;
    const diggs = article.digg_count;
    const comments = article.comment_count;
    const collects = article.collect_count;

    // 计算各种参与率
    const diggRate = diggs / views;
    const commentRate = comments / views;
    const collectRate = collects / views;

    let score = 0;

    // 点赞率评分
    if (diggRate > 0.05) score += 30;
    else if (diggRate > 0.02) score += 20;
    else if (diggRate > 0.01) score += 10;

    // 评论率评分
    if (commentRate > 0.01) score += 25;
    else if (commentRate > 0.005) score += 15;
    else if (commentRate > 0.002) score += 8;

    // 收藏率评分
    if (collectRate > 0.02) score += 25;
    else if (collectRate > 0.01) score += 15;
    else if (collectRate > 0.005) score += 8;

    // 互动平衡性
    if (comments > 0 && diggs > 0 && collects > 0) score += 20;

    return Math.min(score, 100);
  }

  /**
   * 分析作者可信度
   */
  private analyzeAuthorCredibility(author: any): number {
    let score = 0;

    // 等级评分
    score += Math.min(author.level * 10, 30);

    // 粉丝数评分
    if (author.follower_count > 10000) score += 25;
    else if (author.follower_count > 1000) score += 20;
    else if (author.follower_count > 100) score += 15;
    else if (author.follower_count > 10) score += 10;

    // 内容产出评分
    if (author.post_article_count > 50) score += 20;
    else if (author.post_article_count > 20) score += 15;
    else if (author.post_article_count > 5) score += 10;

    // 获赞比例
    if (author.post_article_count > 0) {
      const avgDiggs = author.got_digg_count / author.post_article_count;
      if (avgDiggs > 100) score += 15;
      else if (avgDiggs > 50) score += 10;
      else if (avgDiggs > 20) score += 5;
    }

    // 影响力比例
    if (author.follower_count > author.followee_count * 2) score += 10;

    return Math.min(score, 100);
  }

  /**
   * 分析技术深度
   */
  private analyzeTechnicalDepth(article: any, tags: any[]): number {
    let score = 0;

    // 基于标签分析技术深度
    const techDepthKeywords = {
      high: ['架构', '源码', '原理', '深入', '底层', '性能优化', '算法', '设计模式'],
      medium: ['实践', '应用', '开发', '技巧', '方法', '工具'],
      basic: ['入门', '基础', '教程', '学习', '介绍'],
    };

    const title = article.title.toLowerCase();
    const brief = article.brief_content.toLowerCase();
    const tagNames = tags.map(tag => tag.tag_name.toLowerCase());

    // 检查高深度关键词
    techDepthKeywords.high.forEach(keyword => {
      if (
        title.includes(keyword) ||
        brief.includes(keyword) ||
        tagNames.some(tag => tag.includes(keyword))
      ) {
        score += 15;
      }
    });

    // 检查中等深度关键词
    techDepthKeywords.medium.forEach(keyword => {
      if (
        title.includes(keyword) ||
        brief.includes(keyword) ||
        tagNames.some(tag => tag.includes(keyword))
      ) {
        score += 8;
      }
    });

    // 检查基础关键词（负分）
    techDepthKeywords.basic.forEach(keyword => {
      if (title.includes(keyword) || brief.includes(keyword)) {
        score -= 5;
      }
    });

    // 标签数量和质量
    if (tags.length >= 3) score += 10;
    if (tags.length >= 5) score += 5;

    // 技术栈相关性
    const techStacks = ['javascript', 'typescript', 'react', 'vue', 'node', 'python', 'java', 'go'];
    const techStackCount = tagNames.filter(tag =>
      techStacks.some(tech => tag.includes(tech))
    ).length;
    score += techStackCount * 5;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * 分析可读性
   */
  private analyzeReadability(title: string, content: string): number {
    let score = 50; // 基础分数

    // 标题可读性
    if (title.length >= 10 && title.length <= 50) score += 15;
    if (!/[^\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]/.test(title)) score += 10; // 无特殊字符

    // 内容可读性
    if (content.length >= 50) score += 10;
    if (content.includes('。') || content.includes('！') || content.includes('？')) score += 10;

    // 结构化内容
    if (content.includes('\n') || content.includes('：')) score += 5;

    // 避免过长
    if (title.length > 80) score -= 10;
    if (content.length > 500) score -= 5;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * 分析原创性
   */
  private analyzeOriginality(article: any): number {
    let score = 50; // 基础分数

    // 原创标识
    if (article.is_original === 1) score += 30;

    // 内容独特性指标
    if (article.cover_image) score += 10; // 有自定义封面

    // 避免常见模板化内容
    const templatePhrases = ['转载', '转自', '来源', '原文链接'];
    const hasTemplate = templatePhrases.some(
      phrase => article.title.includes(phrase) || article.brief_content.includes(phrase)
    );
    if (hasTemplate) score -= 20;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * 分析时效性
   */
  private analyzeTimeliness(article: any): number {
    const publishTime = new Date(article.rtime);
    const now = new Date();
    const hoursAgo = (now.getTime() - publishTime.getTime()) / (1000 * 60 * 60);

    let score = 100;

    // 时间衰减
    if (hoursAgo > 168)
      score -= 30; // 超过一周
    else if (hoursAgo > 72)
      score -= 20; // 超过三天
    else if (hoursAgo > 24) score -= 10; // 超过一天

    // 热门时段发布加分
    const hour = publishTime.getHours();
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16) || (hour >= 20 && hour <= 22)) {
      score += 10;
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * 分析视觉吸引力
   */
  private analyzeVisualAppeal(article: any): number {
    let score = 0;

    // 封面图片
    if (article.cover_image) {
      score += 40;

      // 图片URL质量分析
      const imageUrl = article.cover_image;
      if (imageUrl.includes('watermark')) score += 10; // 有水印处理
      if (imageUrl.includes('tplv')) score += 5; // 模板处理
    }

    // 标题视觉吸引力
    const title = article.title;
    if (/[0-9]+/.test(title)) score += 15; // 包含数字
    if (title.includes('!') || title.includes('？')) score += 10; // 感叹号或问号
    if (title.length >= 15 && title.length <= 40) score += 15; // 适中长度

    // 避免过度营销化
    const marketingWords = ['震惊', '必看', '绝对', '史上最'];
    if (marketingWords.some(word => title.includes(word))) score -= 20;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * 计算综合质量分数
   */
  private calculateOverallQuality(factors: any): number {
    const weights = {
      content_structure: 0.2,
      engagement_quality: 0.25,
      author_credibility: 0.15,
      technical_depth: 0.15,
      readability: 0.1,
      originality: 0.1,
      timeliness: 0.03,
      visual_appeal: 0.02,
    };

    let totalScore = 0;
    Object.entries(weights).forEach(([factor, weight]) => {
      totalScore += factors[factor] * weight;
    });

    return Math.round(totalScore);
  }

  /**
   * 预测内容表现
   */
  private predictContentPerformance(articleInfo: any, qualityFactors: any) {
    // const article = articleInfo.article_info; // 暂时未使用
    const author = articleInfo.author_user_info;

    // 基础预测因子
    const authorInfluence = Math.min(author.follower_count / 100, 50);
    const qualityBonus = qualityFactors.content_structure * 0.5;
    const credibilityBonus = qualityFactors.author_credibility * 0.3;

    const basePotential = authorInfluence + qualityBonus + credibilityBonus;

    return {
      potential_views: Math.round(basePotential * 20),
      potential_likes: Math.round(basePotential * 2),
      trending_probability: Math.min(basePotential / 200, 1),
    };
  }

  /**
   * 沸点相关分析方法
   */
  private analyzePinRelevance(pin: any): number {
    let score = 50;

    const content = pin.content;

    // 内容长度适中
    if (content.length >= 20 && content.length <= 200) score += 20;

    // 包含话题标签
    if (content.includes('#')) score += 15;

    // 包含@提及
    if (content.includes('@')) score += 10;

    // 有图片
    if (pin.pic_list && pin.pic_list.length > 0) score += 15;

    return Math.min(score, 100);
  }

  private analyzePinEngagementPotential(pin: any): number {
    let score = 0;

    const content = pin.content;

    // 互动性内容
    if (content.includes('?') || content.includes('？')) score += 20; // 问题
    if (content.includes('大家') || content.includes('你们')) score += 15; // 互动性

    // 情感表达
    if (/[！!]/.test(content)) score += 10;
    if (/[\u{1F600}-\u{1F64F}]/u.test(content)) score += 10; // emoji

    // 内容类型
    if (content.includes('分享') || content.includes('推荐')) score += 15;
    if (content.includes('求助') || content.includes('请教')) score += 20;

    return Math.min(score, 100);
  }

  private analyzeAuthorInfluence(author: any): number {
    return this.analyzeAuthorCredibility(author);
  }

  private analyzePinCreativity(pin: any): number {
    let score = 50;

    const content = pin.content;

    // 创意表达
    if (pin.pic_list && pin.pic_list.length > 1) score += 20; // 多图
    if (content.length > 100) score += 15; // 详细描述
    if (/[a-zA-Z]/.test(content)) score += 10; // 包含英文

    return Math.min(score, 100);
  }

  private analyzeDiscussionValue(pin: any): number {
    let score = 0;

    const content = pin.content;

    // 讨论性话题
    if (content.includes('怎么看') || content.includes('如何')) score += 25;
    if (content.includes('经验') || content.includes('建议')) score += 20;
    if (content.includes('对比') || content.includes('选择')) score += 15;

    return Math.min(score, 100);
  }

  private analyzeViralPotential(pinInfo: any): number {
    const pin = pinInfo.msg_Info;
    const author = pinInfo.author_user_info;

    let score = 0;

    // 作者影响力
    score += Math.min(author.follower_count / 100, 30);

    // 内容特征
    if (pin.pic_list && pin.pic_list.length > 0) score += 20;
    if (pin.content.includes('#')) score += 15;
    if (pin.content.length > 50 && pin.content.length < 150) score += 15;

    // 话题热度
    if (pinInfo.topic && pinInfo.topic.title) score += 10;

    return Math.min(score, 100);
  }

  private calculatePinQuality(factors: any): number {
    const weights = {
      content_relevance: 0.25,
      engagement_potential: 0.25,
      author_influence: 0.2,
      content_creativity: 0.15,
      discussion_value: 0.1,
      viral_potential: 0.05,
    };

    let totalScore = 0;
    Object.entries(weights).forEach(([factor, weight]) => {
      totalScore += factors[factor] * weight;
    });

    return Math.round(totalScore);
  }

  private predictPinPerformance(_pinInfo: any, qualityFactors: any) {
    // const author = pinInfo.author_user_info; // 暂时未使用

    const basePotential =
      qualityFactors.viral_potential +
      qualityFactors.author_influence * 0.5 +
      qualityFactors.engagement_potential * 0.3;

    return {
      potential_views: Math.round(basePotential * 5),
      potential_likes: Math.round(basePotential * 0.8),
      trending_probability: Math.min(basePotential / 150, 1),
    };
  }

  /**
   * 批量内容质量分析
   */
  async batchAnalyzeQuality(contents: any[], type: 'article' | 'pin') {
    return contents.map(content => this.analyzeContentQuality(content, type));
  }

  /**
   * 内容分类
   */
  classifyContent(content: any, type: 'article' | 'pin'): string {
    if (type === 'article') {
      return this.classifyArticle(content);
    } else {
      return this.classifyPin(content);
    }
  }

  private classifyArticle(articleInfo: any): string {
    const title = articleInfo.article_info.title.toLowerCase();
    const tags = articleInfo.tags.map((tag: any) => tag.tag_name.toLowerCase());

    // 技术分类
    if (
      tags.some((tag: string) => ['教程', '入门', '学习'].some(keyword => tag.includes(keyword))) ||
      title.includes('教程') ||
      title.includes('入门')
    ) {
      return 'tutorial';
    }

    if (
      tags.some((tag: string) => ['源码', '原理', '深入'].some(keyword => tag.includes(keyword))) ||
      title.includes('源码') ||
      title.includes('原理')
    ) {
      return 'deep_dive';
    }

    if (
      tags.some((tag: string) => ['实践', '项目', '开发'].some(keyword => tag.includes(keyword))) ||
      title.includes('实践') ||
      title.includes('项目')
    ) {
      return 'practical';
    }

    if (title.includes('面试') || title.includes('求职')) {
      return 'career';
    }

    if (title.includes('工具') || title.includes('推荐')) {
      return 'tools';
    }

    return 'general';
  }

  private classifyPin(pinInfo: any): string {
    const content = pinInfo.msg_Info.content.toLowerCase();

    if (content.includes('?') || content.includes('？')) return 'question';
    if (content.includes('分享') || content.includes('推荐')) return 'sharing';
    if (content.includes('求助') || content.includes('帮忙')) return 'help';
    if (content.includes('吐槽') || content.includes('抱怨')) return 'complaint';
    if (content.includes('感谢') || content.includes('谢谢')) return 'gratitude';
    if (/学习|教程|技巧/.test(content)) return 'learning';
    if (/工作|面试|招聘/.test(content)) return 'career';

    return 'general';
  }
}

// 导出单例实例
export const contentAnalyzer = new ContentAnalyzer();
