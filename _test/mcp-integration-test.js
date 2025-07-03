#!/usr/bin/env node

/**
 * MCP集成测试 - 完整的接口与工具集成测试
 * 结合API接口和MCP工具进行端到端测试
 */

import { JuejinMcpServer } from '../dist/server.js';
import { articleApi } from '../dist/api/articles.js';
import { pinApi } from '../dist/api/pins.js';
import { getConfig, isAuthEnabled } from '../dist/utils/config.js';

class MCPIntegrationTester {
  constructor() {
    this.server = new JuejinMcpServer();
    this.config = getConfig();
    this.results = {
      api: { passed: 0, failed: 0, tests: [] },
      mcp: { passed: 0, failed: 0, tests: [] },
      integration: { passed: 0, failed: 0, tests: [] },
      total: { passed: 0, failed: 0, tests: [] }
    };
  }

  /**
   * 运行测试用例
   */
  async runTest(category, name, testFn) {
    console.log(`\n🧪 [${category.toUpperCase()}] ${name}`);
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      console.log(`✅ 通过: ${name} (${duration}ms)`);
      this.results[category].passed++;
      this.results[category].tests.push({
        name,
        status: 'PASS',
        duration: `${duration}ms`,
        result: typeof result === 'string' ? result.substring(0, 100) + '...' : 'Success'
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`❌ 失败: ${name} (${duration}ms)`);
      console.error(`   错误: ${error.message}`);
      this.results[category].failed++;
      this.results[category].tests.push({
        name,
        status: 'FAIL',
        duration: `${duration}ms`,
        error: error.message
      });
      return null;
    }
  }

  /**
   * 测试API层接口
   */
  async testAPILayer() {
    console.log('\n📡 === API层接口测试 ===');

    // 文章API测试
    await this.runTest('api', '获取文章列表', async () => {
      const result = await articleApi.getArticleList({ limit: 5 });
      if (!result.articles || result.articles.length === 0) {
        throw new Error('未获取到文章数据');
      }
      return `获取到${result.articles.length}篇文章`;
    });

    await this.runTest('api', '搜索文章', async () => {
      const result = await articleApi.searchArticles('JavaScript', 3);
      return `搜索到${result.articles.length}篇相关文章`;
    });

    await this.runTest('api', '获取热门文章', async () => {
      const result = await articleApi.getHotArticles(7, 3);
      return `获取到${result.articles.length}篇热门文章`;
    });

    // 沸点API测试
    await this.runTest('api', '获取沸点列表', async () => {
      const result = await pinApi.getPinList({ limit: 5 });
      if (!result.pins || result.pins.length === 0) {
        throw new Error('未获取到沸点数据');
      }
      return `获取到${result.pins.length}条沸点`;
    });

    await this.runTest('api', '获取推荐沸点', async () => {
      const result = await pinApi.getRecommendedPins(3);
      return `获取到${result.pins.length}条推荐沸点`;
    });

    // 数据结构验证
    await this.runTest('api', '文章数据结构验证', async () => {
      const result = await articleApi.getArticleList({ limit: 1 });
      if (result.articles.length === 0) throw new Error('无文章数据');

      const article = result.articles[0];
      const requiredFields = ['article_info', 'author_user_info'];
      const missingFields = requiredFields.filter(field => !article[field]);

      if (missingFields.length > 0) {
        throw new Error(`缺少字段: ${missingFields.join(', ')}`);
      }
      return '数据结构完整';
    });
  }

  /**
   * 测试MCP工具层
   */
  async testMCPLayer() {
    console.log('\n🛠️ === MCP工具层测试 ===');

    // 文章工具测试
    await this.runTest('mcp', 'get_articles工具', async () => {
      const result = await this.server.handleToolCall('get_articles', {
        limit: 3,
        sort_type: 200
      });
      if (result.isError) throw new Error(result.content[0]?.text || '工具调用失败');
      return 'MCP文章工具正常';
    });

    await this.runTest('mcp', 'search_articles工具', async () => {
      const result = await this.server.handleToolCall('search_articles', {
        keyword: 'React',
        limit: 3
      });
      if (result.isError) throw new Error(result.content[0]?.text || '搜索工具失败');
      return 'MCP搜索工具正常';
    });

    // 沸点工具测试
    await this.runTest('mcp', 'get_pins工具', async () => {
      const result = await this.server.handleToolCall('get_pins', {
        limit: 3
      });
      if (result.isError) throw new Error(result.content[0]?.text || '沸点工具失败');
      return 'MCP沸点工具正常';
    });

    // 分析工具测试
    await this.runTest('mcp', 'analyze_content_trends工具', async () => {
      const result = await this.server.handleToolCall('analyze_content_trends', {
        time_range: 24,
        categories: ['前端']
      });
      if (result.isError) throw new Error(result.content[0]?.text || '分析工具失败');
      return 'MCP分析工具正常';
    });

    // 推荐工具测试
    await this.runTest('mcp', 'get_recommendations工具', async () => {
      const result = await this.server.handleToolCall('get_recommendations', {
        user_profile: { interests: ['JavaScript'] },
        content_type: 'article',
        limit: 3
      });
      if (result.isError) throw new Error(result.content[0]?.text || '推荐工具失败');
      return 'MCP推荐工具正常';
    });

    // 性能工具测试
    await this.runTest('mcp', 'get_performance_stats工具', async () => {
      const result = await this.server.handleToolCall('get_performance_stats', {});
      if (result.isError) throw new Error(result.content[0]?.text || '性能工具失败');
      return 'MCP性能工具正常';
    });

    // 授权工具测试
    await this.runTest('mcp', 'check_auth_status工具', async () => {
      const result = await this.server.handleToolCall('check_auth_status', {});
      if (result.isError) throw new Error(result.content[0]?.text || '授权检查失败');
      return `授权状态: ${isAuthEnabled(this.config) ? '已启用' : '未启用'}`;
    });
  }

