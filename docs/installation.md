# 安装指南

## 📋 系统要求

### 基础要求

- **Node.js**: 18.0.0 或更高版本
- **包管理器**: NPM 8.0.0+ 或 PNPM 8.0.0+ (推荐)
- **操作系统**: Windows、macOS、Linux

### MCP客户端要求

- **Cursor IDE**: 最新版本
- **Claude Desktop**: 支持MCP的版本
- 或其他支持Model Context Protocol的客户端

## ⚡ 快速安装

### 方式一：NPX运行（推荐）

**无需安装，直接使用：**

```bash
# 基础功能
npx juejin-mcp-server

# 带授权功能
JUEJIN_ENABLE_AUTH=true JUEJIN_COOKIE="your_cookie" npx juejin-mcp-server
```

**优势：**

- ✅ 无需本地安装
- ✅ 始终使用最新版本
- ✅ 零配置启动

### 方式二：PNPM安装（推荐）

```bash
# 全局安装
pnpm add -g juejin-mcp-server

# 运行服务器
juejin-mcp-server

# 或直接运行
pnpm dlx juejin-mcp-server
```

**优势：**

- ⚡ 更快的安装速度
- 💾 节省磁盘空间
- 🔒 更严格的依赖管理

### 方式三：NPM全局安装

```bash
# 安装到全局
npm install -g juejin-mcp-server

# 运行服务器
juejin-mcp-server

# 查看帮助
juejin-mcp-server --help
```

### 方式四：本地开发安装

**使用PNPM（推荐）：**

```bash
# 克隆项目
git clone https://github.com/h7ml/juejin-mcp-server.git
cd juejin-mcp-server

# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 启动服务器
pnpm start
```

**使用NPM：**

```bash
# 克隆项目
git clone https://github.com/h7ml/juejin-mcp-server.git
cd juejin-mcp-server

# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务器
npm start
```

## 🔧 环境配置

### 基础配置（可选）

创建 `.env` 文件：

```bash
# API配置
JUEJIN_API_BASE_URL=https://api.juejin.cn
JUEJIN_API_TIMEOUT=10000
JUEJIN_API_RETRY_ATTEMPTS=3

# 缓存配置
JUEJIN_CACHE_TTL_SECONDS=300
JUEJIN_CACHE_MAX_ENTRIES=1000
JUEJIN_ENABLE_CACHE=true

# 性能配置
JUEJIN_MAX_CONCURRENCY=5
JUEJIN_BATCH_SIZE=10
JUEJIN_ENABLE_BATCHING=true
```

### 授权配置（高级功能）

```bash
# 启用授权功能
JUEJIN_ENABLE_AUTH=true

# 掘金Cookie（用于点赞、收藏等功能）
JUEJIN_COOKIE="sessionid=xxx; userid=xxx; username=xxx"

# 应用参数（可选）
JUEJIN_AID=2608
JUEJIN_UUID=your_uuid_here
```

## 🔑 获取掘金Cookie

**用于解锁点赞、收藏等高级功能：**

1. **登录掘金**
   - 访问 [掘金网站](https://juejin.cn)
   - 使用您的账号登录

2. **打开开发者工具**
   - 按 `F12` 或右键选择"检查"
   - 切换到 `Network` 标签页

3. **获取Cookie**
   - 刷新页面或进行任意操作
   - 找到任意API请求
   - 在 `Request Headers` 中找到 `Cookie`
   - 复制完整的Cookie值

4. **Cookie格式示例**
   ```
   sessionid=xxx; userid=xxx; username=xxx; _tea_utm_cache_xxx=xxx
   ```

## 🧪 验证安装

### 检查服务器状态

```bash
# 检查版本
juejin-mcp-server --version

# 检查健康状态
juejin-mcp-server --health

# 测试特定工具
juejin-mcp-server --test get_articles
```

### 测试基础功能

```bash
# 运行测试套件
npm test

# 运行API测试
npm run test:api

# 运行工具测试
npm run test:tools
```

## 🔧 故障排除

### 常见问题

**1. Node.js版本过低**

```bash
# 检查版本
node --version

# 升级Node.js
# 访问 https://nodejs.org 下载最新版本
```

**2. NPM权限问题**

```bash
# 使用npx避免权限问题
npx juejin-mcp-server

# 或配置npm全局目录
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

**3. 网络连接问题**

```bash
# 检查网络连接
curl -I https://api.juejin.cn

# 使用代理（如果需要）
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

**4. 构建失败**

```bash
# 清理缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

### 获取帮助

如果遇到其他问题：

1. **查看日志** - 检查控制台输出的错误信息
2. **搜索Issues** - 在 [GitHub Issues](https://github.com/h7ml/juejin-mcp-server/issues) 中搜索
3. **提交Issue** - 提供详细的错误信息和环境信息
4. **社区讨论** - 在 [GitHub Discussions](https://github.com/h7ml/juejin-mcp-server/discussions) 中求助

## 📦 Docker安装（可选）

```bash
# 拉取镜像
docker pull h7ml/juejin-mcp-server

# 运行容器
docker run -p 3000:3000 h7ml/juejin-mcp-server

# 带环境变量运行
docker run -p 3000:3000 \
  -e JUEJIN_ENABLE_AUTH=true \
  -e JUEJIN_COOKIE="your_cookie" \
  h7ml/juejin-mcp-server
```

## 🙏 API来源致谢

本项目使用的掘金API接口基于开源项目：

- **[chenzijia12300/juejin-api](https://github.com/chenzijia12300/juejin-api)** - 提供了完整的掘金平台API接口文档

感谢原作者的开源贡献，让我们能够构建这个智能化的MCP服务器。

## 🚀 下一步

安装完成后，请查看：

- [快速上手指南](./quick-start.md) - 5分钟快速体验
- [MCP客户端配置](./mcp-clients.md) - 配置您的AI客户端
- [工具文档](./tools/README.md) - 了解34个专业工具
