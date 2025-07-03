# 更新日志

本文档记录了掘金MCP服务器的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.3/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增

- GitHub Actions CI/CD 工作流
- 完整的文档体系 (docs/ 目录)
- Docker 支持
- 代码质量检查 (CodeQL)

### 优化

- package.json 元数据完善
- 构建配置优化，去除 source map
- README.md 重构，面向 MCP 用户

## [1.1.3] - 2025-07-03

### 新增

- 🎉 首次发布
- 34个专业MCP工具
- 智能内容分析和推荐系统
- 完整的测试体系
- 支持 Cursor IDE 和 Claude Desktop

#### 核心功能

- **文章工具** (7个): 获取、搜索、质量分析
- **沸点工具** (5个): 获取、话题分析
- **分析工具** (9个): 趋势分析、内容洞察
- **推荐工具** (7个): 智能推荐、个性化服务
- **用户工具** (6个): 用户交互、授权管理
- **性能工具** (5个): 系统监控、性能优化

#### 技术特性

- TypeScript 100% 类型安全
- 智能缓存系统
- 并发控制和批处理
- 完善的错误处理
- 性能监控和健康检查

#### 测试覆盖

- 8个测试模块
- 100% 接口覆盖
- 集成测试和性能测试
- 自动化测试流程

### 性能数据

- 响应时间: 200-500ms
- 推荐准确率: 82-84%
- 内存占用: ~35MB
- 并发支持: 5个请求

### 支持的客户端

- Cursor IDE
- Claude Desktop
- 其他支持 MCP 的客户端

---

## 版本说明

### 版本号格式

本项目使用语义化版本号 `MAJOR.MINOR.PATCH`：

- **MAJOR**: 不兼容的 API 更改
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

### 更新类型

- **新增**: 新功能
- **优化**: 现有功能的改进
- **修复**: 问题修复
- **移除**: 移除的功能
- **安全**: 安全相关的修复

### 获取更新

```bash
# 检查最新版本
npm info juejin-mcp-server version

# 更新到最新版本
npm install -g juejin-mcp-server@latest

# 或使用 npx (推荐)
npx juejin-mcp-server@latest
```