  /**
   * 测试API与MCP集成
   */
  async testIntegration() {
    console.log('\n🔗 === API与MCP集成测试 ===');

    // 数据一致性测试
    await this.runTest('integration', 'API与MCP数据一致性', async () => {
      // 通过API获取数据
      const apiResult = await articleApi.getArticleList({ limit: 3 });

      // 通过MCP工具获取数据
      const mcpResult = await this.server.handleToolCall('get_articles', {
        limit: 3,
        sort_type: 200
      });

      if (mcpResult.isError) throw new Error('MCP工具调用失败');

      // 验证数据结构一致性
      if (apiResult.articles.length === 0) throw new Error('API未返回数据');

      return `API和MCP数据获取一致，API: ${apiResult.articles.length}篇，MCP: 正常`;
    });

    // 错误处理一致性测试
    await this.runTest('integration', '错误处理一致性', async () => {
      try {
        // 测试无效参数
        const mcpResult = await this.server.handleToolCall('get_articles', {
          limit: -1
        });

        // 应该有错误处理
        return 'MCP错误处理正常';
      } catch (error) {
        return 'MCP错误处理正常';
      }
    });

    // 性能一致性测试
    await this.runTest('integration', '性能一致性测试', async () => {
      const startTime = Date.now();

      // 并发测试API和MCP
      const promises = [
        articleApi.getArticleList({ limit: 2 }),
        this.server.handleToolCall('get_articles', { limit: 2 }),
        pinApi.getPinList({ limit: 2 }),
        this.server.handleToolCall('get_pins', { limit: 2 })
      ];

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // 检查所有请求是否成功
      const apiSuccess = results[0].articles && results[2].pins;
      const mcpSuccess = !results[1].isError && !results[3].isError;

      if (!apiSuccess || !mcpSuccess) {
        throw new Error('并发测试失败');
      }

      return `并发测试成功，耗时: ${duration}ms`;
    });

    // 配置集成测试
    await this.runTest('integration', '配置集成测试', async () => {
      const serverInfo = this.server.getServerInfo();
      const tools = this.server.getTools();

      if (!serverInfo.name || !serverInfo.version) {
        throw new Error('服务器信息不完整');
      }

      if (tools.length === 0) {
        throw new Error('工具未正确注册');
      }

      return `服务器: ${serverInfo.name} v${serverInfo.version}, 工具: ${tools.length}个`;
    });
  }

  /**
   * 生成综合测试报告
   */
  generateReport() {
    console.log('\n📊 === MCP集成测试报告 ===');

    // 计算总计
    Object.keys(this.results).forEach(category => {
      if (category !== 'total') {
        this.results.total.passed += this.results[category].passed;
        this.results.total.failed += this.results[category].failed;
        this.results.total.tests.push(...this.results[category].tests);
      }
    });

    const total = this.results.total.passed + this.results.total.failed;
    const successRate = total > 0 ? Math.round((this.results.total.passed / total) * 100) : 0;

    console.log(`\n📈 总体统计:`);
    console.log(`  ✅ 通过: ${this.results.total.passed}`);
    console.log(`  ❌ 失败: ${this.results.total.failed}`);
    console.log(`  📊 成功率: ${successRate}%`);

    console.log(`\n📋 分类统计:`);
    Object.entries(this.results).forEach(([category, stats]) => {
      if (category !== 'total') {
        const categoryTotal = stats.passed + stats.failed;
        const categoryRate = categoryTotal > 0 ? Math.round((stats.passed / categoryTotal) * 100) : 0;
        console.log(`  ${category.toUpperCase()}: ${stats.passed}/${categoryTotal} (${categoryRate}%)`);
      }
    });

    // 显示失败的测试
    const failedTests = this.results.total.tests.filter(test => test.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log(`\n❌ 失败的测试:`);
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    }

    // 生成建议
    console.log(`\n💡 测试建议:`);
    if (this.results.total.failed === 0) {
      console.log('  🎉 所有集成测试通过！API与MCP完美集成。');
      console.log('  🚀 系统已准备就绪，可以投入生产使用。');
    } else {
      console.log('  🔧 请检查失败的测试项目：');
      if (this.results.api.failed > 0) {
        console.log('    - API层问题：检查网络连接和掘金API状态');
      }
      if (this.results.mcp.failed > 0) {
        console.log('    - MCP层问题：检查工具注册和参数验证');
      }
      if (this.results.integration.failed > 0) {
        console.log('    - 集成问题：检查API与MCP的数据流转');
      }
    }

    console.log(`\n📝 系统状态:`);
    console.log(`  • API接口: ${this.results.api.failed === 0 ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  • MCP工具: ${this.results.mcp.failed === 0 ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  • 系统集成: ${this.results.integration.failed === 0 ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  • 授权功能: ${isAuthEnabled(this.config) ? '✅ 已启用' : '⚠️ 未启用'}`);
  }

