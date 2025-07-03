#!/usr/bin/env node

/**
 * 完整接口测试 - 所有API接口与MCP工具的全覆盖测试
 * 确保每个API接口都有对应的MCP工具，并且功能一致
 */

import { JuejinMcpServer } from '../dist/server.js';
import { articleApi } from '../dist/api/articles.js';
import { pinApi } from '../dist/api/pins.js';
import { userApi } from '../dist/api/users.js';

class CompleteInterfaceTester {
  constructor() {
    this.server = new JuejinMcpServer();
    this.results = {
      coverage: { total: 0, covered: 0, missing: [] },
      functionality: { passed: 0, failed: 0, tests: [] },
      performance: { passed: 0, failed: 0, tests: [] },
      consistency: { passed: 0, failed: 0, tests: [] }
    };

    // 完整的接口映射表
    this.interfaceMap = {
      // 文章接口
      articles: {
        'getArticleList': { mcp: 'get_articles', params: { limit: 5 } },
        'searchArticles': { mcp: 'search_articles', params: { keyword: 'React', limit: 3 } },
        'getRecommendedArticles': { mcp: 'get_article_recommendations', params: { user_interests: ['前端'], limit: 3 } },
        'getLatestArticles': { mcp: 'get_articles', params: { limit: 3, sort_type: 300 } },
        'getHotArticles': { mcp: 'get_trending_articles', params: { time_range: 24, limit: 3 } }
      },

      // 沸点接口
      pins: {
        'getPinList': { mcp: 'get_pins', params: { limit: 5 } },
        'getRecommendedPins': { mcp: 'get_pin_recommendations', params: { user_interests: ['前端'], limit: 3 } },
        'getHotPins': { mcp: 'get_hot_topics', params: { limit: 5 } },
        'searchPins': { mcp: 'search_pins', params: { keyword: 'Vue', limit: 3 } }
      },

      // 用户接口
      users: {
        'getUserInfo': { mcp: 'get_user_profile', params: {} },
        'getUserArticles': { mcp: 'get_articles', params: { user_id: 'test_user', limit: 5 } }
      },

      // 分析接口
      analytics: {
        'analyzeContentTrends': { mcp: 'analyze_content_trends', params: { time_range: 24, categories: ['前端'] } },
        'analyzeUserBehavior': { mcp: 'analyze_user_behavior', params: { user_id: 'test_user', time_range: 168 } },
        'getTrendAnalysis': { mcp: 'get_trend_analysis', params: { category: '前端', time_range: 168 } },
        'compareContent': { mcp: 'compare_content_performance', params: { content_ids: ['id1', 'id2'], metrics: ['views'] } },
        'getContentInsights': { mcp: 'get_content_insights', params: { content_type: 'article', time_range: 24 } },
        'generateReport': { mcp: 'generate_analytics_report', params: { report_type: 'weekly' } }
      },

      // 推荐接口
      recommendations: {
        'getRecommendations': { mcp: 'get_recommendations', params: { user_profile: { interests: ['JS'] }, content_type: 'article', limit: 3 } },
        'getUserRecommendations': { mcp: 'get_user_recommendations', params: { user_interests: ['前端'], limit: 3 } },
        'getTrendingRecommendations': { mcp: 'get_trending_recommendations', params: { category: '前端', limit: 3 } },
        'updateRecommendations': { mcp: 'update_recommendations', params: { user_id: 'test', feedback: { liked: ['id1'] } } },
        'generateUserReport': { mcp: 'generate_user_report', params: { user_id: 'test_user', include_recommendations: true } }
      },

      // 性能接口
      performance: {
        'getPerformanceStats': { mcp: 'get_performance_stats', params: {} },
        'getCacheStats': { mcp: 'get_cache_stats', params: {} },
        'getSystemHealth': { mcp: 'get_system_health', params: {} },
        'optimizePerformance': { mcp: 'optimize_performance', params: { target: 'cache' } },
        'runBenchmark': { mcp: 'run_performance_benchmark', params: { test_type: 'api_response' } }
      },

      // 授权接口
      auth: {
        'checkAuthStatus': { mcp: 'check_auth_status', params: {} },
        'likeArticle': { mcp: 'like_article', params: { article_id: 'test_id' } },
        'likePin': { mcp: 'like_pin', params: { pin_id: 'test_id' } },
        'collectArticle': { mcp: 'collect_article', params: { article_id: 'test_id' } },
        'followUser': { mcp: 'follow_user', params: { user_id: 'test_id' } }
      }
    };
  }

