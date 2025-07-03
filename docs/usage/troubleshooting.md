# 故障排除指南

## 🚨 常见问题快速解决

### ⚡ 快速诊断

**第一步：健康检查**
```bash
npx juejin-mcp-server --health
```

**第二步：工具测试**
```bash
npx juejin-mcp-server --test get_articles
```

**第三步：查看版本**
```bash
npx juejin-mcp-server --version
```

## 🔧 安装和启动问题

### 问题1：NPX启动失败

**症状**:
```
npx: command not found
```

**解决方案**:
```bash
# 检查Node.js和npm版本
node --version  # 需要 >= 18.0.0
npm --version   # 需要 >= 8.0.0

# 如果版本过低，升级Node.js
# 访问 https://nodejs.org 下载最新版本

# 清理npm缓存
npm cache clean --force

# 重新尝试
npx juejin-mcp-server
```

### 问题2：权限错误

**症状**:
```
EACCES: permission denied
```

**解决方案**:
```bash
# 方案1：使用npx（推荐）
npx juejin-mcp-server

# 方案2：配置npm全局目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# 方案3：使用sudo（不推荐）
sudo npm install -g juejin-mcp-server
```

### 问题3：网络连接问题

**症状**:
```
Error: connect ETIMEDOUT
Error: getaddrinfo ENOTFOUND
```

**解决方案**:
```bash
# 检查网络连接
ping api.juejin.cn

# 配置代理（如果需要）
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# 或使用环境变量
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

## 🖥️ MCP客户端配置问题

### 问题4：Cursor IDE无法连接

**症状**:
- AI助手无法调用掘金工具
- 配置后没有反应

**检查清单**:
```json
// 1. 检查配置文件语法
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"]
    }
  }
}

// 2. 验证JSON格式
// 使用在线JSON验证器检查语法

// 3. 重启Cursor IDE
// 保存配置后完全重启应用
```

**调试步骤**:
```bash
# 1. 手动测试服务器
npx juejin-mcp-server

# 2. 检查服务器输出
# 应该看到启动成功信息

# 3. 在Cursor中测试
# AI指令: "请获取3篇前端技术文章"
```

### 问题5：Claude Desktop配置问题

**症状**:
- 配置文件找不到
- 配置后无效果

**配置文件位置**:
```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows  
%APPDATA%\Claude\claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json
```

**解决步骤**:
```bash
# 1. 创建配置目录（如果不存在）
mkdir -p ~/Library/Application\ Support/Claude/

# 2. 创建配置文件
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"]
    }
  }
}
EOF

# 3. 验证配置
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 4. 重启Claude Desktop
```

## 🛠️ 工具调用问题

### 问题6：工具调用超时

**症状**:
```
Error: Request timeout after 10000ms
```

**解决方案**:
```json
// 增加超时时间
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"],
      "env": {
        "JUEJIN_API_TIMEOUT": "20000"
      }
    }
  }
}
```

**优化建议**:
- 减少limit参数值
- 使用简化版工具（get_simple_*）
- 检查网络连接稳定性

### 问题7：工具返回空结果

**症状**:
- 工具调用成功但返回空数据
- 没有错误信息

**排查步骤**:
```bash
# 1. 检查API可访问性
curl -I https://api.juejin.cn

# 2. 测试基础工具
npx juejin-mcp-server --test get_articles

# 3. 检查参数设置
# 确保limit > 0
# 确保category_id正确
```

**常见原因**:
- 参数设置不当
- API临时不可用
- 网络连接问题
- 缓存过期

### 问题8：授权功能失败

**症状**:
```
Error: Authentication required
Error: Invalid cookie
```

**解决步骤**:
```bash
# 1. 检查授权配置
echo $JUEJIN_ENABLE_AUTH
echo $JUEJIN_COOKIE

# 2. 重新获取Cookie
# 登录掘金网站 → 开发者工具 → 复制Cookie

# 3. 更新配置
{
  "env": {
    "JUEJIN_ENABLE_AUTH": "true",
    "JUEJIN_COOKIE": "your_new_cookie_here"
  }
}
```

**Cookie格式检查**:
```text
✅ 正确格式:
sessionid=xxx; userid=xxx; username=xxx

❌ 错误格式:
Cookie: sessionid=xxx
只有sessionid=xxx
```

## 📊 性能问题

### 问题9：响应速度慢

**症状**:
- 工具调用时间 > 5秒
- 频繁超时

**优化方案**:
```json
// 性能优化配置
{
  "env": {
    "JUEJIN_CACHE_TTL_SECONDS": "600",
    "JUEJIN_MAX_CONCURRENCY": "3",
    "JUEJIN_BATCH_SIZE": "5"
  }
}
```

**使用技巧**:
- 优先使用简化版工具
- 合理设置limit参数
- 利用缓存机制
- 避免频繁重复请求

### 问题10：内存占用过高

**症状**:
- 系统内存不足
- 服务器响应变慢

**监控和优化**:
```bash
# 检查内存使用
npx juejin-mcp-server --test get_performance_stats

# 清理缓存
{
  "tool": "optimize_performance",
  "arguments": {"target": "cache"}
}
```

## 🔍 调试技巧

### 启用调试模式

```json
{
  "mcpServers": {
    "juejin-mcp": {
      "command": "npx",
      "args": ["juejin-mcp-server"],
      "env": {
        "DEBUG": "true",
        "NODE_ENV": "development",
        "JUEJIN_LOG_LEVEL": "debug"
      }
    }
  }
}
```

### 查看详细日志

```bash
# 启动时查看详细输出
npx juejin-mcp-server --verbose

# 检查系统健康状态
npx juejin-mcp-server --health --verbose
```

### 逐步排查

```text
1. 确认基础环境（Node.js版本、网络连接）
2. 测试服务器启动（npx命令）
3. 验证MCP配置（JSON语法、文件路径）
4. 测试基础工具（get_articles）
5. 检查具体错误信息
```

## 📞 获取帮助

### 自助解决

1. **查看文档** - [完整文档](../README.md)
2. **搜索Issues** - [GitHub Issues](https://github.com/h7ml/juejin-mcp-server/issues)
3. **运行诊断** - `npx juejin-mcp-server --health`

### 社区支持

1. **提交Issue** - [新建Issue](https://github.com/h7ml/juejin-mcp-server/issues/new)
2. **参与讨论** - [GitHub Discussions](https://github.com/h7ml/juejin-mcp-server/discussions)
3. **查看FAQ** - [常见问题](../faq.md)

### 提交问题时请包含

```text
1. 操作系统和版本
2. Node.js和npm版本
3. 完整的错误信息
4. 重现步骤
5. MCP配置（移除敏感信息）
6. 尝试过的解决方案
```

## 📋 问题预防

### 定期维护

```bash
# 每周检查
npx juejin-mcp-server --health

# 每月更新
npm update -g juejin-mcp-server

# 清理缓存
npm cache clean --force
```

### 最佳实践

- 保持Node.js和npm最新版本
- 定期更新掘金Cookie
- 监控系统性能指标
- 备份重要配置文件

---

**遇到问题不要慌，按照指南逐步排查，大部分问题都能快速解决！** 🛠️
