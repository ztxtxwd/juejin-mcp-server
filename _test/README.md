# 掘金MCP服务器测试套件

## 📋 概述

这是掘金智能聚合MCP服务器的完整测试套件，包含API接口测试、MCP工具测试、性能测试等多个测试模块。

## 🗂️ 测试文件结构

```
_test/
├── README.md              # 测试文档
├── test-config.js          # 测试配置文件
├── run-tests.js           # 测试运行器（主入口）
├── api-test.js            # API接口综合测试
├── mcp-tools-test.js      # MCP工具功能测试
├── test-server.js         # 服务器基础测试
├── debug-api.js           # API调试工具
└── test-simple-mcp.js     # 简化功能测试
```

## 🚀 快速开始

### 运行所有测试
```bash
npm test
# 或
node _test/run-tests.js
```

### 运行特定测试
```bash
# API接口测试
npm run test:api

# MCP工具测试
npm run test:tools

# 服务器基础测试
npm run test:server

# API调试
npm run test:debug
```

### 运行单个测试文件
```bash
node _test/run-tests.js api
node _test/run-tests.js tools
node _test/run-tests.js server
```

## 📊 测试模块详解

### 1. API接口测试 (`api-test.js`)
- **文章API测试**：获取、搜索、推荐、热门文章
- **沸点API测试**：获取、搜索、推荐沸点
- **数据结构测试**：验证API响应数据完整性
- **性能测试**：并发请求、响应时间测试

### 2. MCP工具测试 (`mcp-tools-test.js`)
- **31+个工具测试**：覆盖所有MCP工具功能
- **工具分类测试**：按功能分类测试
- **元数据验证**：工具注册和Schema验证
- **授权功能测试**：需要Cookie的功能测试

### 3. 服务器基础测试 (`test-server.js`)
- **服务器实例测试**：MCP服务器创建和配置
- **工具注册测试**：验证工具正确注册
- **配置验证测试**：检查服务器配置

### 4. API调试工具 (`debug-api.js`)
- **数据结构调试**：分析API响应结构
- **错误诊断**：识别和诊断API问题
- **响应验证**：验证数据完整性

### 5. 简化功能测试 (`test-simple-mcp.js`)
- **核心功能测试**：测试最基本的MCP功能
- **快速验证**：快速检查系统是否正常

## ⚙️ 测试配置

### 环境变量
```bash
# 基础配置
JUEJIN_COOKIE=your_cookie_here    # 启用授权测试
TEST_TIMEOUT=10000                # 测试超时时间
TEST_LOG_LEVEL=info              # 日志级别

# 测试控制
SKIP_AUTH_TESTS=false            # 跳过授权测试
ENABLE_PERFORMANCE_TESTS=true    # 启用性能测试
ENABLE_STRESS_TESTS=false        # 启用压力测试
```

### 测试配置文件 (`test-config.js`)
- **API配置**：超时、重试、并发限制
- **测试数据**：关键词、分类、示例ID
- **性能基准**：响应时间、成功率阈值
- **错误处理**：失败处理策略

## 📈 测试报告

### 报告内容
- **测试统计**：通过/失败数量、成功率
- **性能指标**：响应时间、并发性能
- **错误分析**：失败原因和建议
- **分类统计**：按工具类别的测试结果

### 示例报告
```
📊 测试汇总报告
═══════════════════════════════════════
✅ 成功: 28
❌ 失败: 3
📈 成功率: 90%
⏱️ 总耗时: 15432ms

📋 详细结果:
  1. ✅ 服务器基础测试 (1234ms)
  2. ✅ API接口测试 (5678ms)
  3. ❌ MCP工具测试 (2345ms)
```

## 🔧 故障排除

### 常见问题

#### 1. 网络连接问题
```
❌ 获取文章列表失败: Network Error
```
**解决方案**：
- 检查网络连接
- 确认掘金API可访问
- 检查防火墙设置

#### 2. 授权相关错误
```
❌ 点赞文章失败: 此功能需要授权
```
**解决方案**：
- 设置有效的`JUEJIN_COOKIE`环境变量
- 确认Cookie未过期
- 设置`JUEJIN_ENABLE_AUTH=true`

#### 3. 数据结构错误
```
❌ Cannot read properties of undefined
```
**解决方案**：
- 运行API调试工具：`npm run test:debug`
- 检查API响应结构变化
- 更新数据处理逻辑

#### 4. 性能测试失败
```
❌ 响应时间过长: 8000ms
```
**解决方案**：
- 检查网络延迟
- 调整性能阈值配置
- 优化并发请求数量

### 调试技巧

#### 1. 详细日志
```bash
TEST_LOG_LEVEL=debug npm test
```

#### 2. 单独测试失败项目
```bash
node _test/run-tests.js api
```

#### 3. 跳过特定测试
```bash
SKIP_AUTH_TESTS=true npm test
```

#### 4. API结构调试
```bash
npm run test:debug
```

## 🎯 最佳实践

### 1. 测试前准备
- 确保项目已构建：`npm run build`
- 检查网络连接
- 配置必要的环境变量

### 2. 定期测试
- 代码变更后运行测试
- 定期验证API兼容性
- 监控性能指标变化

### 3. 测试环境
- 使用独立的测试环境
- 避免在生产环境运行压力测试
- 保护敏感的授权信息

### 4. 结果分析
- 关注成功率趋势
- 分析性能变化
- 及时修复失败的测试

## 📞 支持

如果遇到测试相关问题：

1. **查看测试报告**：分析具体错误信息
2. **运行调试工具**：使用`debug-api.js`诊断
3. **检查配置**：验证环境变量和配置文件
4. **查看文档**：参考主项目README和API文档

## 🔄 持续改进

测试套件会持续更新和改进：

- **新功能测试**：随着新功能添加相应测试
- **性能优化**：优化测试执行效率
- **错误处理**：改进错误诊断和报告
- **文档更新**：保持文档与代码同步
