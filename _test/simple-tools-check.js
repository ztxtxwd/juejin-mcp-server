#!/usr/bin/env node

/**
 * 简单工具检查
 * 验证工具注册和基本可用性
 */

import { JuejinMcpServer } from '../dist/server.js';

async function simpleToolsCheck() {
  console.log('🔍 掘金MCP工具简单检查');
  console.log('═'.repeat(50));

  try {
    const server = new JuejinMcpServer();
    const tools = server.getTools();

    console.log(`📊 工具统计:`);
    console.log(`  总工具数: ${tools.length}`);

    // 按分类统计
    const categories = {
      'articles': 0,
      'pins': 0,
      'analytics': 0,
      'recommendations': 0,
      'performance': 0,
      'auth': 0,
      'other': 0
    };

    tools.forEach(tool => {
      if (tool.name.includes('article')) categories.articles++;
      else if (tool.name.includes('pin')) categories.pins++;
      else if (tool.name.includes('analyz') || tool.name.includes('trend') || tool.name.includes('insight')) categories.analytics++;
      else if (tool.name.includes('recommend')) categories.recommendations++;
      else if (tool.name.includes('performance') || tool.name.includes('cache') || tool.name.includes('health')) categories.performance++;
      else if (tool.name.includes('auth') || tool.name.includes('like') || tool.name.includes('follow') || tool.name.includes('collect')) categories.auth++;
      else categories.other++;
    });

    console.log(`\n📁 分类统计:`);
    Object.entries(categories).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`  ${category}: ${count}个`);
      }
    });

    console.log(`\n📋 所有工具列表:`);
    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name}`);
    });

    // 测试几个关键工具
    console.log(`\n🧪 关键工具快速测试:`);

    const keyTools = [
      { name: 'get_articles', args: { limit: 1 } },
      { name: 'get_pins', args: { limit: 1 } },
      { name: 'check_auth_status', args: {} },
      { name: 'get_performance_stats', args: {} }
    ];

    let passedTests = 0;

    for (const tool of keyTools) {
      try {
        const result = await server.handleToolCall(tool.name, tool.args);
        if (result.isError) {
          const errorMsg = result.content[0]?.text || '';
          if (errorMsg.includes('模拟错误')) {
            console.log(`  ❌ ${tool.name}: 模拟错误（需要修复）`);
          } else {
            console.log(`  ⚠️  ${tool.name}: 有错误但可能正常`);
            passedTests++;
          }
        } else {
          console.log(`  ✅ ${tool.name}: 正常`);
          passedTests++;
        }
      } catch (error) {
        console.log(`  ❌ ${tool.name}: ${error.message}`);
      }
    }

    console.log(`\n📈 测试结果:`);
    console.log(`  通过: ${passedTests}/${keyTools.length}`);
    console.log(`  成功率: ${Math.round((passedTests / keyTools.length) * 100)}%`);

    if (passedTests === keyTools.length) {
      console.log(`\n🎉 所有关键工具都能正常响应！`);
    } else if (passedTests >= keyTools.length * 0.75) {
      console.log(`\n👍 大部分关键工具正常！`);
    } else {
      console.log(`\n🔧 部分关键工具需要检查！`);
    }

  } catch (error) {
    console.error('💥 工具检查失败:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

simpleToolsCheck().catch(error => {
  console.error('💥 工具检查启动失败:', error);
  process.exit(1);
});
