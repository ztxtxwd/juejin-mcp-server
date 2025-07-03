/**
 * 智能缓存管理器
 * 提供多级缓存和智能过期策略
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class SmartCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private stats = { hits: 0, misses: 0 };
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    // 5分钟默认TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // 定期清理过期缓存
    setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccess: now,
    };

    // 如果缓存已满，移除最少使用的项
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, item);
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();

    // 检查是否过期
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // 更新访问统计
    item.accessCount++;
    item.lastAccess = now;
    this.stats.hits++;

    return item.data;
  }

  /**
   * 获取或设置缓存（常用模式）
   */
  async getOrSet<R>(key: string, factory: () => Promise<R>, ttl?: number): Promise<R> {
    const cached = this.get(key) as R;
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data as unknown as T, ttl);
    return data;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired items`);
    }
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccess < oldestTime) {
        oldestTime = item.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 预热缓存
   */
  async warmup(keys: string[], factory: (key: string) => Promise<T>): Promise<void> {
    console.log(`[Cache] Warming up ${keys.length} cache entries...`);

    const promises = keys.map(async key => {
      try {
        const data = await factory(key);
        this.set(key, data);
      } catch (error) {
        console.warn(`[Cache] Failed to warm up key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log(`[Cache] Warmup completed`);
  }
}

/**
 * 缓存键生成器
 */
export class CacheKeyGenerator {
  static article(params: any): string {
    const { sort_type, category_id, limit, cursor } = params;
    return `article:${sort_type}:${category_id || 'all'}:${limit}:${cursor || ''}`;
  }

  static pin(params: any): string {
    const { sort_type, topic_id, limit, cursor } = params;
    return `pin:${sort_type}:${topic_id || 'all'}:${limit}:${cursor || ''}`;
  }

  static search(type: string, keyword: string, limit: number): string {
    return `search:${type}:${keyword}:${limit}`;
  }

  static trend(timeRange: number, category?: string): string {
    return `trend:${timeRange}:${category || 'all'}`;
  }

  static userAnalysis(userId: string): string {
    return `user_analysis:${userId}`;
  }

  static recommendation(userId: string, interests: string[], algorithm: string): string {
    const interestKey = interests.sort().join(',');
    return `rec:${userId}:${algorithm}:${interestKey}`;
  }

  static quality(contentId: string, contentType: string): string {
    return `quality:${contentType}:${contentId}`;
  }
}

/**
 * 分层缓存管理器
 */
export class LayeredCache {
  private l1Cache: SmartCache<any>; // 热数据缓存
  private l2Cache: SmartCache<any>; // 温数据缓存
  private l3Cache: SmartCache<any>; // 冷数据缓存

  constructor() {
    this.l1Cache = new SmartCache(200, 60000); // 1分钟，热数据
    this.l2Cache = new SmartCache(500, 300000); // 5分钟，温数据
    this.l3Cache = new SmartCache(1000, 1800000); // 30分钟，冷数据
  }

  /**
   * 智能获取缓存
   */
  get(key: string): any {
    // 优先从L1缓存获取
    let data = this.l1Cache.get(key);
    if (data !== null) return data;

    // 从L2缓存获取并提升到L1
    data = this.l2Cache.get(key);
    if (data !== null) {
      this.l1Cache.set(key, data);
      return data;
    }

    // 从L3缓存获取并提升到L2
    data = this.l3Cache.get(key);
    if (data !== null) {
      this.l2Cache.set(key, data);
      return data;
    }

    return null;
  }

  /**
   * 智能设置缓存
   */
  set(key: string, data: any, priority: 'hot' | 'warm' | 'cold' = 'warm'): void {
    switch (priority) {
      case 'hot':
        this.l1Cache.set(key, data);
        break;
      case 'warm':
        this.l2Cache.set(key, data);
        break;
      case 'cold':
        this.l3Cache.set(key, data);
        break;
    }
  }

  /**
   * 获取综合统计
   */
  getStats() {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats(),
      l3: this.l3Cache.getStats(),
    };
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();
  }
}

// 全局缓存实例
export const globalCache = new LayeredCache();

// 专用缓存实例
export const articleCache = new SmartCache<any>(500, 300000);
export const pinCache = new SmartCache<any>(500, 180000);
export const trendCache = new SmartCache<any>(100, 600000);
export const userCache = new SmartCache<any>(200, 900000);
export const recommendationCache = new SmartCache<any>(300, 1800000);
