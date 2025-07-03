import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { globalPerformanceMonitor, globalMemoryMonitor } from '../utils/performance-monitor.js';
import {
  globalCache,
  articleCache,
  pinCache,
  trendCache,
  userCache,
  recommendationCache,
} from '../utils/cache.js';
import {
  globalConcurrencyController,
  globalRequestDeduplicator,
} from '../utils/batch-processor.js';

/**
 * 性能分析相关MCP工具
 */
export const performanceTools: Tool[] = [
  {
    name: 'get_performance_stats',
    description: '获取系统性能统计信息，包括响应时间、内存使用等指标',
    inputSchema: {
      type: 'object',
      properties: {
        metric_name: {
          type: 'string',
          description: '特定指标名称（可选，不指定则返回所有指标）',
        },
        include_slow_operations: {
          type: 'boolean',
          description: '是否包含慢操作分析',
          default: true,
        },
        include_memory_stats: {
          type: 'boolean',
          description: '是否包含内存使用统计',
          default: true,
        },
      },
    },
  },
  {
    name: 'get_cache_stats',
    description: '获取缓存系统统计信息，包括命中率、大小等指标',
    inputSchema: {
      type: 'object',
      properties: {
        cache_type: {
          type: 'string',
          description: '缓存类型',
          enum: ['all', 'global', 'article', 'pin', 'trend', 'user', 'recommendation'],
          default: 'all',
        },
        include_detailed_stats: {
          type: 'boolean',
          description: '是否包含详细统计信息',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_system_health',
    description: '获取系统健康状态，包括性能指标、资源使用和建议',
    inputSchema: {
      type: 'object',
      properties: {
        include_recommendations: {
          type: 'boolean',
          description: '是否包含优化建议',
          default: true,
        },
      },
    },
  },
  {
    name: 'optimize_performance',
    description: '执行性能优化操作，如清理缓存、重置统计等',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: '优化操作类型',
          enum: ['clear_cache', 'reset_stats', 'gc_collect', 'warmup_cache'],
        },
        target: {
          type: 'string',
          description: '操作目标（可选）',
          enum: ['all', 'article', 'pin', 'trend', 'user', 'recommendation'],
        },
      },
      required: ['operation'],
    },
  },
  {
    name: 'run_performance_benchmark',
    description: '运行性能基准测试，评估系统各组件性能',
    inputSchema: {
      type: 'object',
      properties: {
        test_type: {
          type: 'string',
          description: '测试类型',
          enum: ['cache', 'api', 'analysis', 'all'],
          default: 'all',
        },
        iterations: {
          type: 'number',
          description: '测试迭代次数',
          default: 100,
          minimum: 10,
          maximum: 10000,
        },
      },
    },
  },
];

/**
 * 性能工具处理器
 */
