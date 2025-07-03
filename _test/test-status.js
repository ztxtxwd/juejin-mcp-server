#!/usr/bin/env node

/**
 * 实时测试状态监控
 * 快速检查系统状态和关键功能
 */

import { JuejinMcpServer } from '../dist/server.js';
import { articleApi } from '../dist/api/articles.js';
import { getConfig, isAuthEnabled } from '../dist/utils/config.js';

class TestStatusMonitor {
  constructor() {
    this.server = new JuejinMcpServer();
    this.config = getConfig();
    this.status = {
      overall: 'unknown',
      components: {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 快速状态检查
   */
  async quickStatusCheck() {
    console.log('🔍 掘金MCP服务器 - 快速状态检查');
    console.log('═'.repeat(50));
    console.log(`⏰ 检查时间: ${new Date().toLocaleString()}`);
    console.log('');

    const checks = [
      { name: '服务器实例', fn: () => this.checkServerInstance() },
      { name: '工具注册', fn: () => this.checkToolRegistration() },
      { name: 'API连接', fn: () => this.checkAPIConnection() },
      { name: 'MCP工具', fn: () => this.checkMCPTools() },
      { name: '授权状态', fn: () => this.checkAuthStatus() },
      { name: '性能指标', fn: () => this.checkPerformance() }
    ];

    let passedChecks = 0;
    const totalChecks = checks.length;

    for (const check of checks) {
      try {
        const result = await check.fn();
        console.log(`✅ ${check.name}: ${result}`);
        this.status.components[check.name] = { status: 'pass', result };
        passedChecks++;
      } catch (error) {
        console.log(`❌ ${check.name}: ${error.message}`);
        this.status.components[check.name] = { status: 'fail', error: error.message };
      }
    }

    // 计算总体状态
    const successRate = Math.round((passedChecks / totalChecks) * 100);
    this.status.overall = successRate >= 90 ? 'excellent' : successRate >= 70 ? 'good' : 'poor';

    console.log('');
    console.log('📊 状态总结:');
    console.log(`  通过检查: ${passedChecks}/${totalChecks} (${successRate}%)`);
    console.log(`  系统状态: ${this.getStatusEmoji()} ${this.getStatusText()}`);

    return this.status;
  }

  /**
   * 检查服务器实例
   */
  async checkServerInstance() {
    const info = this.server.getServerInfo();
    if (!info.name || !info.version) {
      throw new Error('服务器信息不完整');
    }
    return `${info.name} v${info.version}`;
  }

  /**
   * 检查工具注册
   */
  async checkToolRegistration() {
    const tools = this.server.getTools();
    if (tools.length === 0) {
      throw new Error('无工具注册');
    }

    // 检查关键工具
    const keyTools = ['get_articles', 'get_pins', 'check_auth_status'];
    const missingTools = keyTools.filter(tool => !tools.some(t => t.name === tool));

    if (missingTools.length > 0) {
      throw new Error(`缺少关键工具: ${missingTools.join(', ')}`);
    }

    return `${tools.length}个工具已注册`;
  }

  /**
   * 检查API连接
   */
  async checkAPIConnection() {
    const startTime = Date.now();
    const result = await articleApi.getArticleList({ limit: 1 });
    const duration = Date.now() - startTime;

    if (!result.articles || result.articles.length === 0) {
      throw new Error('API无响应数据');
    }

    return `连接正常 (${duration}ms)`;
  }

  /**
   * 检查MCP工具
   */
  async checkMCPTools() {
    const testTools = [
      { name: 'get_articles', args: { limit: 1 } },
      { name: 'check_auth_status', args: {} }
    ];

    let workingTools = 0;
    for (const tool of testTools) {
      try {
        const result = await this.server.handleToolCall(tool.name, tool.args);
        if (!result.isError) {
          workingTools++;
        }
      } catch (error) {
        // 工具调用失败
      }
    }

    if (workingTools === 0) {
      throw new Error('MCP工具无法调用');
    }

    return `${workingTools}/${testTools.length}个核心工具正常`;
  }

  /**
   * 检查授权状态
   */
  async checkAuthStatus() {
    const authEnabled = isAuthEnabled(this.config);
    const hasCookie = !!this.config.auth.cookie;

    if (authEnabled && !hasCookie) {
      throw new Error('授权已启用但Cookie缺失');
    }

    return authEnabled ? '已启用授权功能' : '使用公开功能';
  }

  /**
   * 检查性能指标
   */
  async checkPerformance() {
    const startTime = Date.now();

    // 并发测试
    const promises = [
      articleApi.getArticleList({ limit: 2 }),
      this.server.handleToolCall('get_articles', { limit: 2 })
    ];

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    if (duration > 10000) {
      throw new Error(`响应时间过长: ${duration}ms`);
    }

    return `并发响应 ${duration}ms`;
  }

  /**
   * 获取状态表情符号
   */
  getStatusEmoji() {
    switch (this.status.overall) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  }

  /**
   * 获取状态文本
   */
  getStatusText() {
    switch (this.status.overall) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'poor': return '需要关注';
      default: return '未知';
    }
  }

  /**
   * 生成详细报告
   */
  generateDetailedReport() {
    console.log('\n📋 详细状态报告:');
    console.log('─'.repeat(50));

    Object.entries(this.status.components).forEach(([component, info]) => {
      const status = info.status === 'pass' ? '✅' : '❌';
      const detail = info.result || info.error;
      console.log(`${status} ${component}: ${detail}`);
    });

    console.log('\n🔧 系统信息:');
    console.log(`  • 配置状态: ${this.config ? '已加载' : '未加载'}`);
    console.log(`  • 授权功能: ${isAuthEnabled(this.config) ? '已启用' : '未启用'}`);
    console.log(`  • 检查时间: ${this.status.timestamp}`);

    console.log('\n💡 建议:');
    const failedComponents = Object.entries(this.status.components)
      .filter(([, info]) => info.status === 'fail');

    if (failedComponents.length === 0) {
      console.log('  🎉 所有组件运行正常！');
    } else {
      console.log('  🔧 需要关注以下组件:');
      failedComponents.forEach(([component, info]) => {
        console.log(`    • ${component}: ${info.error}`);
      });
    }
  }

  /**
   * 持续监控模式
   */
  async continuousMonitoring(intervalSeconds = 30) {
    console.log(`🔄 启动持续监控模式 (间隔: ${intervalSeconds}秒)`);
    console.log('按 Ctrl+C 停止监控\n');

    const monitor = async () => {
      try {
        await this.quickStatusCheck();
        console.log(`\n⏰ 下次检查: ${new Date(Date.now() + intervalSeconds * 1000).toLocaleTimeString()}`);
        console.log('═'.repeat(50));
      } catch (error) {
        console.error('监控检查失败:', error.message);
      }
    };

    // 立即执行一次
    await monitor();

    // 设置定时器
    const interval = setInterval(monitor, intervalSeconds * 1000);

    // 处理退出信号
    process.on('SIGINT', () => {
      console.log('\n\n🛑 停止监控');
      clearInterval(interval);
      process.exit(0);
    });
  }
}

// 主程序
async function main() {
  const monitor = new TestStatusMonitor();
  const args = process.argv.slice(2);

  if (args.includes('--continuous') || args.includes('-c')) {
    const interval = parseInt(args[args.indexOf('--interval') + 1]) || 30;
    await monitor.continuousMonitoring(interval);
  } else if (args.includes('--detailed') || args.includes('-d')) {
    await monitor.quickStatusCheck();
    monitor.generateDetailedReport();
  } else {
    await monitor.quickStatusCheck();
  }

  process.exit(0);
}

main().catch(error => {
  console.error('💥 状态监控失败:', error);
  process.exit(1);
});
