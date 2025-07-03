# 掘金MCP服务器

[![NPM Version](https://img.shields.io/npm/v/juejin-mcp-server)](https://www.npmjs.com/package/juejin-mcp-server)
[![CI](https://github.com/h7ml/juejin-mcp-server/workflows/CI/badge.svg)](https://github.com/h7ml/juejin-mcp-server/actions)
[![License](https://img.shields.io/npm/l/juejin-mcp-server)](https://github.com/h7ml/juejin-mcp-server/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/juejin-mcp-server)](https://www.npmjs.com/package/juejin-mcp-server)

🚀 为AI助手提供掘金内容智能分析能力的MCP服务器

## ⚡ 快速开始

### 一键启动

```bash
npx juejin-mcp-server
```

### MCP配置

```json
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"]
    }
  }
}
```

### 立即体验

```text
AI指令: "帮我找5篇高质量的前端技术文章"
```

## 🛠️ 核心功能

- **34个专业工具** - 文章、沸点、分析、推荐、用户交互
- **智能分析** - AI驱动的内容质量评估和趋势预测
- **实时数据** - 掘金最新内容和热门趋势
- **即插即用** - 零配置启动，支持Cursor、Claude Desktop

## 📚 文档导航

| 文档类型      | 链接                                       | 描述                   |
| ------------- | ------------------------------------------ | ---------------------- |
| 🚀 快速上手   | [5分钟教程](./docs/quick-start.md)         | 最快速的入门方式       |
| ⚙️ 安装配置   | [安装指南](./docs/installation.md)         | 详细安装和配置步骤     |
| 🖥️ 客户端配置 | [MCP客户端](./docs/mcp-clients.md)         | Cursor、Claude等配置   |
| 🛠️ 工具文档   | [34个工具](./docs/tools/README.md)         | 完整工具列表和使用说明 |
| 💡 使用指南   | [最佳实践](./docs/usage/best-practices.md) | 推荐使用方式和技巧     |
| 🔧 开发文档   | [贡献指南](./CONTRIBUTING.md)              | 参与项目开发           |

## 🔗 快速链接

- 📦 [NPM包](https://www.npmjs.com/package/juejin-mcp-server)
- 🐛 [问题反馈](https://github.com/h7ml/juejin-mcp-server/issues)
- 💬 [讨论区](https://github.com/h7ml/juejin-mcp-server/discussions)
- 📖 [完整文档](./docs/README.md)

## 🙏 致谢

- **掘金API接口** - 基于 [chenzijia12300/juejin-api](https://github.com/chenzijia12300/juejin-api) 项目提供的接口文档

---

**让AI助手拥有掘金内容分析能力！** 🚀