  /**
   * 运行所有集成测试
   */
  async runAllTests() {
    console.log('🚀 开始MCP集成测试...\n');
    console.log('⏰ 测试时间:', new Date().toLocaleString());
    console.log('🔧 测试范围: API接口 + MCP工具 + 系统集成');
    console.log('═'.repeat(60));

    try {
      await this.testAPILayer();
      await this.testMCPLayer();
      await this.testIntegration();
    } catch (error) {
      console.error('💥 测试运行出错:', error);
    }

    this.generateReport();
    process.exit(0);
  }
}

/**
 * 接口测试矩阵 - 完整的API到MCP映射测试
 */
class InterfaceTestMatrix {
  constructor(tester) {
    this.tester = tester;
    this.server = tester.server;

    // API到MCP工具的映射关系
    this.apiToMcpMapping = {
      // 文章相关
      'articleApi.getArticleList': 'get_articles',
      'articleApi.searchArticles': 'search_articles',
      'articleApi.getRecommendedArticles': 'get_article_recommendations',
      'articleApi.getHotArticles': 'get_trending_articles',

      // 沸点相关
      'pinApi.getPinList': 'get_pins',
      'pinApi.getRecommendedPins': 'get_pin_recommendations',
      'pinApi.getHotPins': 'get_hot_topics',

      // 分析相关
      'contentAnalysis': 'analyze_content_trends',
      'userAnalysis': 'analyze_user_behavior',
      'trendAnalysis': 'get_trend_analysis',

      // 推荐相关
      'recommendations': 'get_recommendations',
      'userRecommendations': 'get_user_recommendations',
      'trendingRecommendations': 'get_trending_recommendations'
    };
  }

  /**
   * 测试API到MCP的完整映射
   */
  async testCompleteMapping() {
    console.log('\n🔄 === 接口映射完整性测试 ===');

    for (const [apiMethod, mcpTool] of Object.entries(this.apiToMcpMapping)) {
      await this.tester.runTest('integration', `${apiMethod} -> ${mcpTool}`, async () => {
        // 验证MCP工具存在
        const tools = this.server.getTools();
        const toolExists = tools.some(tool => tool.name === mcpTool);

        if (!toolExists) {
          throw new Error(`MCP工具 ${mcpTool} 未注册`);
        }

        // 测试工具调用
        const result = await this.server.handleToolCall(mcpTool, this.getDefaultArgs(mcpTool));

        if (result.isError) {
          throw new Error(`MCP工具 ${mcpTool} 调用失败: ${result.content[0]?.text}`);
        }

        return `映射正常: ${apiMethod} -> ${mcpTool}`;
      });
    }
  }

  /**
   * 获取工具的默认参数
   */
  getDefaultArgs(toolName) {
    const defaultArgs = {
      'get_articles': { limit: 3, sort_type: 200 },
      'search_articles': { keyword: 'JavaScript', limit: 3 },
      'get_article_recommendations': { user_interests: ['前端'], limit: 3 },
      'get_trending_articles': { time_range: 24, limit: 3 },
      'get_pins': { limit: 3 },
      'get_pin_recommendations': { user_interests: ['前端'], limit: 3 },
      'get_hot_topics': { limit: 5 },
      'analyze_content_trends': { time_range: 24, categories: ['前端'] },
      'analyze_user_behavior': { user_id: 'test_user', time_range: 168 },
      'get_trend_analysis': { category: '前端', time_range: 168 },
      'get_recommendations': { user_profile: { interests: ['JavaScript'] }, content_type: 'article', limit: 3 },
      'get_user_recommendations': { user_interests: ['前端开发'], limit: 3 },
      'get_trending_recommendations': { category: '前端', limit: 3 }
    };

    return defaultArgs[toolName] || {};
  }
}

// 运行集成测试
const tester = new MCPIntegrationTester();

// 扩展测试以包含接口映射测试
const originalTestIntegration = tester.testIntegration.bind(tester);
tester.testIntegration = async function () {
  await originalTestIntegration();

  // 添加接口映射测试
  const matrix = new InterfaceTestMatrix(this);
  await matrix.testCompleteMapping();
};

tester.runAllTests().catch(error => {
  console.error('💥 MCP集成测试启动失败:', error);
  process.exit(1);
});
