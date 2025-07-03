# MCP客户端配置指南

## 🖥️ 支持的客户端

掘金MCP服务器支持所有兼容Model Context Protocol的客户端：

- ✅ **Cursor IDE** - 推荐，集成度最高
- ✅ **Claude Desktop** - 官方客户端
- ✅ **其他MCP客户端** - 遵循MCP标准的客户端

## 🎯 Cursor IDE 配置

### 基础配置

**1. 打开设置文件**
```
Cmd/Ctrl + Shift + P → "Preferences: Open Settings (JSON)"
```

**2. 添加MCP服务器配置**
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

**3. 重启Cursor IDE**

### 高级配置

**带授权功能：**
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

**本地开发版本：**
```json
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "node",
      "args": ["/path/to/juejin-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

**性能优化配置：**
```json
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"],
      "env": {
        "JUEJIN_CACHE_TTL_SECONDS": "600",
        "JUEJIN_MAX_CONCURRENCY": "3",
        "JUEJIN_API_TIMEOUT": "15000"
      }
    }
  }
}
```

### 验证配置

**在Cursor聊天中测试：**
```
请获取3篇前端技术文章
```

**成功标志：**
- AI能够调用掘金MCP工具
- 返回真实的文章数据
- 响应时间在合理范围内

## 🖥️ Claude Desktop 配置

### 配置文件位置

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 基础配置

**创建或编辑配置文件：**
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

### 高级配置

**完整配置示例：**
```json
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"],
      "env": {
        "JUEJIN_ENABLE_AUTH": "true",
        "JUEJIN_COOKIE": "your_cookie_here",
        "JUEJIN_CACHE_TTL_SECONDS": "300",
        "JUEJIN_MAX_CONCURRENCY": "5"
      }
    }
  },
  "globalShortcut": "Cmd+Shift+C"
}
```

### 验证配置

**重启Claude Desktop后测试：**
```
分析一下最近的前端技术趋势
```

## 🔧 其他MCP客户端

### 通用配置原则

**命令格式：**
```json
{
  "command": "npx",
  "args": ["juejin-mcp-server"],
  "env": {
    "JUEJIN_ENABLE_AUTH": "false"
  }
}
```

**环境变量：**
- `JUEJIN_ENABLE_AUTH` - 是否启用授权功能
- `JUEJIN_COOKIE` - 掘金Cookie（授权时需要）
- `JUEJIN_API_TIMEOUT` - API超时时间（毫秒）
- `JUEJIN_CACHE_TTL_SECONDS` - 缓存过期时间（秒）

### 自定义客户端集成

**MCP协议要求：**
1. 支持stdio通信
2. 实现MCP协议规范
3. 正确处理工具调用和响应

**集成步骤：**
1. 配置服务器启动命令
2. 建立stdio通信通道
3. 发送MCP初始化请求
4. 处理工具列表和调用

## 🔑 Cookie配置详解

### 获取掘金Cookie

**步骤1：登录掘金**
- 访问 [掘金网站](https://juejin.cn)
- 使用您的账号登录

**步骤2：打开开发者工具**
- 按F12或右键选择"检查"
- 切换到Network标签页

**步骤3：获取Cookie**
- 刷新页面或进行任意操作
- 找到任意API请求
- 在Request Headers中找到Cookie
- 复制完整的Cookie值

### Cookie格式

**完整格式示例：**
```
sessionid=xxx; userid=xxx; username=xxx; _tea_utm_cache_xxx=xxx; __tea_cookie_tokens_2608=xxx
```

**最小必需字段：**
```
sessionid=xxx; userid=xxx
```

### 安全注意事项

1. **保护Cookie安全**
   - 不要在公共场所配置
   - 定期更新Cookie
   - 不要分享给他人

2. **权限控制**
   - Cookie仅用于授权功能
   - 不会存储或传输到第三方
   - 本地处理，保护隐私

## 🔧 故障排除

### 常见配置问题

**1. 配置文件语法错误**
```bash
# 验证JSON格式
cat ~/.config/Claude/claude_desktop_config.json | jq .
```

**2. 服务器启动失败**
```bash
# 手动测试启动
npx juejin-mcp-server

# 检查版本
npx juejin-mcp-server --version
```

**3. 权限问题**
```bash
# 清理npm缓存
npm cache clean --force

# 使用全局安装
npm install -g juejin-mcp-server
```

### 调试技巧

**1. 启用调试模式**
```json
{
  "env": {
    "DEBUG": "true",
    "NODE_ENV": "development"
  }
}
```

**2. 查看日志输出**
- Cursor: 查看开发者控制台
- Claude Desktop: 查看应用日志

**3. 测试连接**
```bash
# 健康检查
npx juejin-mcp-server --health

# 工具测试
npx juejin-mcp-server --test get_articles
```

## 📊 性能优化

### 推荐配置

**高性能配置：**
```json
{
  "env": {
    "JUEJIN_CACHE_TTL_SECONDS": "600",
    "JUEJIN_MAX_CONCURRENCY": "3",
    "JUEJIN_BATCH_SIZE": "5",
    "JUEJIN_API_TIMEOUT": "10000"
  }
}
```

**低延迟配置：**
```json
{
  "env": {
    "JUEJIN_CACHE_TTL_SECONDS": "300",
    "JUEJIN_MAX_CONCURRENCY": "5",
    "JUEJIN_ENABLE_BATCHING": "false"
  }
}
```

### 监控配置

**启用性能监控：**
```json
{
  "env": {
    "JUEJIN_ENABLE_PERFORMANCE_MONITORING": "true",
    "JUEJIN_LOG_LEVEL": "info"
  }
}
```

## 🚀 下一步

配置完成后，建议：

1. **阅读快速上手** - [快速上手指南](./quick-start.md)
2. **了解工具** - [工具完整列表](./tools/README.md)
3. **学习最佳实践** - [最佳实践](./usage/best-practices.md)
4. **探索高级功能** - [使用场景](./usage/scenarios.md)

---

**🎉 开始享受智能化的掘金内容体验！**
