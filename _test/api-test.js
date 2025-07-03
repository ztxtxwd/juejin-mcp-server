#!/usr/bin/env node

/**
 * 掘金MCP服务器 - 接口测试工具
 * 全面测试所有API接口和MCP工具功能
 */

import { articleApi } from '../dist/api/articles.js';
import { pinApi } from '../dist/api/pins.js';
import { JuejinMcpServer } from '../dist/server.js';

class APITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * 运行测试用例
   */
  async runTest(name, testFn) {
    console.log(`\n🧪 测试: ${name}`);
    try {
      const result = await testFn();
      console.log(`✅ 通过: ${name}`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS', result });
      return result;
    } catch (error) {
      console.error(`❌ 失败: ${name}`);
      console.error(`   错误: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      return null;
    }
  }

  /**
   * 测试文章API
   */
  async testArticleAPI() {
    console.log('\n📄 === 文章API测试 ===');

    // 测试获取文章列表
    await this.runTest('获取文章列表', async () => {
      const result = await articleApi.getArticleList({ limit: 5 });
      if (!result.articles || result.articles.length === 0) {
        throw new Error('未获取到文章数据');
      }
      return { count: result.articles.length, hasMore: result.has_more };
    });

    // 测试推荐文章
    await this.runTest('获取推荐文章', async () => {
      const result = await articleApi.getRecommendedArticles(3);
      return { count: result.articles.length };
    });

    // 测试最新文章
    await this.runTest('获取最新文章', async () => {
      const result = await articleApi.getLatestArticles(3);
      return { count: result.articles.length };
    });

    // 测试热门文章
    await this.runTest('获取热门文章', async () => {
      const result = await articleApi.getHotArticles(7, 3);
      return { count: result.articles.length };
    });

    // 测试搜索文章
    await this.runTest('搜索文章', async () => {
      const result = await articleApi.searchArticles('React', 3);
      return { count: result.articles.length, keyword: 'React' };
    });
  }

  /**
   * 测试沸点API
   */
  async testPinAPI() {
    console.log('\n💬 === 沸点API测试 ===');

    // 测试获取沸点列表
    await this.runTest('获取沸点列表', async () => {
      const result = await pinApi.getPinList({ limit: 5 });
      if (!result.pins || result.pins.length === 0) {
        throw new Error('未获取到沸点数据');
      }
      return { count: result.pins.length };
    });

    // 测试推荐沸点
    await this.runTest('获取推荐沸点', async () => {
      const result = await pinApi.getRecommendedPins(3);
      return { count: result.pins.length };
    });

    // 测试热门沸点
    await this.runTest('获取热门沸点', async () => {
      const result = await pinApi.getHotPins(3);
      return { count: result.pins.length };
    });
  }

  /**
   * 测试MCP工具
   */
  async testMCPTools() {
    console.log('\n🛠️ === MCP工具测试 ===');

    const server = new JuejinMcpServer();

    // 测试获取工具列表
    await this.runTest('获取工具列表', async () => {
      const tools = server.getTools();
      if (!tools || tools.length === 0) {
        throw new Error('未获取到工具列表');
      }
      return { count: tools.length };
    });

    // 测试服务器信息
    await this.runTest('获取服务器信息', async () => {
      const info = server.getServerInfo();
      if (!info.name || !info.version) {
        throw new Error('服务器信息不完整');
      }
      return info;
    });

    // 模拟工具调用测试
    await this.runTest('模拟工具调用 - 获取文章', async () => {
      // 这里模拟MCP工具调用
      const mockArgs = { limit: 3, sort_type: 200 };
      const result = await articleApi.getArticleList(mockArgs);
      return {
        toolName: 'get_articles',
        args: mockArgs,
        resultCount: result.articles.length
      };
    });
  }

  /**
   * 测试数据结构完整性
   */
  async testDataStructure() {
    console.log('\n🔍 === 数据结构测试 ===');

    // 测试文章数据结构
    await this.runTest('文章数据结构完整性', async () => {
      const result = await articleApi.getArticleList({ limit: 1 });
      if (result.articles.length === 0) {
        throw new Error('无文章数据');
      }

      const article = result.articles[0];
      const requiredFields = ['article_info', 'author_user_info'];
      const missingFields = requiredFields.filter(field => !article[field]);

      if (missingFields.length > 0) {
        throw new Error(`缺少必需字段: ${missingFields.join(', ')}`);
      }

      return {
        hasArticleInfo: !!article.article_info,
        hasAuthorInfo: !!article.author_user_info,
        hasTitle: !!article.article_info?.title,
        hasStats: !!(article.article_info?.view_count !== undefined)
      };
    });

    // 测试沸点数据结构
    await this.runTest('沸点数据结构完整性', async () => {
      const result = await pinApi.getPinList({ limit: 1 });
      if (result.pins.length === 0) {
        throw new Error('无沸点数据');
      }

      const pin = result.pins[0];
      return {
        hasPinInfo: !!pin.msg_info,
        hasAuthorInfo: !!pin.author_user_info,
        hasContent: !!pin.msg_info?.content
      };
    });
  }

  /**
   * 性能测试
   */
  async testPerformance() {
    console.log('\n⚡ === 性能测试 ===');

    // 测试并发请求
    await this.runTest('并发请求测试', async () => {
      const startTime = Date.now();
      const promises = [
        articleApi.getArticleList({ limit: 5 }),
        pinApi.getPinList({ limit: 5 }),
        articleApi.getRecommendedArticles(5)
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
        duration: `${duration}ms`,
        requestCount: promises.length,
        avgTime: `${Math.round(duration / promises.length)}ms`,
        allSuccessful: results.every(r => r && (r.articles?.length > 0 || r.pins?.length > 0))
      };
    });

    // 测试响应时间
    await this.runTest('响应时间测试', async () => {
      const startTime = Date.now();
      await articleApi.getArticleList({ limit: 10 });
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration > 5000) {
        throw new Error(`响应时间过长: ${duration}ms`);
      }

      return { duration: `${duration}ms`, threshold: '5000ms' };
    });
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📊 === 测试报告 ===');
    console.log(`✅ 通过: ${this.results.passed}`);
    console.log(`❌ 失败: ${this.results.failed}`);
    console.log(`📈 成功率: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    console.log('\n🎯 测试建议:');
    if (this.results.failed === 0) {
      console.log('   🎉 所有测试通过！系统运行正常。');
    } else {
      console.log('   🔧 请检查失败的测试项目并修复相关问题。');
      console.log('   🌐 确保网络连接正常，掘金API可访问。');
      console.log('   📝 检查数据结构是否与API文档一致。');
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始掘金MCP服务器接口测试...\n');
    console.log('⏰ 测试时间:', new Date().toLocaleString());

    try {
      await this.testArticleAPI();
      await this.testPinAPI();
      await this.testMCPTools();
      await this.testDataStructure();
      await this.testPerformance();
    } catch (error) {
      console.error('💥 测试运行出错:', error);
    }

    this.generateReport();
    process.exit(0);
  }
}

// 运行测试
const tester = new APITester();
tester.runAllTests().catch(error => {
  console.error('💥 测试启动失败:', error);
  process.exit(1);
});