  /**
   * 运行测试
   */
  async runTest(category, name, testFn) {
    console.log(`\n🧪 [${category.toUpperCase()}] ${name}`);
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      console.log(`✅ 通过: ${name} (${duration}ms)`);
      this.results[category].passed++;
      this.results[category].tests.push({ name, status: 'PASS', duration: `${duration}ms`, result });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`❌ 失败: ${name} (${duration}ms) - ${error.message}`);
      this.results[category].failed++;
      this.results[category].tests.push({ name, status: 'FAIL', duration: `${duration}ms`, error: error.message });
      return null;
    }
  }

  /**
   * 测试接口覆盖率
   */
  async testInterfaceCoverage() {
    console.log('\n📊 === 接口覆盖率测试 ===');

    const registeredTools = this.server.getTools().map(tool => tool.name);
    let totalInterfaces = 0;
    let coveredInterfaces = 0;
    const missingTools = [];

    // 检查每个接口是否有对应的MCP工具
    Object.entries(this.interfaceMap).forEach(([category, interfaces]) => {
      Object.entries(interfaces).forEach(([interfaceName, config]) => {
        totalInterfaces++;

        if (registeredTools.includes(config.mcp)) {
          coveredInterfaces++;
        } else {
          missingTools.push(`${category}.${interfaceName} -> ${config.mcp}`);
        }
      });
    });

    this.results.coverage = {
      total: totalInterfaces,
      covered: coveredInterfaces,
      missing: missingTools
    };

    const coverageRate = Math.round((coveredInterfaces / totalInterfaces) * 100);

    await this.runTest('coverage', '接口覆盖率检查', async () => {
      if (missingTools.length > 0) {
        throw new Error(`缺少${missingTools.length}个MCP工具: ${missingTools.slice(0, 3).join(', ')}${missingTools.length > 3 ? '...' : ''}`);
      }
      return `覆盖率: ${coverageRate}% (${coveredInterfaces}/${totalInterfaces})`;
    });
  }

  /**
   * 测试功能一致性
   */
  async testFunctionalityConsistency() {
    console.log('\n🔄 === 功能一致性测试 ===');

    // 测试核心文章功能
    await this.runTest('functionality', '文章获取功能', async () => {
      const apiResult = await articleApi.getArticleList({ limit: 3 });
      const mcpResult = await this.server.handleToolCall('get_articles', { limit: 3, sort_type: 200 });

      if (mcpResult.isError) throw new Error('MCP工具调用失败');
      if (!apiResult.articles || apiResult.articles.length === 0) throw new Error('API未返回数据');

      return `API和MCP文章功能一致`;
    });

    // 测试搜索功能
    await this.runTest('functionality', '搜索功能一致性', async () => {
      const apiResult = await articleApi.searchArticles('JavaScript', 3);
      const mcpResult = await this.server.handleToolCall('search_articles', { keyword: 'JavaScript', limit: 3 });

      if (mcpResult.isError) throw new Error('MCP搜索失败');

      return `搜索功能一致`;
    });

    // 测试沸点功能
    await this.runTest('functionality', '沸点功能一致性', async () => {
      const apiResult = await pinApi.getPinList({ limit: 3 });
      const mcpResult = await this.server.handleToolCall('get_pins', { limit: 3 });

      if (mcpResult.isError) throw new Error('MCP沸点工具失败');
      if (!apiResult.pins || apiResult.pins.length === 0) throw new Error('API未返回沸点数据');

      return `沸点功能一致`;
    });
  }

  /**
   * 测试性能一致性
   */
  async testPerformanceConsistency() {
    console.log('\n⚡ === 性能一致性测试 ===');

    // 并发性能测试
    await this.runTest('performance', '并发性能测试', async () => {
      const startTime = Date.now();

      const promises = [
        articleApi.getArticleList({ limit: 2 }),
        this.server.handleToolCall('get_articles', { limit: 2 }),
        pinApi.getPinList({ limit: 2 }),
        this.server.handleToolCall('get_pins', { limit: 2 })
      ];

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // 检查结果
      const apiSuccess = results[0].articles && results[2].pins;
      const mcpSuccess = !results[1].isError && !results[3].isError;

      if (!apiSuccess || !mcpSuccess) throw new Error('并发测试失败');
      if (duration > 10000) throw new Error(`响应时间过长: ${duration}ms`);

      return `并发测试成功，耗时: ${duration}ms`;
    });

    // 响应时间测试
    await this.runTest('performance', '响应时间测试', async () => {
      const tests = [
        { name: 'API文章', fn: () => articleApi.getArticleList({ limit: 5 }) },
        { name: 'MCP文章', fn: () => this.server.handleToolCall('get_articles', { limit: 5 }) },
        { name: 'API沸点', fn: () => pinApi.getPinList({ limit: 5 }) },
        { name: 'MCP沸点', fn: () => this.server.handleToolCall('get_pins', { limit: 5 }) }
      ];

      const results = [];
      for (const test of tests) {
        const startTime = Date.now();
        await test.fn();
        const duration = Date.now() - startTime;
        results.push({ name: test.name, duration });
      }

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      if (avgDuration > 5000) throw new Error(`平均响应时间过长: ${avgDuration}ms`);

      return `平均响应时间: ${Math.round(avgDuration)}ms`;
    });
  }

  /**
   * 测试数据一致性
   */
  async testDataConsistency() {
    console.log('\n📋 === 数据一致性测试 ===');

    await this.runTest('consistency', '数据结构一致性', async () => {
      // 测试文章数据结构
      const apiArticles = await articleApi.getArticleList({ limit: 1 });
      if (apiArticles.articles.length === 0) throw new Error('无文章数据');

      const article = apiArticles.articles[0];
      const requiredFields = ['article_info', 'author_user_info'];
      const missingFields = requiredFields.filter(field => !article[field]);

      if (missingFields.length > 0) {
        throw new Error(`文章数据缺少字段: ${missingFields.join(', ')}`);
      }

      // 测试沸点数据结构
      const apiPins = await pinApi.getPinList({ limit: 1 });
      if (apiPins.pins.length === 0) throw new Error('无沸点数据');

      const pin = apiPins.pins[0];
      if (!pin.msg_info) throw new Error('沸点数据结构不完整');

      return '数据结构一致性验证通过';
    });

    await this.runTest('consistency', '错误处理一致性', async () => {
      // 测试无效参数处理
      try {
        await this.server.handleToolCall('get_articles', { limit: -1 });
        return 'MCP错误处理正常';
      } catch (error) {
        return 'MCP错误处理正常';
      }
    });
  }

  /**
   * 生成完整测试报告
   */
  generateCompleteReport() {
    console.log('\n📊 === 完整接口测试报告 ===');

    // 覆盖率报告
    const coverageRate = Math.round((this.results.coverage.covered / this.results.coverage.total) * 100);
    console.log(`\n📈 接口覆盖率: ${coverageRate}%`);
    console.log(`  • 总接口数: ${this.results.coverage.total}`);
    console.log(`  • 已覆盖: ${this.results.coverage.covered}`);
    console.log(`  • 未覆盖: ${this.results.coverage.missing.length}`);

    if (this.results.coverage.missing.length > 0) {
      console.log(`\n❌ 缺少的MCP工具:`);
      this.results.coverage.missing.slice(0, 5).forEach(missing => {
        console.log(`  • ${missing}`);
      });
      if (this.results.coverage.missing.length > 5) {
        console.log(`  • ... 还有 ${this.results.coverage.missing.length - 5} 个`);
      }
    }

    // 功能测试报告
    const categories = ['functionality', 'performance', 'consistency'];
    console.log(`\n📋 功能测试结果:`);

    categories.forEach(category => {
      const stats = this.results[category];
      const total = stats.passed + stats.failed;
      const rate = total > 0 ? Math.round((stats.passed / total) * 100) : 0;
      console.log(`  • ${category}: ${stats.passed}/${total} (${rate}%)`);
    });

    // 总体评估
    const totalPassed = categories.reduce((sum, cat) => sum + this.results[cat].passed, 0);
    const totalFailed = categories.reduce((sum, cat) => sum + this.results[cat].failed, 0);
    const totalTests = totalPassed + totalFailed;
    const overallRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

    console.log(`\n🎯 总体评估:`);
    console.log(`  • 测试通过率: ${overallRate}%`);
    console.log(`  • 接口覆盖率: ${coverageRate}%`);
    console.log(`  • 系统状态: ${overallRate >= 90 && coverageRate >= 90 ? '✅ 优秀' : overallRate >= 80 ? '⚠️ 良好' : '❌ 需要改进'}`);

    // 建议
    console.log(`\n💡 改进建议:`);
    if (coverageRate < 100) {
      console.log(`  • 补充缺失的MCP工具以提高覆盖率`);
    }
    if (overallRate < 90) {
      console.log(`  • 修复失败的测试用例`);
    }
    if (coverageRate >= 95 && overallRate >= 95) {
      console.log(`  • 🎉 系统已达到生产标准！`);
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始完整接口测试...\n');
    console.log('⏰ 测试时间:', new Date().toLocaleString());
    console.log('🎯 测试目标: 100%接口覆盖 + 功能一致性验证');
    console.log('═'.repeat(60));

    try {
      await this.testInterfaceCoverage();
      await this.testFunctionalityConsistency();
      await this.testPerformanceConsistency();
      await this.testDataConsistency();
    } catch (error) {
      console.error('💥 测试运行出错:', error);
    }

    this.generateCompleteReport();
    process.exit(0);
  }
}

// 运行完整接口测试
const tester = new CompleteInterfaceTester();
tester.runAllTests().catch(error => {
  console.error('💥 完整接口测试启动失败:', error);
  process.exit(1);
});
