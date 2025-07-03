import { Config } from '../types/index.js';

/**
 * 默认配置
 */
export const defaultConfig: Config = {
  api: {
    base_url: process.env.JUEJIN_API_BASE_URL || 'https://api.juejin.cn',
    timeout: parseInt(process.env.JUEJIN_API_TIMEOUT || '10000'),
    retry_attempts: parseInt(process.env.JUEJIN_API_RETRY_ATTEMPTS || '3'),
  },
  auth: {
    ...(process.env.JUEJIN_COOKIE && { cookie: process.env.JUEJIN_COOKIE }),
    ...(process.env.JUEJIN_AID && { aid: process.env.JUEJIN_AID }),
    ...(process.env.JUEJIN_UUID && { uuid: process.env.JUEJIN_UUID }),
    enable_auth_features: process.env.JUEJIN_ENABLE_AUTH === 'true',
  },
  analysis: {
    trend_window_hours: parseInt(process.env.JUEJIN_TREND_WINDOW_HOURS || '24'),
    quality_weights: {
      engagement: parseFloat(process.env.JUEJIN_QUALITY_WEIGHT_ENGAGEMENT || '0.4'),
      content_depth: parseFloat(process.env.JUEJIN_QUALITY_WEIGHT_CONTENT_DEPTH || '0.3'),
      originality: parseFloat(process.env.JUEJIN_QUALITY_WEIGHT_ORIGINALITY || '0.2'),
      feedback: parseFloat(process.env.JUEJIN_QUALITY_WEIGHT_FEEDBACK || '0.1'),
    },
  },
  cache: {
    ttl_seconds: parseInt(process.env.JUEJIN_CACHE_TTL_SECONDS || '300'),
    max_entries: parseInt(process.env.JUEJIN_CACHE_MAX_ENTRIES || '1000'),
    enable_cache: process.env.JUEJIN_ENABLE_CACHE !== 'false',
  },
  performance: {
    max_concurrency: parseInt(process.env.JUEJIN_MAX_CONCURRENCY || '5'),
    batch_size: parseInt(process.env.JUEJIN_BATCH_SIZE || '10'),
    enable_batching: process.env.JUEJIN_ENABLE_BATCHING !== 'false',
  },
};

/**
 * 获取配置
 */
export function getConfig(): Config {
  return defaultConfig;
}

/**
 * 验证配置
 */
export function validateConfig(config: Config): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证API配置
  if (!config.api.base_url) {
    errors.push('API base URL is required');
  }
  if (config.api.timeout <= 0) {
    errors.push('API timeout must be positive');
  }
  if (config.api.retry_attempts < 0) {
    errors.push('API retry attempts must be non-negative');
  }

  // 验证授权配置
  if (config.auth.enable_auth_features && !config.auth.cookie) {
    errors.push('Cookie is required when auth features are enabled');
  }

  // 验证质量权重
  const weights = config.analysis.quality_weights;
  const totalWeight =
    weights.engagement + weights.content_depth + weights.originality + weights.feedback;
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    errors.push('Quality weights must sum to 1.0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 获取授权头信息
 */
export function getAuthHeaders(config: Config): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  };

  if (config.auth.cookie) {
    headers.Cookie = config.auth.cookie;
  }

  return headers;
}

/**
 * 获取URL参数
 */
export function getUrlParams(config: Config): Record<string, string> {
  const params: Record<string, string> = {};

  if (config.auth.aid) {
    params.aid = config.auth.aid;
  }
  if (config.auth.uuid) {
    params.uuid = config.auth.uuid;
  }

  return params;
}

/**
 * 检查是否启用授权功能
 */
export function isAuthEnabled(config: Config): boolean {
  return config.auth.enable_auth_features === true && !!config.auth.cookie;
}

/**
 * 掘金API常量
 */
export const JUEJIN_CONSTANTS = {
  // 排序类型
  SORT_TYPE: {
    RECOMMEND: 200,
    LATEST: 300,
    HOT_3_DAYS: 3,
    HOT_7_DAYS: 7,
    HOT_30_DAYS: 30,
    HOT_ALL: 0,
  },

  // 分类ID
  CATEGORY_ID: {
    FRONTEND: '6809637767543259144',
    BACKEND: '6809637769959178254',
    ANDROID: '6809635626879549454',
    IOS: '6809635626661445640',
    AI: '6809637773935378440',
  },

  // 内容类型
  ITEM_TYPE: {
    ARTICLE: 2,
    ADVERT: 14,
    PIN: 4,
  },

  // API端点
  ENDPOINTS: {
    ARTICLE_LIST: '/recommend_api/v1/article/recommend_all_feed',
    PIN_LIST: '/recommend_api/v1/short_msg/recommend',
    USER_INFO: '/user_api/v1/user/get',
    CATEGORY_LIST: '/tag_api/v1/query_category_list',
    TAG_LIST: '/tag_api/v1/query_tag_list',
  },
} as const;
