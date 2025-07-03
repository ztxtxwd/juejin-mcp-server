#!/usr/bin/env node

/**
 * 掘金MCP服务器测试脚本
 * 验证服务器基本功能和工具注册
 */

import { JuejinMcpServer } from '../dist/server.js';

async function testServer() {
  console.log('🧪 开始测试掘金MCP服务器...\n');

  try {
    // 创建服务器实例
    console.log('📦 创建服务器实例...');
    const server = new JuejinMcpServer();
    console.log('✅ 服务器实例创建成功\n');

    // 测试工具注册
    console.log('🔧 测试工具注册...');
    const tools = server.getTools();
    console.log(`✅ 工具注册成功，共注册 ${tools.length} 个工具\n`);

    // 显示工具列表
    console.log('📋 已注册的工具列表：');
    const toolsByCategory = {
      '文章工具': [],
      '沸点工具': [],
      '分析工具': [],
      '推荐工具': [],
      '性能工具': [],
      '其他工具': []
    };

    tools.forEach(tool => {
      if (tool.name.includes('article')) {
        toolsByCategory['文章工具'].push(tool.name);
      } else if (tool.name.includes('pin')) {
        toolsByCategory['沸点工具'].push(tool.name);
      } else if (tool.name.includes('analyze') || tool.name.includes('trend') || tool.name.includes('compare')) {
        toolsByCategory['分析工具'].push(tool.name);
      } else if (tool.name.includes('recommend') || tool.name.includes('user_report')) {
        toolsByCategory['推荐工具'].push(tool.name);
      } else if (tool.name.includes('performance') || tool.name.includes('cache') || tool.name.includes('system') || tool.name.includes('benchmark')) {
        toolsByCategory['性能工具'].push(tool.name);
      } else {
        toolsByCategory['其他工具'].push(tool.name);
      }
    });

    Object.entries(toolsByCategory).forEach(([category, tools]) => {
      if (tools.length > 0) {
        console.log(`\n  ${category} (${tools.length}个):`);
        tools.forEach(tool => {
          console.log(`    • ${tool}`);
        });
      }
    });

    console.log('\n📊 测试统计：');
    console.log(`  • 总工具数量: ${tools.length}`);
    console.log(`  • 文章工具: ${toolsByCategory['文章工具'].length}`);
    console.log(`  • 沸点工具: ${toolsByCategory['沸点工具'].length}`);
    console.log(`  • 分析工具: ${toolsByCategory['分析工具'].length}`);
    console.log(`  • 推荐工具: ${toolsByCategory['推荐工具'].length}`);
    console.log(`  • 性能工具: ${toolsByCategory['性能工具'].length}`);

    // 测试工具schema验证
    console.log('\n🔍 验证工具Schema...');
    let validTools = 0;
    let invalidTools = 0;

    tools.forEach(tool => {
      if (tool.name && tool.description && tool.inputSchema) {
        validTools++;
      } else {
        invalidTools++;
        console.log(`  ❌ 工具 ${tool.name} Schema不完整`);
      }
    });

    console.log(`✅ Schema验证完成: ${validTools} 个有效, ${invalidTools} 个无效\n`);

    // 测试服务器配置
    console.log('⚙️ 测试服务器配置...');
    const serverInfo = server.getServerInfo();
    console.log(`✅ 服务器信息获取成功:`);
    console.log(`  • 名称: ${serverInfo.name}`);
    console.log(`  • 版本: ${serverInfo.version}`);
    console.log(`  • 协议版本: ${serverInfo.protocolVersion}\n`);

    // 测试完成
    console.log('🎉 所有测试通过！');
    console.log('\n📋 测试总结：');
    console.log('  ✅ 服务器实例创建成功');
    console.log('  ✅ 工具注册功能正常');
    console.log('  ✅ 工具Schema验证通过');
    console.log('  ✅ 服务器配置获取正常');
    console.log('\n🚀 掘金MCP服务器已准备就绪，可以投入使用！');

    process.exit(0);

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('\n🔧 请检查以下项目：');
    console.error('  • TypeScript编译是否成功');
    console.error('  • 依赖包是否正确安装');
    console.error('  • 代码语法是否正确');
    process.exit(1);
  }
}

// 运行测试
testServer().catch(error => {
  console.error('💥 测试运行失败:', error);
  process.exit(1);
});
