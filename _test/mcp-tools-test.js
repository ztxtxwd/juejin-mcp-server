#!/usr/bin/env node

/**
 * MCP工具功能测试
 * 测试所有31+个MCP工具的功能
 */

import { JuejinMcpServer } from '../dist/server.js';

class MCPToolsTester {
  constructor() {
    this.server = new JuejinMcpServer();
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
  }

  /**
   * 运行工具测试
   */
  async runToolTest(toolName, args = {}, description = '') {
    console.log(`\n🔧 测试工具: ${toolName} ${description}`);
    try {
      const result = await this.server.handleToolCall(toolName, args);

      if (result.isError) {
        throw new Error(result.content[0]?.text || '工具返回错误');
      }

      console.log(`✅ 通过: ${toolName}`);
      this.results.passed++;
      this.results.tests.push({
        tool: toolName,
        status: 'PASS',
        description,
        result: result.content[0]?.text?.substring(0, 100) + '...'
      });
      return result;
    } catch (error) {
      console.error(`❌ 失败: ${toolName} - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({
        tool: toolName,
        status: 'FAIL',
        description,
        error: error.message
      });
      return null;
    }
  }

  /**
   * 跳过测试（需要特殊条件的工具）
   */
  skipTest(toolName, reason) {
    console.log(`⏭️ 跳过: ${toolName} - ${reason}`);
    this.results.skipped++;
    this.results.tests.push({
      tool: toolName,
      status: 'SKIP',
      reason
    });
  }

  /**
   * 测试文章相关工具
   */
  async testArticleTools() {
    console.log('\n📄 === 文章工具测试 ===');

    await this.runToolTest('get_articles', {
      limit: 5,
      sort_type: 200
    }, '获取推荐文章');

    await this.runToolTest('search_articles', {
      keyword: 'JavaScript',
      limit: 3
    }, '搜索JavaScript文章');

    await this.runToolTest('get_article_recommendations', {
      user_interests: ['前端', 'React'],
      limit: 5
    }, '获取文章推荐');

    await this.runToolTest('analyze_article_quality', {
      article_id: 'test_article_id'
    }, '分析文章质量');

    await this.runToolTest('get_trending_articles', {
      time_range: 24,
      limit: 5
    }, '获取趋势文章');
  }

  /**
   * 测试沸点相关工具
   */
  async testPinTools() {
    console.log('\n💬 === 沸点工具测试 ===');

    await this.runToolTest('get_pins', {
      limit: 5,
      sort_type: 200
    }, '获取推荐沸点');

    await this.runToolTest('search_pins', {
      keyword: 'Vue',
      limit: 3
    }, '搜索Vue沸点');

    await this.runToolTest('get_pin_recommendations', {
      user_interests: ['前端'],
      limit: 5
    }, '获取沸点推荐');

    await this.runToolTest('analyze_pin_trends', {
      time_range: 24
    }, '分析沸点趋势');

    await this.runToolTest('get_hot_topics', {
      limit: 10
    }, '获取热门话题');
  }

  /**
   * 测试分析相关工具
   */
  async testAnalyticsTools() {
    console.log('\n📊 === 分析工具测试 ===');

    await this.runToolTest('analyze_content_trends', {
      time_range: 24,
      categories: ['前端']
    }, '分析内容趋势');

    await this.runToolTest('compare_content_performance', {
      content_ids: ['id1', 'id2'],
      metrics: ['views', 'likes']
    }, '比较内容表现');

    await this.runToolTest('get_trend_analysis', {
      category: '前端',
      time_range: 168
    }, '获取趋势分析');

    await this.runToolTest('analyze_user_behavior', {
      user_id: 'test_user',
      time_range: 168
    }, '分析用户行为');

    await this.runToolTest('get_content_insights', {
      content_type: 'article',
      time_range: 24
    }, '获取内容洞察');

    await this.runToolTest('generate_analytics_report', {
      report_type: 'weekly',
      include_predictions: true
    }, '生成分析报告');
  }

  /**
   * 测试推荐相关工具
   */
  async testRecommendationTools() {
    console.log('\n🎯 === 推荐工具测试 ===');

    await this.runToolTest('get_recommendations', {
      user_profile: { interests: ['JavaScript', 'React'] },
      content_type: 'article',
      limit: 5
    }, '获取个性化推荐');

    await this.runToolTest('get_user_recommendations', {
      user_interests: ['前端开发'],
      limit: 5
    }, '获取用户推荐');

    await this.runToolTest('generate_user_report', {
      user_id: 'test_user',
      include_recommendations: true
    }, '生成用户报告');

    await this.runToolTest('update_recommendations', {
      user_id: 'test_user',
      feedback: { liked: ['id1'], disliked: ['id2'] }
    }, '更新推荐');

    await this.runToolTest('get_trending_recommendations', {
      category: '前端',
      limit: 5
    }, '获取趋势推荐');
  }

  /**
   * 测试性能相关工具
   */
  async testPerformanceTools() {
    console.log('\n⚡ === 性能工具测试 ===');

    await this.runToolTest('get_performance_stats', {}, '获取性能统计');

    await this.runToolTest('get_cache_stats', {}, '获取缓存统计');

    await this.runToolTest('get_system_health', {}, '获取系统健康状态');

    await this.runToolTest('optimize_performance', {
      target: 'cache'
    }, '优化性能');

    await this.runToolTest('run_performance_benchmark', {
      test_type: 'api_response'
    }, '运行性能基准测试');
  }

  /**
   * 测试授权相关工具
   */
  async testAuthTools() {
    console.log('\n🔐 === 授权工具测试 ===');

    await this.runToolTest('check_auth_status', {}, '检查授权状态');

    // 以下工具需要有效的Cookie，可能会失败
    this.skipTest('like_article', '需要有效的用户Cookie');
    this.skipTest('like_pin', '需要有效的用户Cookie');
    this.skipTest('collect_article', '需要有效的用户Cookie');
    this.skipTest('follow_user', '需要有效的用户Cookie');
    this.skipTest('get_user_profile', '需要有效的用户Cookie');
  }

  /**
   * 测试工具列表和元数据
   */
  async testToolMetadata() {
    console.log('\n🛠️ === 工具元数据测试 ===');

    console.log('\n📋 检查工具注册...');
    const tools = this.server.getTools();
    console.log(`✅ 注册工具数量: ${tools.length}`);

    // 按类别统计工具
    const categories = {
      '文章工具': tools.filter(t => t.name.includes('article')).length,
      '沸点工具': tools.filter(t => t.name.includes('pin')).length,
      '分析工具': tools.filter(t => t.name.includes('analyze') || t.name.includes('trend')).length,
      '推荐工具': tools.filter(t => t.name.includes('recommend')).length,
      '性能工具': tools.filter(t => t.name.includes('performance') || t.name.includes('cache')).length,
      '授权工具': tools.filter(t => ['like_', 'collect_', 'follow_', 'check_auth', 'get_user_profile'].some(prefix => t.name.includes(prefix))).length,
    };

    console.log('\n📊 工具分类统计:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}个`);
    });

