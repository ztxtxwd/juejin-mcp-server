#!/usr/bin/env node

/**
 * 测试运行器 - 统一运行所有测试
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TestRunner {
  constructor() {
    this.tests = [
      {
        name: '服务器基础测试',
        file: 'test-server.js',
        description: '测试MCP服务器基础功能和工具注册'
      },
      {
        name: 'API调试测试',
        file: 'debug-api.js',
        description: '调试掘金API数据结构和响应'
      },
      {
        name: '简化功能测试',
        file: 'test-simple-mcp.js',
        description: '测试核心MCP功能'
      },
      {
        name: '接口综合测试',
        file: 'api-test.js',
        description: '全面测试所有API接口和性能'
      },
      {
        name: 'MCP工具测试',
        file: 'mcp-tools-test.js',
        description: '测试所有31+个MCP工具功能'
      },
      {
        name: 'MCP集成测试',
        file: 'mcp-integration-test.js',
        description: 'API与MCP工具的端到端集成测试'
      },
      {
        name: '完整接口测试',
        file: 'complete-interface-test.js',
        description: '100%接口覆盖率和功能一致性测试'
      },
      {
        name: '新工具验证测试',
        file: 'new-tools-test.js',
        description: '验证新增的简化工具功能'
      }
    ];
    this.results = [];
  }

  /**
   * 运行单个测试
   */
  async runSingleTest(test) {
    return new Promise((resolve) => {
      console.log(`\n🚀 开始运行: ${test.name}`);
      console.log(`📝 描述: ${test.description}`);
      console.log(`📄 文件: ${test.file}`);
      console.log('─'.repeat(60));

      const testPath = join(__dirname, test.file);
      const child = spawn('node', [testPath], {
        stdio: 'inherit',
        cwd: join(__dirname, '..')
      });

      const startTime = Date.now();

      child.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          name: test.name,
          file: test.file,
          success: code === 0,
          duration: `${duration}ms`,
          code
        };

        this.results.push(result);

        if (code === 0) {
          console.log(`\n✅ ${test.name} 完成 (${duration}ms)`);
        } else {
          console.log(`\n❌ ${test.name} 失败 (退出码: ${code}, ${duration}ms)`);
        }

        resolve(result);
      });

      child.on('error', (error) => {
        console.error(`\n💥 ${test.name} 运行错误:`, error.message);
        const result = {
          name: test.name,
          file: test.file,
          success: false,
          duration: '0ms',
          error: error.message
        };
        this.results.push(result);
        resolve(result);
      });
    });
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 掘金MCP服务器 - 测试套件');
    console.log('═'.repeat(60));
    console.log(`📅 测试时间: ${new Date().toLocaleString()}`);
    console.log(`🔢 测试数量: ${this.tests.length}`);
    console.log('═'.repeat(60));

    const startTime = Date.now();

    for (const test of this.tests) {
      await this.runSingleTest(test);

      // 测试间隔，避免API请求过于频繁
      if (this.tests.indexOf(test) < this.tests.length - 1) {
        console.log('\n⏳ 等待2秒后继续下一个测试...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    this.generateSummaryReport(totalDuration);
  }

  /**
   * 运行特定测试
   */
  async runSpecificTest(testName) {
    const test = this.tests.find(t =>
      t.name.toLowerCase().includes(testName.toLowerCase()) ||
      t.file.toLowerCase().includes(testName.toLowerCase())
    );

    if (!test) {
      console.error(`❌ 未找到测试: ${testName}`);
      console.log('\n可用的测试:');
      this.tests.forEach((t, index) => {
        console.log(`  ${index + 1}. ${t.name} (${t.file})`);
      });
      return;
    }

    console.log('🧪 掘金MCP服务器 - 单项测试');
    console.log('═'.repeat(60));
    console.log(`📅 测试时间: ${new Date().toLocaleString()}`);
    console.log('═'.repeat(60));

    const startTime = Date.now();
    await this.runSingleTest(test);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    this.generateSummaryReport(totalDuration);
  }

  /**
   * 生成汇总报告
   */
  generateSummaryReport(totalDuration) {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 测试汇总报告');
    console.log('═'.repeat(60));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const successRate = this.results.length > 0 ? Math.round((successful / this.results.length) * 100) : 0;

    console.log(`✅ 成功: ${successful}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📈 成功率: ${successRate}%`);
    console.log(`⏱️ 总耗时: ${totalDuration}ms`);

    if (this.results.length > 0) {
      console.log('\n📋 详细结果:');
      this.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${index + 1}. ${status} ${result.name} (${result.duration})`);
        if (result.error) {
          console.log(`     错误: ${result.error}`);
        }
      });
    }

    if (failed > 0) {
      console.log('\n🔧 故障排除建议:');
      console.log('  • 确保项目已正确构建 (npm run build)');
      console.log('  • 检查网络连接和掘金API可访问性');
      console.log('  • 验证环境变量配置');
      console.log('  • 查看具体错误信息进行针对性修复');
    } else {
      console.log('\n🎉 所有测试通过！系统运行正常。');
    }

    console.log('\n📝 测试文件位置: _test/');
    console.log('💡 单独运行测试: node _test/run-tests.js <测试名称>');
    console.log('═'.repeat(60));
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log('🧪 掘金MCP服务器测试运行器');
    console.log('\n用法:');
    console.log('  node _test/run-tests.js              # 运行所有测试');
    console.log('  node _test/run-tests.js <测试名>     # 运行特定测试');
    console.log('  node _test/run-tests.js --help       # 显示帮助');

    console.log('\n可用测试:');
    this.tests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.name}`);
      console.log(`     文件: ${test.file}`);
      console.log(`     描述: ${test.description}`);
      console.log('');
    });
  }
}

// 主程序
async function main() {
  const runner = new TestRunner();
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    runner.showHelp();
    return;
  }

  if (args.length > 0) {
    // 运行特定测试
    await runner.runSpecificTest(args[0]);
  } else {
    // 运行所有测试
    await runner.runAllTests();
  }
}

main().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 测试运行器启动失败:', error);
  process.exit(1);
});
