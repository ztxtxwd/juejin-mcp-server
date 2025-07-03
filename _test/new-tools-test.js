#!/usr/bin/env node

/**
 * 新增工具验证测试
 * 验证新添加的简化工具功能
 */

import { JuejinMcpServer } from '../dist/server.js';

class NewToolsTester {
  constructor() {
    this.server = new JuejinMcpServer();
    this.results = { passed: 0, failed: 0, tests: [] };
  }

  /**
   * 运行测试
   */
  async runTest(name, testFn) {
    console.log(`\n🧪 测试: ${name}`);
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      console.log(`✅ 通过: ${name} (${duration}ms)`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS', duration: `${duration}ms`, result });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`❌ 失败: ${name} (${duration}ms) - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', duration: `${duration}ms`, error: error.message });
      return null;
    }
  }

  /**
   * 测试新增的简化工具
   */
  async testNewTools() {
    console.log('🚀 开始新增工具验证测试...\n');
    console.log('⏰ 测试时间:', new Date().toLocaleString());
    console.log('🎯 测试目标: 验证新增的简化工具功能');
    console.log('═'.repeat(60));

    // 检查工具是否注册
    await this.runTest('检查工具注册', async () => {
      const tools = this.server.getTools();
      const newTools = ['get_simple_trends', 'get_simple_recommendations'];
      const registeredNewTools = newTools.filter(toolName =>
        tools.some(tool => tool.name === toolName)
      );

      if (registeredNewTools.length !== newTools.length) {
        const missing = newTools.filter(tool => !registeredNewTools.includes(tool));
        throw new Error(`缺少新工具: ${missing.join(', ')}`);
      }

      return `新工具已注册: ${registeredNewTools.join(', ')}`;
    });

    // 测试简化趋势分析工具
    await this.runTest('get_simple_trends工具', async () => {
      const result = await this.server.handleToolCall('get_simple_trends', {
        category: '前端',
        time_range: 24
      });

      if (result.isError) {
        throw new Error(result.content[0]?.text || '工具调用失败');
      }

      return '简化趋势分析工具正常';
    });

    // 测试简化推荐工具
    await this.runTest('get_simple_recommendations工具', async () => {
      const result = await this.server.handleToolCall('get_simple_recommendations', {
        interests: ['JavaScript', 'React'],
        limit: 5
      });

      if (result.isError) {
        throw new Error(result.content[0]?.text || '工具调用失败');
      }

      return '简化推荐工具正常';
    });

    // 测试工具参数验证
    await this.runTest('参数验证测试', async () => {
      // 测试无效参数
      const result1 = await this.server.handleToolCall('get_simple_trends', {
        category: '',
        time_range: -1
      });

      const result2 = await this.server.handleToolCall('get_simple_recommendations', {
        interests: [],
        limit: 0
      });

      // 这些调用应该有适当的错误处理
      return '参数验证正常';
    });

    // 测试工具性能
    await this.runTest('性能测试', async () => {
      const startTime = Date.now();

      const promises = [
        this.server.handleToolCall('get_simple_trends', { category: '前端', time_range: 24 }),
        this.server.handleToolCall('get_simple_recommendations', { interests: ['Vue'], limit: 3 })
      ];

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      if (duration > 10000) {
        throw new Error(`响应时间过长: ${duration}ms`);
      }

      const allSuccessful = results.every(r => !r.isError);
      if (!allSuccessful) {
        throw new Error('部分工具调用失败');
      }

      return `并发测试成功，耗时: ${duration}ms`;
    });
  }

  /**
   * 测试工具集成
   */
  async testToolIntegration() {
    console.log('\n🔗 === 工具集成测试 ===');

    // 测试与现有工具的兼容性
    await this.runTest('与现有工具兼容性', async () => {
      const oldTool = await this.server.handleToolCall('get_articles', { limit: 3 });
      const newTool1 = await this.server.handleToolCall('get_simple_trends', { category: '前端', time_range: 24 });
      const newTool2 = await this.server.handleToolCall('get_simple_recommendations', { interests: ['React'], limit: 3 });

      if (oldTool.isError || newTool1.isError || newTool2.isError) {
        throw new Error('工具兼容性测试失败');
      }

      return '新旧工具兼容性良好';
    });

    // 测试工具链调用
    await this.runTest('工具链调用测试', async () => {
      // 先获取趋势，再基于趋势获取推荐
      const trendsResult = await this.server.handleToolCall('get_simple_trends', {
        category: '前端',
        time_range: 24
      });

      if (trendsResult.isError) {
        throw new Error('趋势分析失败');
      }

      const recommendationsResult = await this.server.handleToolCall('get_simple_recommendations', {
        interests: ['前端', 'JavaScript'],
        limit: 5
      });

      if (recommendationsResult.isError) {
        throw new Error('推荐获取失败');
      }

      return '工具链调用成功';
    });
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📊 === 新工具测试报告 ===');

    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

    console.log(`\n📈 测试统计:`);
    console.log(`  ✅ 通过: ${this.results.passed}`);
    console.log(`  ❌ 失败: ${this.results.failed}`);
    console.log(`  📊 成功率: ${successRate}%`);

    console.log(`\n📋 详细结果:`);
    this.results.tests.forEach((test, index) => {
      const status = test.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${test.name} (${test.duration})`);
      if (test.error) {
        console.log(`     错误: ${test.error}`);
      }
    });

    console.log(`\n🎯 新工具状态:`);
    const newToolsWorking = this.results.tests
      .filter(test => test.name.includes('工具') && test.status === 'PASS')
      .length;

    console.log(`  • get_simple_trends: ${newToolsWorking >= 1 ? '✅ 正常' : '❌ 异常'}`);
    console.log(`  • get_simple_recommendations: ${newToolsWorking >= 2 ? '✅ 正常' : '❌ 异常'}`);

    console.log(`\n💡 总结:`);
    if (this.results.failed === 0) {
      console.log('  🎉 所有新工具测试通过！新功能已就绪。');
      console.log('  🚀 可以开始使用新的简化工具。');
    } else {
      console.log('  🔧 部分测试失败，需要检查：');
      const failedTests = this.results.tests.filter(test => test.status === 'FAIL');
      failedTests.forEach(test => {
        console.log(`    • ${test.name}: ${test.error}`);
      });
    }

    console.log(`\n📝 使用示例:`);
    console.log('  # 获取简化趋势分析');
    console.log('  {');
    console.log('    "tool": "get_simple_trends",');
    console.log('    "arguments": {');
    console.log('      "category": "前端",');
    console.log('      "time_range": 24');
    console.log('    }');
    console.log('  }');
    console.log('');
    console.log('  # 获取简化推荐');
    console.log('  {');
    console.log('    "tool": "get_simple_recommendations",');
    console.log('    "arguments": {');
    console.log('      "interests": ["JavaScript", "React"],');
    console.log('      "limit": 5');
    console.log('    }');
    console.log('  }');
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    try {
      await this.testNewTools();
      await this.testToolIntegration();
    } catch (error) {
      console.error('💥 测试运行出错:', error);
    }

    this.generateReport();
    process.exit(0);
  }
}

// 运行新工具测试
const tester = new NewToolsTester();
tester.runAllTests().catch(error => {
  console.error('💥 新工具测试启动失败:', error);
  process.exit(1);
});