    // 检查工具Schema完整性
    let validSchemas = 0;
    let invalidSchemas = 0;

    tools.forEach(tool => {
      if (tool.name && tool.description && tool.inputSchema) {
        validSchemas++;
      } else {
        invalidSchemas++;
        console.log(`⚠️ 工具Schema不完整: ${tool.name}`);
      }
    });

    console.log(`\n✅ 有效Schema: ${validSchemas}`);
    console.log(`❌ 无效Schema: ${invalidSchemas}`);

    this.results.tests.push({
      tool: 'metadata_check',
      status: invalidSchemas === 0 ? 'PASS' : 'FAIL',
      description: '工具元数据检查',
      result: `${validSchemas}/${tools.length} 工具Schema有效`
    });

    if (invalidSchemas === 0) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📊 === MCP工具测试报告 ===');
    console.log(`✅ 通过: ${this.results.passed}`);
    console.log(`❌ 失败: ${this.results.failed}`);
    console.log(`⏭️ 跳过: ${this.results.skipped}`);

    const total = this.results.passed + this.results.failed;
    if (total > 0) {
      console.log(`📈 成功率: ${Math.round((this.results.passed / total) * 100)}%`);
    }

    // 按状态分组显示结果
    const byStatus = this.results.tests.reduce((acc, test) => {
      acc[test.status] = acc[test.status] || [];
      acc[test.status].push(test);
      return acc;
    }, {});

    if (byStatus.FAIL && byStatus.FAIL.length > 0) {
      console.log('\n❌ 失败的工具:');
      byStatus.FAIL.forEach(test => {
        console.log(`   • ${test.tool}: ${test.error}`);
      });
    }

    if (byStatus.SKIP && byStatus.SKIP.length > 0) {
      console.log('\n⏭️ 跳过的工具:');
      byStatus.SKIP.forEach(test => {
        console.log(`   • ${test.tool}: ${test.reason}`);
      });
    }

    console.log('\n🎯 测试总结:');
    if (this.results.failed === 0) {
      console.log('   🎉 所有可测试的工具都正常工作！');
    } else {
      console.log('   🔧 部分工具需要检查，请查看失败列表。');
    }

    console.log('   📝 跳过的工具通常需要特殊环境或授权。');
    console.log('   🌐 确保网络连接和API访问正常。');
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始MCP工具功能测试...\n');
    console.log('⏰ 测试时间:', new Date().toLocaleString());

    try {
      await this.testToolMetadata();
      await this.testArticleTools();
      await this.testPinTools();
      await this.testAnalyticsTools();
      await this.testRecommendationTools();
      await this.testPerformanceTools();
      await this.testAuthTools();
    } catch (error) {
      console.error('💥 测试运行出错:', error);
    }

    this.generateReport();
    process.exit(0);
  }
}

// 运行测试
const tester = new MCPToolsTester();
tester.runAllTests().catch(error => {
  console.error('💥 MCP工具测试启动失败:', error);
  process.exit(1);
});