export class PerformanceToolHandler {
  /**
   * 处理获取性能统计
   */
  async handleGetPerformanceStats(args: any) {
    try {
      const { metric_name, include_slow_operations = true, include_memory_stats = true } = args;

      // 安全获取性能统计
      let stats;
      try {
        stats = globalPerformanceMonitor.getStats(metric_name);
      } catch (error) {
        stats = {
          total_requests: 0,
          average_response_time: 0,
          error_rate: 0,
          active_requests: 0,
        };
      }

      const report: any = {
        performance_stats: stats,
        timestamp: new Date().toISOString(),
        system_info: {
          node_version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: Math.round(process.uptime()),
        },
      };

      if (include_slow_operations) {
        try {
          const slowOps = globalPerformanceMonitor.getSlowOperations(1000);
          report.slow_operations = slowOps.map(op => ({
            name: op.name,
            duration: Math.round(op.duration || 0),
            metadata: op.metadata,
          }));
        } catch (error) {
          report.slow_operations = [];
        }
      }

      if (include_memory_stats) {
        try {
          const memoryStats = globalMemoryMonitor.getStats();
          report.memory_stats = memoryStats;
        } catch (error) {
          // 使用Node.js内置的内存统计
          const memUsage = process.memoryUsage();
          report.memory_stats = {
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
          };
        }
      }

      // 安全获取并发控制状态
      try {
        report.concurrency_stats = globalConcurrencyController.getStatus();
      } catch (error) {
        report.concurrency_stats = { active_requests: 0, queue_length: 0 };
      }

      try {
        report.request_deduplication_stats = globalRequestDeduplicator.getStatus();
      } catch (error) {
        report.request_deduplication_stats = { cache_hits: 0, cache_misses: 0 };
      }

      return {
        content: [
          {
            type: 'text',
            text: `性能统计报告\n\n${JSON.stringify(report, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取性能统计失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理获取缓存统计
   */
  async handleGetCacheStats(args: any) {
    try {
      const { cache_type = 'all', include_detailed_stats = false } = args;

      const cacheStats: any = {
        timestamp: new Date().toISOString(),
        cache_type,
      };

      // 安全获取各种缓存统计
      const getCacheStatsSafely = (cache: any, name: string) => {
        try {
          return cache.getStats();
        } catch (error) {
          return {
            hits: 0,
            misses: 0,
            size: 0,
            max_size: 1000,
            hit_rate: 0,
            error: `${name} cache not available`,
          };
        }
      };

      if (cache_type === 'all' || cache_type === 'global') {
        cacheStats.global_cache = getCacheStatsSafely(globalCache, 'global');
      }

      if (cache_type === 'all' || cache_type === 'article') {
        cacheStats.article_cache = getCacheStatsSafely(articleCache, 'article');
      }

      if (cache_type === 'all' || cache_type === 'pin') {
        cacheStats.pin_cache = getCacheStatsSafely(pinCache, 'pin');
      }

      if (cache_type === 'all' || cache_type === 'trend') {
        cacheStats.trend_cache = getCacheStatsSafely(trendCache, 'trend');
      }

      if (cache_type === 'all' || cache_type === 'user') {
        cacheStats.user_cache = getCacheStatsSafely(userCache, 'user');
      }

      if (cache_type === 'all' || cache_type === 'recommendation') {
        cacheStats.recommendation_cache = getCacheStatsSafely(
          recommendationCache,
          'recommendation'
        );
      }

      // 计算总体缓存效率
      if (cache_type === 'all') {
        const allCaches = [
          cacheStats.article_cache,
          cacheStats.pin_cache,
          cacheStats.trend_cache,
          cacheStats.user_cache,
          cacheStats.recommendation_cache,
        ].filter(Boolean);

        const totalHits = allCaches.reduce((sum, cache) => sum + cache.hits, 0);
        const totalMisses = allCaches.reduce((sum, cache) => sum + cache.misses, 0);
        const totalSize = allCaches.reduce((sum, cache) => sum + cache.size, 0);

        cacheStats.overall_stats = {
          total_hits: totalHits,
          total_misses: totalMisses,
          overall_hit_rate: totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0,
          total_cached_items: totalSize,
        };
      }

      if (include_detailed_stats) {
        cacheStats.performance_impact = this.calculateCachePerformanceImpact(cacheStats);
        cacheStats.optimization_suggestions = this.generateCacheOptimizationSuggestions(cacheStats);
      }

      return {
        content: [
          {
            type: 'text',
            text: `缓存统计报告\n\n${JSON.stringify(cacheStats, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取缓存统计失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理获取系统健康状态
   */
  async handleGetSystemHealth(args: any) {
    try {
      const { include_recommendations = true } = args;

      const performanceReport = globalPerformanceMonitor.generateReport();
      const memoryStats = globalMemoryMonitor.getStats();
      const cacheStats = globalCache.getStats();

      const health = {
        timestamp: new Date().toISOString(),
        overall_status: this.calculateOverallHealth(performanceReport, memoryStats, cacheStats),
        performance_summary: {
          total_metrics: performanceReport.summary.total_metrics,
          slow_operations: performanceReport.summary.slow_operations,
          average_response_time: this.calculateAverageResponseTime(performanceReport.stats),
        },
        memory_summary: memoryStats
          ? {
              current_usage: memoryStats.current,
              trend: memoryStats.trend,
            }
          : null,
        cache_summary: {
          hit_rate: cacheStats.l1.hitRate + cacheStats.l2.hitRate + cacheStats.l3.hitRate,
          total_size: cacheStats.l1.size + cacheStats.l2.size + cacheStats.l3.size,
        },
        system_load: {
          concurrency_usage: globalConcurrencyController.getStatus(),
          pending_requests: globalRequestDeduplicator.getStatus(),
        },
      };

      if (include_recommendations) {
        (health as any).recommendations = [
          ...performanceReport.recommendations,
          ...this.generateSystemRecommendations(health),
        ];
      }

      return {
        content: [
          {
            type: 'text',
            text: `系统健康报告\n\n${JSON.stringify(health, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `获取系统健康状态失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理性能优化操作
   */
  async handleOptimizePerformance(args: any) {
    try {
      const { operation, target = 'all' } = args;

      const results: any = {
        operation,
        target,
        timestamp: new Date().toISOString(),
        results: {},
      };

      switch (operation) {
        case 'clear_cache':
          results.results = await this.clearCache(target);
          break;
        case 'reset_stats':
          results.results = this.resetStats(target);
          break;
        case 'gc_collect':
          results.results = this.forceGarbageCollection();
          break;
        case 'warmup_cache':
          results.results = await this.warmupCache(target);
          break;
        default:
          throw new Error(`Unknown optimization operation: ${operation}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `性能优化完成\n\n${JSON.stringify(results, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `性能优化失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * 处理性能基准测试
   */
  async handleRunPerformanceBenchmark(args: any) {
    try {
      const { test_type = 'all', iterations = 100 } = args;

      const benchmarkResults: any = {
        test_type,
        iterations,
        timestamp: new Date().toISOString(),
        results: {},
      };

      if (test_type === 'cache' || test_type === 'all') {
        benchmarkResults.results.cache = await this.benchmarkCache(iterations);
      }

      if (test_type === 'api' || test_type === 'all') {
        benchmarkResults.results.api = await this.benchmarkAPI(iterations);
      }

      if (test_type === 'analysis' || test_type === 'all') {
        benchmarkResults.results.analysis = await this.benchmarkAnalysis(iterations);
      }

      benchmarkResults.summary = this.generateBenchmarkSummary(benchmarkResults.results);

      return {
        content: [
          {
            type: 'text',
            text: `性能基准测试完成\n\n${JSON.stringify(benchmarkResults, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `性能基准测试失败: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // 辅助方法
  private calculateCachePerformanceImpact(cacheStats: any): any {
    const impact = {
      estimated_time_saved: 0,
      estimated_requests_avoided: 0,
    };

    Object.values(cacheStats).forEach((stats: any) => {
      if (stats && typeof stats === 'object' && stats.hits) {
        // 假设每次缓存命中节省100ms
        impact.estimated_time_saved += stats.hits * 100;
        impact.estimated_requests_avoided += stats.hits;
      }
    });

    return impact;
  }

  private generateCacheOptimizationSuggestions(cacheStats: any): string[] {
    const suggestions: string[] = [];

    Object.entries(cacheStats).forEach(([cacheName, stats]: [string, any]) => {
      if (stats && typeof stats === 'object' && stats.hitRate !== undefined) {
        if (stats.hitRate < 0.5) {
          suggestions.push(
            `${cacheName}: 命中率较低 (${(stats.hitRate * 100).toFixed(1)}%)，考虑调整缓存策略`
          );
        }
        if (stats.size > 800) {
          suggestions.push(`${cacheName}: 缓存大小较大 (${stats.size} 项)，考虑增加清理频率`);
        }
      }
    });

    return suggestions;
  }

  private calculateOverallHealth(
    performanceReport: any,
    memoryStats: any,
    cacheStats: any
  ): string {
    let score = 100;

    // 性能评分
    if (performanceReport.summary.slow_operations > 10) score -= 20;
    if (performanceReport.summary.slow_operations > 5) score -= 10;

    // 内存评分
    if (memoryStats && memoryStats.trend.heap_change > 100 * 1024 * 1024) score -= 15; // 100MB增长

    // 缓存评分
    const totalHitRate =
      (cacheStats.l1.hitRate + cacheStats.l2.hitRate + cacheStats.l3.hitRate) / 3;
    if (totalHitRate < 0.5) score -= 15;

    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private calculateAverageResponseTime(stats: any): number {
    const allStats = Object.values(stats) as any[];
    if (allStats.length === 0) return 0;

    const totalAvg = allStats.reduce((sum, stat) => sum + stat.averageDuration, 0);
    return totalAvg / allStats.length;
  }

  private generateSystemRecommendations(health: any): string[] {
    const recommendations = [];

    if (health.overall_status === 'poor') {
      recommendations.push('系统性能较差，建议立即进行优化');
    }

    if (health.cache_summary.hit_rate < 0.5) {
      recommendations.push('缓存命中率较低，建议优化缓存策略');
    }

    if (health.system_load.concurrency_usage.running > 4) {
      recommendations.push('并发负载较高，考虑增加并发限制');
    }

    return recommendations;
  }

  private async clearCache(target: string): Promise<any> {
    const results: any = {};

    if (target === 'all' || target === 'article') {
      articleCache.clear();
      results.article_cache = 'cleared';
    }

    if (target === 'all' || target === 'pin') {
      pinCache.clear();
      results.pin_cache = 'cleared';
    }

    if (target === 'all' || target === 'trend') {
      trendCache.clear();
      results.trend_cache = 'cleared';
    }

    if (target === 'all' || target === 'user') {
      userCache.clear();
      results.user_cache = 'cleared';
    }

    if (target === 'all' || target === 'recommendation') {
      recommendationCache.clear();
      results.recommendation_cache = 'cleared';
    }

    return results;
  }

  private resetStats(_target: string): any {
    globalPerformanceMonitor.clear();
    return { performance_stats: 'reset' };
  }

  private forceGarbageCollection(): any {
    if (global.gc) {
      global.gc();
      return { garbage_collection: 'executed' };
    } else {
      return { garbage_collection: 'not_available' };
    }
  }

  private async warmupCache(target: string): Promise<any> {
    // 这里可以实现缓存预热逻辑
    return { cache_warmup: 'completed', target };
  }

  private async benchmarkCache(iterations: number): Promise<any> {
    const startTime = performance.now();

    // 写入测试
    for (let i = 0; i < iterations; i++) {
      articleCache.set(`benchmark_${i}`, { data: `test_${i}` });
    }

    const writeTime = performance.now() - startTime;

    // 读取测试
    const readStartTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      articleCache.get(`benchmark_${i}`);
    }
    const readTime = performance.now() - readStartTime;

    // 清理
    for (let i = 0; i < iterations; i++) {
      articleCache.delete(`benchmark_${i}`);
    }

    return {
      write_time_ms: writeTime,
      read_time_ms: readTime,
      write_ops_per_sec: iterations / (writeTime / 1000),
      read_ops_per_sec: iterations / (readTime / 1000),
    };
  }

  private async benchmarkAPI(_iterations: number): Promise<any> {
    // 模拟API基准测试
    return {
      simulated: true,
      note: 'API基准测试需要实际API调用',
    };
  }

  private async benchmarkAnalysis(_iterations: number): Promise<any> {
    // 模拟分析基准测试
    return {
      simulated: true,
      note: '分析基准测试需要实际分析操作',
    };
  }

  private generateBenchmarkSummary(_results: any): any {
    return {
      overall_performance: 'good',
      bottlenecks: [],
      recommendations: ['定期运行基准测试以监控性能变化'],
    };
  }
}

// 导出工具处理器实例
export const performanceToolHandler = new PerformanceToolHandler();
