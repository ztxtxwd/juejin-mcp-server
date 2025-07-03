# 贡献指南

感谢您对掘金MCP服务器项目的关注！我们欢迎各种形式的贡献。

## 🤝 贡献方式

### 🐛 报告问题

- 使用 [GitHub Issues](https://github.com/h7ml/juejin-mcp-server/issues) 报告bug
- 提供详细的重现步骤和环境信息
- 包含错误日志和截图（如适用）

### 💡 功能建议

- 在 [GitHub Discussions](https://github.com/h7ml/juejin-mcp-server/discussions) 中讨论新功能
- 描述功能的用途和预期行为
- 考虑功能的实现复杂度和维护成本

### 🔧 代码贡献

- Fork项目并创建功能分支
- 遵循代码规范和测试要求
- 提交Pull Request并描述更改内容

### 📖 文档改进

- 改进现有文档的准确性和清晰度
- 添加使用示例和最佳实践
- 翻译文档到其他语言

## 🚀 开发环境设置

### 前置要求

- Node.js 18.0.0 或更高版本
- npm 8.0.0 或更高版本
- Git

### 本地开发设置

```bash
# 1. Fork并克隆项目
git clone https://github.com/your-username/juejin-mcp-server.git
cd juejin-mcp-server

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 运行测试
npm test

# 5. 启动开发服务器
npm run dev
```

### 开发脚本

```bash
# 开发相关
npm run dev          # 开发模式启动
npm run build        # 构建项目
npm run build:clean  # 清理构建

# 测试相关
npm test             # 运行所有测试
npm run test:api     # API测试
npm run test:tools   # 工具测试
npm run test:all     # 完整测试套件

# 代码质量
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run format       # 代码格式化
npm run typecheck    # 类型检查
```

## 📝 代码规范

### TypeScript规范

- 使用严格的TypeScript配置
- 为所有公共API提供类型定义
- 避免使用`any`类型

### 代码风格

- 使用Prettier进行代码格式化
- 遵循ESLint规则
- 使用有意义的变量和函数名

### 提交规范

使用[Conventional Commits](https://www.conventionalcommits.org/)格式：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型说明：**

- `feat`: 新功能
- `fix`: 问题修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例：**

```
feat(tools): add new article quality analysis tool

Add comprehensive article quality analysis with multiple metrics
including readability, technical depth, and engagement potential.

Closes #123
```

## 🧪 测试要求

### 测试覆盖

- 新功能必须包含相应的测试
- 保持测试覆盖率在90%以上
- 包含单元测试和集成测试

### 测试类型

- **单元测试**: 测试单个函数或类
- **集成测试**: 测试API和MCP工具集成
- **端到端测试**: 测试完整的用户场景

### 运行测试

```bash
# 运行特定测试
npm run test:api
npm run test:tools
npm run test:integration

# 运行所有测试
npm run test:all

# 生成覆盖率报告
npm run test:coverage
```

## 📋 Pull Request流程

### 提交前检查

1. **代码质量**

   ```bash
   npm run lint
   npm run typecheck
   npm run format:check
   ```

2. **测试通过**

   ```bash
   npm run test:all
   ```

3. **构建成功**
   ```bash
   npm run build:clean
   ```

### PR描述模板

```markdown
## 📝 更改描述

简要描述此PR的更改内容

## 🎯 更改类型

- [ ] 新功能
- [ ] 问题修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化

## 🧪 测试

- [ ] 添加了新的测试
- [ ] 所有测试通过
- [ ] 手动测试完成

## 📋 检查清单

- [ ] 代码遵循项目规范
- [ ] 提交信息遵循规范
- [ ] 文档已更新（如需要）
- [ ] 无破坏性更改（或已说明）

## 🔗 相关Issue

Closes #issue_number
```

### 审查流程

1. **自动检查**: CI/CD流程自动运行
2. **代码审查**: 维护者进行代码审查
3. **测试验证**: 确保所有测试通过
4. **合并**: 审查通过后合并到主分支

## 🏗️ 项目架构

### 目录结构

```
src/
├── api/                 # API层 - 掘金API接口
├── services/           # 业务逻辑层
├── tools/              # MCP工具层
├── analyzers/          # 数据分析层
├── utils/              # 工具函数
├── types/              # 类型定义
└── server.ts           # MCP服务器
```

### 设计原则

- **分层架构**: 清晰的职责分离
- **模块化**: 高内聚、低耦合
- **可扩展**: 易于添加新功能
- **可测试**: 便于单元测试和集成测试

## 🔧 添加新功能

### 添加新的MCP工具

1. **创建工具函数**

   ```typescript
   // src/tools/your-tools.ts
   export class YourToolHandler {
     async handleYourTool(args: any) {
       // 实现工具逻辑
     }
   }
   ```

2. **注册工具**

   ```typescript
   // src/server.ts
   const tools = [
     // 现有工具...
     {
       name: 'your_tool',
       description: '工具描述',
       inputSchema: {
         // 参数定义
       },
     },
   ];
   ```

3. **添加测试**

   ```typescript
   // _test/your-tool-test.js
   describe('your_tool', () => {
     it('should work correctly', async () => {
       // 测试逻辑
     });
   });
   ```

4. **更新文档**
   - 在`docs/tools/`中添加工具文档
   - 更新工具列表和README

### 添加新的API接口

1. **实现API客户端**

   ```typescript
   // src/api/your-api.ts
   export class YourApi extends BaseApi {
     async yourMethod() {
       // API调用逻辑
     }
   }
   ```

2. **添加业务逻辑**

   ```typescript
   // src/services/your-service.ts
   export class YourService {
     // 业务逻辑实现
   }
   ```

3. **集成到工具**
   ```typescript
   // src/tools/your-tools.ts
   // 在工具中使用新的API和服务
   ```

## 📚 文档贡献

### 文档类型

- **用户文档**: 使用指南、配置说明
- **开发文档**: API参考、架构说明
- **示例文档**: 使用示例、最佳实践

### 文档规范

- 使用Markdown格式
- 包含代码示例
- 提供清晰的步骤说明
- 保持文档与代码同步

## 🎉 认可贡献者

我们会在以下地方认可贡献者：

- README.md中的贡献者列表
- 发布说明中的感谢
- GitHub Contributors页面

## 📞 获取帮助

如果您在贡献过程中遇到问题：

1. **查看文档** - 阅读现有文档和代码
2. **搜索Issues** - 查看是否有相关讨论
3. **提问讨论** - 在GitHub Discussions中提问
4. **联系维护者** - 通过Issue或邮件联系

## 📄 许可证

通过贡献代码，您同意您的贡献将在MIT许可证下发布。

## 🙏 致谢

### API接口来源

本项目的掘金API接口基于以下开源项目：

- **[chenzijia12300/juejin-api](https://github.com/chenzijia12300/juejin-api)** - 提供了完整的掘金平台API接口文档和实现参考

### 开源精神

感谢所有为开源社区做出贡献的开发者们。正是因为有了像 `chenzijia12300/juejin-api` 这样的优秀开源项目，我们才能够构建出更好的工具和服务。

---

**感谢您的贡献！** 🙏
