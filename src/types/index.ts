// 掘金API基础响应类型
export interface JuejinResponse<T> {
  err_no: number;
  err_msg: string;
  data: T;
  cursor?: string;
  count?: number;
  has_more?: boolean;
}

// 文章相关类型
export interface Article {
  article_id: string;
  user_id: string;
  category_id: string;
  tag_ids: number[];
  title: string;
  brief_content: string;
  cover_image: string;
  view_count: number;
  collect_count: number;
  digg_count: number;
  comment_count: number;
  ctime: string;
  mtime: string;
  rtime: string;
  is_original: number;
  hot_index: number;
  rank_index: number;
}

export interface ArticleInfo {
  article_id: string;
  article_info: Article;
  author_user_info: UserInfo;
  category: Category;
  tags: Tag[];
  user_interact: UserInteract;
}

// 用户相关类型
export interface UserInfo {
  user_id: string;
  user_name: string;
  company: string;
  job_title: string;
  avatar_large: string;
  level: number;
  description: string;
  followee_count: number;
  follower_count: number;
  post_article_count: number;
  digg_article_count: number;
  got_digg_count: number;
  got_view_count: number;
  post_shortmsg_count: number;
  digg_shortmsg_count: number;
  power: number;
}

// 沸点相关类型
export interface Pin {
  msg_id: string;
  user_id: string;
  content: string;
  pic_list: string[];
  topic: Topic;
  digg_count: number;
  comment_count: number;
  ctime: string;
  mtime: string;
}

export interface PinInfo {
  msg_id: string;
  msg_info: Pin;
  author_user_info: UserInfo;
  topic: Topic;
  user_interact: UserInteract;
}

// 分类和标签类型
export interface Category {
  category_id: string;
  category_name: string;
  category_url: string;
  rank: number;
  icon: string;
}

export interface Tag {
  tag_id: string;
  tag_name: string;
  color: string;
  icon: string;
  post_article_count: number;
  concern_user_count: number;
}

export interface Topic {
  topic_id: string;
  title: string;
  pic: string;
}

// 用户交互类型
export interface UserInteract {
  id: number;
  user_id: number;
  is_digg: boolean;
  is_follow: boolean;
  is_collect: boolean;
}

// 请求参数类型
export interface ArticleListParams {
  id_type?: number;
  client_type?: number;
  sort_type?: number;
  cursor?: string;
  limit?: number;
  category_id?: string;
}

export interface PinListParams {
  id_type?: number;
  sort_type?: number;
  cursor?: string;
  limit?: number;
  topic_id?: string;
}

// 分析结果类型
export interface TrendAnalysis {
  trending_topics: Array<{
    topic: string;
    score: number;
    growth_rate: number;
    article_count: number;
    total_engagement: number;
    cross_platform: boolean;
    trend_strength: string;
  }>;
  hot_tags: Array<{
    tag_name: string;
    heat_score: number;
    recent_articles: number;
    avg_engagement: number;
    growth_momentum: string;
  }>;
  time_range: {
    start: string;
    end: string;
  };
}

export interface ContentQuality {
  article_id: string;
  quality_score: number;
  factors: {
    engagement_rate: number;
    content_depth: number;
    originality: number;
    user_feedback: number;
  };
  prediction: {
    potential_views: number;
    potential_likes: number;
    trending_probability: number;
  };
}

export interface UserProfile {
  user_id: string;
  interests: Array<{
    tag: string;
    weight: number;
  }>;
  activity_pattern: {
    active_hours: number[];
    preferred_content_types: string[];
    engagement_level: 'low' | 'medium' | 'high';
  };
  expertise_areas: string[];
}

export interface Recommendation {
  article_id: string;
  title: string;
  reason: string;
  confidence: number;
  category: string;
  tags: string[];
}

// 搜索响应类型
export interface SearchResponse {
  articles: ArticleInfo[];
  pins: PinInfo[];
  total: number;
  cursor?: string;
  has_more: boolean;
}

// 趋势信息类型
export interface TrendInfo {
  heat_score: number;
  growth_rate: number;
  momentum: 'rising' | 'stable' | 'declining';
  peak_time?: string;
  engagement_trend: number[];
}

// 可读性分析类型
export interface ReadabilityInfo {
  score: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  factors: {
    word_count: number;
    sentence_complexity: number;
    technical_terms: number;
    code_examples: number;
  };
}

