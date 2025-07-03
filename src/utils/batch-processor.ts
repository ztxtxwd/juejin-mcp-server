/**
 * 批处理和并发控制工具
 * 优化API请求性能和资源利用
 */

interface BatchRequest<T, R> {
  id: string;
  input: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface BatchProcessorOptions {
  batchSize: number;
  maxWaitTime: number;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * 智能批处理器
 */
export class BatchProcessor<T, R> {
  private queue: BatchRequest<T, R>[] = [];
  private processing = false;
  private options: BatchProcessorOptions;
  private activeBatches = 0;

  constructor(
    private processor: (batch: T[]) => Promise<R[]>,
    options: Partial<BatchProcessorOptions> = {}
  ) {
    this.options = {
      batchSize: 10,
      maxWaitTime: 100,
      maxConcurrency: 3,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options,
    };
  }

  /**
   * 添加请求到批处理队列
   */
  async add(input: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const request: BatchRequest<T, R> = {
        id: this.generateId(),
        input,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(request);
      this.scheduleProcessing();
    });
  }

  /**
   * 调度批处理
   */
  private scheduleProcessing(): void {
    if (this.processing) return;

    this.processing = true;

    // 立即处理或等待更多请求
    const shouldProcessImmediately =
      this.queue.length >= this.options.batchSize ||
      this.activeBatches < this.options.maxConcurrency;

    if (shouldProcessImmediately) {
      setImmediate(() => this.processBatch());
    } else {
      setTimeout(() => this.processBatch(), this.options.maxWaitTime);
    }
  }

  /**
   * 处理批次
   */
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    // 检查并发限制
    if (this.activeBatches >= this.options.maxConcurrency) {
      setTimeout(() => this.processBatch(), 50);
      return;
    }

    // 提取批次
    const batchSize = Math.min(this.options.batchSize, this.queue.length);
    const batch = this.queue.splice(0, batchSize);

    this.activeBatches++;

    try {
      await this.executeBatch(batch);
    } catch (error) {
      console.error('[BatchProcessor] Batch execution failed:', error);
    } finally {
      this.activeBatches--;

      // 继续处理剩余队列
      if (this.queue.length > 0) {
        setImmediate(() => this.processBatch());
      } else {
        this.processing = false;
      }
    }
  }

  /**
   * 执行批次处理
   */
  private async executeBatch(batch: BatchRequest<T, R>[]): Promise<void> {
    const inputs = batch.map(req => req.input);

    let attempt = 0;
    while (attempt < this.options.retryAttempts) {
      try {
        const results = await this.processor(inputs);

        // 分发结果
        batch.forEach((request, index) => {
          if (results[index] !== undefined) {
            request.resolve(results[index]);
          } else {
            request.reject(new Error('No result for request'));
          }
        });

        return;
      } catch (error) {
        attempt++;

        if (attempt >= this.options.retryAttempts) {
          // 最终失败，拒绝所有请求
          batch.forEach(request => {
            request.reject(error as Error);
          });
          throw error;
        }

        // 等待后重试
        await this.delay(this.options.retryDelay * attempt);
      }
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeBatches: this.activeBatches,
      processing: this.processing,
    };
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

/**
 * 并发控制器
 */
export class ConcurrencyController {
  private running = 0;
  private queue: Array<() => Promise<any>> = [];

  constructor(private maxConcurrency: number = 5) {}

  /**
   * 执行任务
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      if (this.running < this.maxConcurrency) {
        this.running++;
        wrappedTask();
      } else {
        this.queue.push(wrappedTask);
      }
    });
  }

  /**
   * 处理队列
   */
  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task();
      }
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrency: this.maxConcurrency,
    };
  }
}

/**
 * 请求去重器
 */
export class RequestDeduplicator<T> {
  private pendingRequests = new Map<string, Promise<T>>();

  /**
   * 执行去重请求
   */
  async execute(key: string, factory: () => Promise<T>): Promise<T> {
    // 如果已有相同请求在处理，返回相同的Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // 创建新请求
    const promise = factory().finally(() => {
      // 请求完成后清理
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      pendingCount: this.pendingRequests.size,
      pendingKeys: Array.from(this.pendingRequests.keys()),
    };
  }

  /**
   * 清空所有待处理请求
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * 智能重试器
 */
export class SmartRetry {
  static async execute<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      shouldRetry?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      shouldRetry = () => true,
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // 检查是否应该重试
        if (attempt === maxAttempts || !shouldRetry(error)) {
          throw error;
        }

        // 计算延迟时间（指数退避）
        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);

        console.warn(`[SmartRetry] Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// 全局实例
export const globalConcurrencyController = new ConcurrencyController(5);
export const globalRequestDeduplicator = new RequestDeduplicator();

// 专用批处理器工厂
export function createArticleBatchProcessor() {
  return new BatchProcessor(
    async (articleIds: string[]) => {
      const { articleApi } = await import('../api/articles.js');
      return Promise.all(articleIds.map(id => articleApi.getArticleDetail(id)));
    },
    { batchSize: 5, maxWaitTime: 200, maxConcurrency: 2 }
  );
}

export function createPinBatchProcessor() {
  return new BatchProcessor(
    async (pinIds: string[]) => {
      const { pinApi } = await import('../api/pins.js');
      return Promise.all(pinIds.map(id => pinApi.getPinDetail(id)));
    },
    { batchSize: 10, maxWaitTime: 100, maxConcurrency: 3 }
  );
}

export function createUserBatchProcessor() {
  return new BatchProcessor(
    async (userIds: string[]) => {
      const { userApi } = await import('../api/users.js');
      return Promise.all(userIds.map(id => userApi.getUserInfo(id)));
    },
    { batchSize: 8, maxWaitTime: 150, maxConcurrency: 2 }
  );
}
