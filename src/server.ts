#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// 导入所有工具
import { articleTools, articleToolHandler } from './tools/article-tools.js';
import { pinTools, pinToolHandler } from './tools/pin-tools.js';
import { analyticsTools, analyticsToolHandler } from './tools/analytics-tools.js';
import { recommendationTools, recommendationToolHandler } from './tools/recommendation-tools.js';
import { performanceTools, performanceToolHandler } from './tools/performance-tools.js';
import { authTools, authToolHandler } from './tools/auth-tools.js';
import { getServerInfo } from './utils/package-info.js';

/**
 * 智能聚合型掘金MCP服务器
 * 提供掘金数据获取、分析和智能推荐功能
 * 
 * 版本信息和配置从package.json动态读取
 */
export class JuejinMcpServer {
  private server: Server;
  private tools: Tool[] = [];

  constructor() {
    const serverInfo = getServerInfo();
    this.server = new Server(
      {
        name: serverInfo.name,
        version: serverInfo.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.registerTools();
  }

  /**
   * 设置MCP处理器
   */
  private setupHandlers(): void {
    // 工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    // 工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        console.log(`[MCP] Calling tool: ${name} with args:`, args);
        
        // 文章相关工具
        if (name === 'get_articles') {
          return await articleToolHandler.handleGetArticles(args);
        }
        if (name === 'search_articles') {
          return await articleToolHandler.handleSearchArticles(args);
        }
        if (name === 'get_article_recommendations') {
          return await articleToolHandler.handleGetArticleRecommendations(args);
        }
        if (name === 'analyze_article_quality') {
          return await articleToolHandler.handleAnalyzeArticleQuality(args);
        }
        if (name === 'get_trending_articles') {
          return await articleToolHandler.handleGetTrendingArticles(args);
        }

        // 沸点相关工具
        if (name === 'get_pins') {
          return await pinToolHandler.handleGetPins(args);
        }
        if (name === 'search_pins') {
          return await pinToolHandler.handleSearchPins(args);
        }
        if (name === 'get_hot_topics') {
          return await pinToolHandler.handleGetHotTopics(args);
        }
        if (name === 'analyze_pin_trends') {
          return await pinToolHandler.handleAnalyzePinTrends(args);
        }
        if (name === 'get_pin_recommendations') {
          return await pinToolHandler.handleGetPinRecommendations(args);
        }

        // 分析相关工具
        if (name === 'analyze_trends') {
          return await analyticsToolHandler.handleAnalyzeTrends(args);
        }
        if (name === 'get_simple_trends') {
          return await analyticsToolHandler.handleGetSimpleTrends(args);
        }
        if (name === 'analyze_content_quality') {
          return await analyticsToolHandler.handleAnalyzeContentQuality(args);
        }
        if (name === 'analyze_user_interests') {
          return await analyticsToolHandler.handleAnalyzeUserInterests(args);
        }
        if (name === 'generate_trend_report') {
          return await analyticsToolHandler.handleGenerateTrendReport(args);
        }
        if (name === 'compare_content') {
          return await analyticsToolHandler.handleCompareContent(args);
        }
        if (name === 'predict_popularity') {
          return await analyticsToolHandler.handlePredictPopularity(args);
        }

        // 推荐相关工具
        if (name === 'get_recommendations') {
          return await recommendationToolHandler.handleGetRecommendations(args);
        }
        if (name === 'get_user_recommendations') {
          return await recommendationToolHandler.handleGetUserRecommendations(args);
        }
        if (name === 'generate_user_report') {
          return await recommendationToolHandler.handleGenerateUserReport(args);
        }
        if (name === 'update_recommendations') {
          return await recommendationToolHandler.handleUpdateRecommendations(args);
        }
        if (name === 'get_trending_recommendations') {
          return await recommendationToolHandler.handleGetTrendingRecommendations(args);
        }
        if (name === 'get_simple_recommendations') {
          return await recommendationToolHandler.handleGetSimpleRecommendations(args);
        }

        // 性能相关工具
        if (name === 'get_performance_stats') {
          return await performanceToolHandler.handleGetPerformanceStats(args);
        }
        if (name === 'get_cache_stats') {
          return await performanceToolHandler.handleGetCacheStats(args);
        }
        if (name === 'get_system_health') {
          return await performanceToolHandler.handleGetSystemHealth(args);
        }
        if (name === 'optimize_performance') {
          return await performanceToolHandler.handleOptimizePerformance(args);
        }
        if (name === 'run_performance_benchmark') {
          return await performanceToolHandler.handleRunPerformanceBenchmark(args);
        }

        // 授权相关工具
        if (name === 'check_auth_status') {
          return await authToolHandler.handleCheckAuthStatus(args);
        }
        if (name === 'like_article') {
          return await authToolHandler.handleLikeArticle(args);
        }
        if (name === 'like_pin') {
          return await authToolHandler.handleLikePin(args);
        }
        if (name === 'collect_article') {
          return await authToolHandler.handleCollectArticle(args);
        }
        if (name === 'follow_user') {
          return await authToolHandler.handleFollowUser(args);
        }
        if (name === 'get_user_profile') {
          return await authToolHandler.handleGetUserProfile(args);
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        console.error(`[MCP] Tool ${name} error:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 注册所有MCP工具
   */
  private registerTools(): void {
    this.tools = [
      // 文章相关工具
      ...articleTools,
      // 沸点相关工具
      ...pinTools,
      // 分析相关工具
      ...analyticsTools,
      // 推荐相关工具
      ...recommendationTools,
      // 性能相关工具
      ...performanceTools,
      // 授权相关工具
      ...authTools,
    ];
  }





  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP] Juejin MCP Server started successfully');
  }

  /**
   * 获取已注册的工具列表
   */
  getTools(): Tool[] {
    return this.tools;
  }

  /**
   * 获取服务器信息
   */
  getServerInfo() {
    return getServerInfo();
  }
}


