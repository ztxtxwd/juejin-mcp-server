/**
 * 性能监控和分析工具
 * 提供详细的性能指标收集和分析
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeMetrics = new Map<string, PerformanceMetric>();
  private maxMetrics: number;

  constructor(maxMetrics: number = 10000) {
    this.maxMetrics = maxMetrics;
  }

  /**
   * 开始性能测量
   */
  start(name: string, metadata?: Record<string, any>): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata: metadata || {},
    };

    this.activeMetrics.set(id, metric);
    return id;
  }

  /**
   * 结束性能测量
   */
  end(id: string): number | null {
    const metric = this.activeMetrics.get(id);
    if (!metric) {
      console.warn(`[PerformanceMonitor] Metric ${id} not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.activeMetrics.delete(id);
    this.addMetric(metric);

    return metric.duration;
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const id = this.start(name, metadata);
    try {
      const result = await fn();
      this.end(id);
      return result;
    } catch (error) {
      this.end(id);
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const id = this.start(name, metadata);
    try {
      const result = fn();
      this.end(id);
      return result;
    } catch (error) {
      this.end(id);
      throw error;
    }
  }

  /**
   * 添加指标
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 保持指标数量在限制内
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * 获取指标统计
   */
  getStats(name?: string): Record<string, PerformanceStats> {
    const filteredMetrics = name ? this.metrics.filter(m => m.name === name) : this.metrics;

    const groupedMetrics = this.groupBy(filteredMetrics, 'name');
    const stats: Record<string, PerformanceStats> = {};

    Object.entries(groupedMetrics).forEach(([metricName, metrics]) => {
      const durations = metrics
        .filter(m => m.duration !== undefined)
        .map(m => m.duration!)
        .sort((a, b) => a - b);

      if (durations.length === 0) {
        stats[metricName] = {
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          p50: 0,
          p95: 0,
          p99: 0,
        };
        return;
      }

      const totalDuration = durations.reduce((sum, d) => sum + d, 0);

      stats[metricName] = {
        count: durations.length,
        totalDuration,
        averageDuration: totalDuration / durations.length,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        p50: this.percentile(durations, 0.5),
        p95: this.percentile(durations, 0.95),
        p99: this.percentile(durations, 0.99),
      };
    });

    return stats;
  }

  /**
   * 获取最近的指标
   */
  getRecentMetrics(count: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * 获取慢查询
   */
  getSlowOperations(threshold: number = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration && m.duration > threshold);
  }

  /**
   * 清空指标
   */
  clear(): void {
    this.metrics = [];
    this.activeMetrics.clear();
  }

  /**
   * 生成性能报告
   */
  generateReport(): any {
    const stats = this.getStats();
    const slowOps = this.getSlowOperations();
    const recentMetrics = this.getRecentMetrics(50);

    return {
      summary: {
        total_metrics: this.metrics.length,
        active_metrics: this.activeMetrics.size,
        slow_operations: slowOps.length,
      },
      stats,
      slow_operations: slowOps.map(m => ({
        name: m.name,
        duration: m.duration,
        metadata: m.metadata,
        timestamp: new Date(Date.now() - (performance.now() - m.startTime)),
      })),
      recent_metrics: recentMetrics.map(m => ({
        name: m.name,
        duration: m.duration,
        metadata: m.metadata,
      })),
      recommendations: this.generateRecommendations(stats),
    };
  }

  /**
   * 生成性能建议
   */
  private generateRecommendations(stats: Record<string, PerformanceStats>): string[] {
    const recommendations: string[] = [];

    Object.entries(stats).forEach(([name, stat]) => {
      if (stat.averageDuration > 2000) {
        recommendations.push(`${name}: 平均响应时间过长 (${stat.averageDuration.toFixed(2)}ms)`);
      }

      if (stat.p95 > 5000) {
        recommendations.push(`${name}: P95响应时间过长 (${stat.p95.toFixed(2)}ms)`);
      }

      if (stat.maxDuration > 10000) {
        recommendations.push(`${name}: 存在极慢请求 (${stat.maxDuration.toFixed(2)}ms)`);
      }
    });

    return recommendations;
  }

  /**
   * 计算百分位数
   */
  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * 分组函数
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (groups, item) => {
        const groupKey = String(item[key]);
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  }
}

/**
 * 性能装饰器
 */
export function performanceMonitor(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return globalPerformanceMonitor.measure(metricName, () => originalMethod.apply(this, args), {
        args: args.length,
      });
    };

    return descriptor;
  };
}

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  private samples: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> = [];
  private maxSamples: number;

  constructor(maxSamples: number = 1000) {
    this.maxSamples = maxSamples;

    // 定期采样内存使用
    setInterval(() => this.sample(), 30000); // 每30秒采样一次
  }

  /**
   * 采样内存使用
   */
  sample(): void {
    const usage = process.memoryUsage();
    this.samples.push({
      timestamp: Date.now(),
      usage,
    });

    // 保持样本数量在限制内
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  /**
   * 获取内存统计
   */
  getStats(): any {
    if (this.samples.length === 0) {
      return null;
    }

    const latest = this.samples[this.samples.length - 1];
    const oldest = this.samples[0];

    return {
      current: {
        rss: this.formatBytes(latest.usage.rss),
        heapTotal: this.formatBytes(latest.usage.heapTotal),
        heapUsed: this.formatBytes(latest.usage.heapUsed),
        external: this.formatBytes(latest.usage.external),
        arrayBuffers: this.formatBytes(latest.usage.arrayBuffers),
      },
      trend: {
        rss_change: latest.usage.rss - oldest.usage.rss,
        heap_change: latest.usage.heapUsed - oldest.usage.heapUsed,
        sample_period_hours: (latest.timestamp - oldest.timestamp) / (1000 * 60 * 60),
      },
      samples_count: this.samples.length,
    };
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// 全局实例
export const globalPerformanceMonitor = new PerformanceMonitor();
export const globalMemoryMonitor = new MemoryMonitor();

// 启动时的性能基准测试
export async function runPerformanceBenchmark() {
  console.log('🔍 运行性能基准测试...');

  // 测试缓存性能
  const { articleCache } = await import('./cache.js');

  await globalPerformanceMonitor.measure('cache_write_benchmark', async () => {
    for (let i = 0; i < 1000; i++) {
      articleCache.set(`test_${i}`, { data: `test_data_${i}` });
    }
  });

  await globalPerformanceMonitor.measure('cache_read_benchmark', async () => {
    for (let i = 0; i < 1000; i++) {
      articleCache.get(`test_${i}`);
    }
  });

  // 清理测试数据
  for (let i = 0; i < 1000; i++) {
    articleCache.delete(`test_${i}`);
  }

  const stats = globalPerformanceMonitor.getStats();
  console.log('📊 基准测试结果:', {
    cache_write: stats.cache_write_benchmark?.averageDuration.toFixed(2) + 'ms',
    cache_read: stats.cache_read_benchmark?.averageDuration.toFixed(2) + 'ms',
  });
}
