#!/usr/bin/env node

/**
 * 掘金智能聚合MCP服务器
 * 
 * 这是一个基于Model Context Protocol (MCP)的智能服务器，
 * 提供掘金平台的数据聚合、分析和推荐功能。
 * 
 * 主要功能：
 * - 文章和沸点数据获取  
 * - 智能内容分析和质量评估
 * - 趋势识别和预测
 * - 个性化推荐系统
 * - 用户行为分析
 * 
 * 使用方法：
 * npm start 或 node dist/index.js 或 npx juejin-mcp-server
 */

import { JuejinMcpServer } from './server.js';
import { runPerformanceBenchmark } from './utils/performance-monitor.js';
import { getBrandInfo } from './utils/package-info.js';

/**
 * 主函数 - 启动MCP服务器
 */
async function main() {
  const brandInfo = getBrandInfo();
  console.log(`🚀 启动${brandInfo.displayName}...`);
  console.log(`📦 ${brandInfo.fullName}`);
  console.log(`📝 ${brandInfo.description}`);
  console.log('');
  
  try {
    // 创建服务器实例
    const server = new JuejinMcpServer();
    
    // 运行性能基准测试
    await runPerformanceBenchmark();

    // 启动服务器
    await server.start();

    console.log(`✅ ${brandInfo.displayName}启动成功！`);
    console.log('📊 可用功能：');
    console.log('   • 文章数据获取和分析');
    console.log('   • 沸点数据获取和分析');
    console.log('   • 智能趋势分析');
    console.log('   • 个性化推荐系统');
    console.log('   • 用户行为分析');
    console.log('   • 内容质量评估');
    console.log('   • 性能监控和优化');
    console.log('');
    console.log('🔧 支持的工具数量 34+');
    console.log('🧠 集成AI分析能力：趋势识别、质量评估、推荐算法');
    console.log('⚡ 性能优化：智能缓存、批处理、并发控制');
    console.log('🔐 授权功能：点赞、收藏、关注等用户操作');
    console.log('');
    console.log(`📖 使用文档：${brandInfo.homepageUrl}`);
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

/**
 * 优雅关闭处理
 */
function setupGracefulShutdown() {
  const shutdown = (signal: string) => {
    console.log(`\n📴 收到 ${signal} 信号，正在关闭服务器...`);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * 错误处理
 */
function setupErrorHandling() {
  process.on('uncaughtException', (error) => {
    console.error('💥 未捕获的异常:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 未处理的Promise拒绝:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });
}

// 设置错误处理和优雅关闭
setupErrorHandling();
setupGracefulShutdown();

// 启动服务器
main().catch((error) => {
  console.error('💥 启动过程中发生错误:', error);
  process.exit(1);
});
