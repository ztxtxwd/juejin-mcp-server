import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { JuejinResponse } from '../types/index.js';
import { getConfig, getAuthHeaders, getUrlParams } from '../utils/config.js';

/**
 * 掘金API基础HTTP客户端
 * 提供统一的请求处理、错误处理和重试机制
 */
export class JuejinApiClient {
  private client: AxiosInstance;
  private config = getConfig();
  private readonly maxRetries: number;
  private readonly retryDelay: number = 1000;

  constructor() {
    this.maxRetries = this.config.api.retry_attempts;

    this.client = axios.create({
      baseURL: this.config.api.base_url,
      timeout: this.config.api.timeout,
      headers: getAuthHeaders(this.config),
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      config => {
        console.error(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      error => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      response => {
        console.error(`[API] Response: ${response.status} ${response.config.url}`);
        return response;
      },
      error => {
        console.error('[API] Response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 通用GET请求
   */
  async get<T>(url: string, params?: Record<string, any>): Promise<JuejinResponse<T>> {
    return this.requestWithRetry(() => this.client.get<JuejinResponse<T>>(url, { params }));
  }

  /**
   * 通用POST请求
   */
  async post<T>(
    url: string,
    data?: Record<string, any>,
    params?: Record<string, any>
  ): Promise<JuejinResponse<T>> {
    // 合并默认URL参数
    const mergedParams = {
      ...getUrlParams(this.config),
      ...params,
    };

    return this.requestWithRetry(() =>
      this.client.post<JuejinResponse<T>>(url, data, { params: mergedParams })
    );
  }

  /**
   * 带重试机制的请求执行
   */
  private async requestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<JuejinResponse<T>>>
  ): Promise<JuejinResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await requestFn();

        // 检查业务层面的错误
        if (response.data.err_no !== 0) {
          throw new Error(`API Error: ${response.data.err_msg} (code: ${response.data.err_no})`);
        }

        return response.data;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[API] Attempt ${attempt}/${this.maxRetries} failed:`, error);

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Request failed after ${this.maxRetries} attempts: ${lastError!.message}`);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 构建查询参数
   */
  static buildParams(params: Record<string, any>): Record<string, any> {
    const cleanParams: Record<string, any> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });

    return cleanParams;
  }

  /**
   * 格式化错误信息
   */
  static formatError(error: any): string {
    if (error.response) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      return 'Network error: No response received';
    } else {
      return `Request error: ${error.message}`;
    }
  }
}

// 导出单例实例
export const apiClient = new JuejinApiClient();