// 增强的文章信息类型
export interface EnhancedArticleInfo extends ArticleInfo {
  quality_score?: number;
  trend_info?: TrendInfo;
  readability?: ReadabilityInfo;
}

// 情感分析类型
export interface SentimentInfo {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
  };
}

// 内容分析类型
export interface ContentAnalysis {
  topic_categories: string[];
  keywords: Array<{
    word: string;
    weight: number;
  }>;
  text_quality: {
    clarity: number;
    informativeness: number;
    engagement: number;
  };
  interaction_potential: number;
}

// 参与质量类型
export interface EngagementQuality {
  score: number;
  factors: {
    response_rate: number;
    discussion_depth: number;
    community_engagement: number;
    viral_potential: number;
  };
  prediction: {
    expected_comments: number;
    expected_shares: number;
    peak_time: string;
  };
}

// 增强的沸点信息类型
export interface EnhancedPinInfo extends PinInfo {
  sentiment?: SentimentInfo;
  content_analysis?: ContentAnalysis;
  engagement_quality?: EngagementQuality;
}

// 用户基础信息类型
export interface UserBasicInfo {
  registration_date: string;
  last_active: string;
  account_status: 'active' | 'inactive' | 'suspended';
  verification_status: boolean;
  premium_features: boolean;
  region: string;
  language_preference: string;
}

// 创作模式类型
export interface CreationPattern {
  posting_frequency: number;
  preferred_times: number[];
  content_types: Array<{
    type: 'article' | 'pin' | 'comment';
    percentage: number;
  }>;
  quality_trends: {
    recent_score: number;
    improvement_rate: number;
    consistency: number;
  };
  topics_covered: string[];
}

// 交互模式类型
export interface InteractionPattern {
  engagement_style: 'active' | 'passive' | 'selective';
  response_rate: number;
  average_response_time: number;
  interaction_types: {
    likes: number;
    comments: number;
    shares: number;
    follows: number;
  };
  community_participation: number;
}

// 影响力网络类型
export interface InfluenceNetwork {
  follower_quality: number;
  network_reach: number;
  influence_score: number;
  key_connections: Array<{
    user_id: string;
    connection_strength: number;
    interaction_frequency: number;
  }>;
  mentor_relationships: string[];
  community_leadership: number;
}

// 成长轨迹类型
export interface GrowthTrajectory {
  growth_rate: number;
  milestone_achievements: Array<{
    milestone: string;
    achieved_date: string;
    significance: number;
  }>;
  skill_development: Array<{
    skill: string;
    level: number;
    improvement_rate: number;
  }>;
  career_progression: {
    current_stage: string;
    next_stage_prediction: string;
    estimated_time: number;
  };
}

// 用户画像类型（重新定义）
export interface DetailedUserProfile {
  user_id: string;
  basic_info: UserBasicInfo;
  creation_pattern: CreationPattern;
  interaction_pattern: InteractionPattern;
  influence_network: InfluenceNetwork;
  growth_trajectory: GrowthTrajectory;
  behavior_score: number;
  user_type: string;
  analysis_time: string;
}

// 标签趋势类型
export interface TagTrend {
  tag: string;
  mentions: number;
  growth_rate: number;
  heat_score: number;
  trend_direction: 'rising' | 'stable' | 'declining';
}

// 分类趋势类型
export interface CategoryTrend {
  category: string;
  article_count: number;
  avg_quality_score: number;
  total_engagement: number;
  growth_momentum: number;
}

// 热门趋势类型
export interface HotnessTrend {
  time_slot: string;
  peak_articles: number;
  avg_hotness: number;
  engagement_peak: number;
}

// 内容类型趋势
export interface ContentTypeTrend {
  type: string;
  count: number;
  engagement_rate: number;
  avg_sentiment: number;
}

// 参与趋势类型
export interface EngagementTrend {
  metric: string;
  current_value: number;
  change_rate: number;
  trend_direction: 'up' | 'down' | 'stable';
}

// 病毒传播数据类型
export interface ViralData {
  pin_id: string;
  viral_score: number;
  spread_rate: number;
  peak_engagement: number;
  reach_estimate: number;
}

