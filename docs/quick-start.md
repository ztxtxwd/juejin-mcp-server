# 快速上手指南

## 🚀 5分钟快速体验

本指南将帮助您在5分钟内完成掘金MCP服务器的配置和使用。

## 📋 准备工作

### 必需条件

- 支持MCP的AI客户端（Cursor IDE 或 Claude Desktop）
- 网络连接（访问掘金API）

### 可选条件

- Node.js 18+ （仅本地开发需要）
- 掘金账号Cookie（解锁高级功能）

## ⚡ 第一步：启动服务器

### 方式一：一键启动（推荐）

```bash
npx juejin-mcp-server
```

**看到以下输出表示启动成功：**

```
🚀 掘金智能聚合MCP服务器启动成功！
🔧 支持的工具数量 34+
📊 服务器状态：运行中
🌐 API状态：正常
💾 缓存状态：已启用
📖 使用文档：https://github.com/h7ml/juejin-mcp-server
```

### 方式二：带授权启动

```bash
JUEJIN_ENABLE_AUTH=true JUEJIN_COOKIE="your_cookie" npx juejin-mcp-server
```

## 🖥️ 第二步：配置MCP客户端

### Cursor IDE 配置

1. **打开设置**
   - 按 `Cmd/Ctrl + Shift + P`
   - 输入 "Preferences: Open Settings (JSON)"

2. **添加MCP配置**

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

3. **重启Cursor**
   - 保存设置文件
   - 重启Cursor IDE

### Claude Desktop 配置

1. **找到配置文件**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **编辑配置**

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

3. **重启Claude Desktop**

## 🧪 第三步：测试功能

### 基础功能测试

在AI聊天中输入以下指令：

**1. 获取技术文章**

```
请获取5篇前端技术文章
```

**2. 智能推荐**

```
根据我对Vue和React的兴趣，推荐一些相关内容
```

**3. 趋势分析**

```
分析一下最近的技术热点趋势
```

### 预期结果

**成功的响应示例：**

- 文章列表包含标题、作者、点赞数等信息
- 推荐内容与指定兴趣相关
- 趋势分析显示热门标签和话题

## 🔧 第四步：高级配置（可选）

### 启用授权功能

**1. 获取掘金Cookie**

- 登录 [掘金网站](https://juejin.cn)
- 打开开发者工具（F12）
- 复制Cookie值

**2. 配置授权**

```json
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"],
      "env": {
        "JUEJIN_ENABLE_AUTH": "true",
        "JUEJIN_COOKIE": "your_cookie_here"
      }
    }
  }
}
```

**3. 测试授权功能**

```
帮我点赞这篇文章
检查我的登录状态
```

## 💡 使用技巧

### 推荐的AI指令

**内容发现：**

- "找一些关于[技术栈]的高质量文章"
- "推荐一些适合[技能水平]的学习内容"

**趋势分析：**

- "分析[技术领域]的最新趋势"
- "这个技术现在热度如何？"

**质量评估：**

- "评估这篇文章的质量"
- "这个内容值得学习吗？"

### 最佳实践

1. **合理使用限制参数**
   - 文章获取建议limit=5-10
   - 推荐内容建议limit=3-5

2. **组合使用工具**
   - 先获取内容，再分析质量
   - 先分析趋势，再获取推荐

3. **利用缓存机制**
   - 相同请求会自动缓存
   - 避免频繁重复请求

## 🔍 故障排除

### 常见问题

**1. MCP服务器无法启动**

```bash
# 检查Node.js版本
node --version

# 清理npm缓存
npm cache clean --force

# 重新启动
npx juejin-mcp-server
```

**2. AI客户端无法连接**

- 检查配置文件语法
- 确认服务器正在运行
- 重启AI客户端

**3. 工具调用失败**

- 检查网络连接
- 验证API可访问性
- 查看错误信息

### 获取帮助

**快速检查：**

```bash
# 检查服务器健康状态
npx juejin-mcp-server --health

# 测试特定工具
npx juejin-mcp-server --test get_articles
```

**寻求帮助：**

- 📖 [完整文档](./README.md)
- 🐛 [问题反馈](https://github.com/h7ml/juejin-mcp-server/issues)
- 💬 [社区讨论](https://github.com/h7ml/juejin-mcp-server/discussions)

## 🎯 下一步

恭喜！您已经成功配置了掘金MCP服务器。

**继续探索：**

- 📚 [工具完整列表](./tools/README.md) - 了解所有34个工具
- 💡 [使用场景](./usage/scenarios.md) - 更多实用场景
- 🔧 [最佳实践](./usage/best-practices.md) - 优化使用体验
- ⚙️ [高级配置](./usage/configuration.md) - 自定义配置选项

**开始创作：**

- 让AI帮您发现优质技术内容
- 分析技术趋势，把握发展方向
- 获得个性化的学习推荐
- 提升内容消费的效率和质量

---

**🎉 享受智能化的掘金内容体验！**

_最后更新: 2025-07-03_
