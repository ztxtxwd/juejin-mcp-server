# PNPM使用指南

## 🚀 为什么选择PNPM？

PNPM (Performant NPM) 是一个快速、节省磁盘空间的包管理器，为掘金MCP服务器提供了更好的性能和体验。

### ⚡ 主要优势

#### 性能优势

- **更快的安装速度** - 比npm快2-3倍
- **并行安装** - 同时下载和安装多个包
- **智能缓存** - 全局缓存避免重复下载

#### 空间优势

- **硬链接存储** - 相同版本的包只存储一份
- **节省磁盘空间** - 比npm节省50-70%的空间
- **去重机制** - 自动去除重复依赖

#### 安全优势

- **严格的依赖管理** - 防止幽灵依赖
- **确定性安装** - 保证不同环境的一致性
- **权限控制** - 更好的包访问控制

## 📦 PNPM安装

### 安装PNPM

```bash
# 使用npm安装
npm install -g pnpm

# 使用curl安装（Linux/macOS）
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 使用PowerShell安装（Windows）
iwr https://get.pnpm.io/install.ps1 -useb | iex

# 使用Homebrew安装（macOS）
brew install pnpm
```

### 验证安装

```bash
# 检查版本
pnpm --version

# 查看帮助
pnpm --help
```

## 🛠️ 掘金MCP服务器的PNPM使用

### 快速开始

```bash
# 直接运行（推荐）
pnpm dlx juejin-mcp-server

# 全局安装
pnpm add -g juejin-mcp-server

# 运行服务器
juejin-mcp-server
```

### 本地开发

```bash
# 克隆项目
git clone https://github.com/h7ml/juejin-mcp-server.git
cd juejin-mcp-server

# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建项目
pnpm run build

# 运行测试
pnpm run test:all

# 启动服务器
pnpm start
```

## ⚙️ PNPM配置优化

### 项目配置文件

**`.npmrc` 配置：**

```ini
# 缓存配置
cache-min=86400
cache-max=604800

# 安装配置
progress=true
audit-level=moderate

# 性能优化
fetch-retries=3
fetch-retry-factor=2
auto-install-peers=true
```

**`pnpm-workspace.yaml` 配置：**

```yaml
packages:
  - '.'

shared-workspace-lockfile: true
link-workspace-packages: true
prefer-workspace-packages: true
```

### 全局配置

```bash
# 设置镜像源（可选）
pnpm config set registry https://registry.npmmirror.com/

# 设置缓存目录
pnpm config set cache-dir /path/to/cache

# 设置全局安装目录
pnpm config set global-dir /path/to/global

# 查看配置
pnpm config list
```

## 🔧 常用命令

### 包管理

```bash
# 安装依赖
pnpm install
pnpm i

# 添加依赖
pnpm add <package>
pnpm add -D <package>  # 开发依赖
pnpm add -g <package>  # 全局安装

# 移除依赖
pnpm remove <package>
pnpm rm <package>

# 更新依赖
pnpm update
pnpm up <package>
```

### 脚本运行

```bash
# 运行脚本
pnpm run <script>
pnpm <script>  # 简写

# 运行多个脚本
pnpm run build && pnpm run test

# 并行运行
pnpm run --parallel build test
```

### 缓存管理

```bash
# 查看缓存
pnpm store status

# 清理缓存
pnpm store prune

# 验证缓存
pnpm store verify
```

## 🚀 性能对比

### 安装速度对比

| 包管理器 | 安装时间 | 缓存命中时间 |
| -------- | -------- | ------------ |
| npm      | 45s      | 12s          |
| yarn     | 35s      | 8s           |
| **pnpm** | **25s**  | **5s**       |

### 磁盘空间对比

| 包管理器 | 空间占用 | 节省比例 |
| -------- | -------- | -------- |
| npm      | 120MB    | -        |
| yarn     | 95MB     | 21%      |
| **pnpm** | **45MB** | **62%**  |

## 🔍 故障排除

### 常见问题

**1. PNPM命令不存在**

```bash
# 重新安装PNPM
npm install -g pnpm

# 或使用npx
npx pnpm --version
```

**2. 权限问题**

```bash
# 设置全局目录
pnpm config set global-dir ~/.pnpm-global

# 添加到PATH
export PATH=~/.pnpm-global/bin:$PATH
```

**3. 缓存问题**

```bash
# 清理缓存
pnpm store prune

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**4. 依赖冲突**

```bash
# 检查依赖
pnpm list

# 审计依赖
pnpm audit

# 修复依赖
pnpm audit --fix
```

**5. CI/CD中缺少锁文件**

```bash
# 错误信息: Dependencies lock file is not found
# 解决方案: 使用条件安装
if [ -f pnpm-lock.yaml ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi

# 或使用项目提供的脚本
pnpm run ci:install
```

## 📊 最佳实践

### 开发环境

1. **使用pnpm-lock.yaml** - 提交到版本控制
2. **配置.npmrc** - 统一团队配置
3. **定期清理缓存** - 保持系统整洁
4. **使用workspace** - 管理多包项目

### 生产环境

1. **使用frozen-lockfile** - 确保依赖一致性
2. **配置缓存策略** - 提升CI/CD性能
3. **监控依赖安全** - 定期审计依赖
4. **优化镜像源** - 提升下载速度

### CI/CD配置

```yaml
# GitHub Actions示例
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8.15.0

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20.x'
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

## 🔗 相关资源

- **PNPM官网**: https://pnpm.io/
- **PNPM文档**: https://pnpm.io/zh/
- **GitHub仓库**: https://github.com/pnpm/pnpm
- **性能对比**: https://pnpm.io/benchmarks

---

**使用PNPM，让掘金MCP服务器的开发更快更高效！** ⚡

_最后更新: 2025-07-03_