// 跨平台趋势类型
export interface CrossPlatformTrend {
  topic: string;
  article_mentions: number;
  pin_mentions: number;
  cross_platform_score: number;
  trend_strength: 'weak' | 'moderate' | 'strong' | 'viral';
  prediction: {
    direction: 'rising' | 'stable' | 'declining';
    confidence: number;
    estimated_peak: string;
  };
}

// 工具参数类型
export interface ToolParams {
  [key: string]: string | number | boolean | string[] | undefined;
}

// 缓存相关类型
export interface CacheValue<T = unknown> {
  data: T;
  timestamp: number;
  priority: 'hot' | 'warm' | 'cold';
  hits: number;
}

// 批处理相关类型
export interface BatchOptions {
  maxConcurrency?: number;
  retryAttempts?: number;
  shouldRetry?: (error: Error) => boolean;
  onProgress?: (completed: number, total: number) => void;
}

// 配置类型
export interface Config {
  api: {
    base_url: string;
    timeout: number;
    retry_attempts: number;
  };
  auth: {
    cookie?: string;
    aid?: string;
    uuid?: string;
    enable_auth_features?: boolean;
  };
  analysis: {
    trend_window_hours: number;
    quality_weights: {
      engagement: number;
      content_depth: number;
      originality: number;
      feedback: number;
    };
  };
  cache: {
    ttl_seconds: number;
    max_entries: number;
    enable_cache?: boolean;
  };
  performance: {
    max_concurrency?: number;
    batch_size?: number;
    enable_batching?: boolean;
  };
}

// Analytics Service 专用类型
export interface TagTrendData {
  count: number;
  total_engagement: number;
  avg_engagement: number;
  growth_rate: number;
  heat_score: number;
}

export interface TagTrendResult {
  tag: string;
  count: number;
  total_engagement: number;
  avg_engagement: number;
  growth_rate: number;
  heat_score: number;
}

export interface CategoryTrendData {
  count: number;
  total_engagement: number;
  avg_quality_score: number;
  avg_engagement: number;
}

export interface CategoryTrendResult {
  category: string;
  count: number;
  total_engagement: number;
  avg_quality_score: number;
  avg_engagement: number;
}

export interface HourlyTrendData {
  hour: number;
  article_count: number;
  avg_hotness: number;
  total_engagement: number;
}

export interface TopArticleData {
  article_id: string;
  title: string;
  author: string;
  engagement: number;
  quality_score: number;
}

export interface ContentTypeTrendData {
  content_type: string;
  count: number;
  percentage: number;
}

export interface HourlyEngagementData {
  hour: number;
  pin_count: number;
  total_diggs: number;
  total_comments: number;
  avg_engagement: number;
}

export interface SentimentTrendData {
  sentiment: string;
  count: number;
  percentage: number;
}

export interface ViralPinData {
  pin_id: string;
  content: string;
  author: string;
  digg_count: number;
  comment_count: number;
  viral_score: number;
}

export interface ArticleTrendAnalysis {
  tag_trends: TagTrendResult[];
  category_trends: CategoryTrendResult[];
  hotness_trends: HourlyTrendData[];
  top_articles: TopArticleData[];
}

export interface PinTrendAnalysis {
  content_type_trends: ContentTypeTrendData[];
  engagement_trends: HourlyEngagementData[];
  sentiment_trends: SentimentTrendData[];
  viral_pins: ViralPinData[];
}

export interface PlatformUserStats {
  total_users: number;
  active_users: number;
  new_users: number;
  content_creators: number;
  avg_user_quality: number;
}

export interface PlatformInsights {
  platform_health: 'excellent' | 'good' | 'fair' | 'poor';
  content_ecosystem: {
    content_balance: 'balanced' | 'article_heavy' | 'pin_heavy';
    quality_trend: 'improving' | 'stable' | 'declining';
    diversity_score: number;
  };
  engagement_distribution: {
    high_engagement_percentage: number;
    medium_engagement_percentage: number;
    low_engagement_percentage: number;
  };
  growth_opportunities: string[];
  recommendations: string[];
}

// 趋势预测相关类型
export interface TrendPrediction {
  direction: 'rising' | 'stable' | 'declining';
  confidence: number;
  estimated_peak: string;
  recommended_actions: string[];
}

export interface TrendSummary {
  total_trends: number;
  rising_trends: number;
  declining_trends: number;
  stable_trends: number;
  diversity: 'low' | 'medium' | 'high';
  overall_activity: 'low' | 'medium' | 'high';
  key_insights: string[];
}
