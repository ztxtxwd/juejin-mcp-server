# CI/CD配置指南

## 🚀 CI/CD概览

掘金MCP服务器提供了完整的CI/CD配置，支持NPM和PNPM两种包管理器，确保在各种环境下都能正常构建和部署。

## 📋 GitHub Actions工作流

### CI工作流 (`.github/workflows/ci.yml`)

**功能**: 代码质量检查、测试、构建验证

**触发条件**:

- Push到main分支
- Pull Request到main分支

**支持的Node.js版本**:

- 18.x
- 20.x
- 22.x

**工作流步骤**:

1. 代码检出
2. 设置PNPM
3. 设置Node.js (带PNPM缓存)
4. 安装依赖 (智能检测锁文件)
5. TypeScript类型检查
6. ESLint代码检查
7. Prettier格式检查
8. 项目构建
9. 运行测试套件

### 发布工作流 (`.github/workflows/release.yml`)

**功能**: 自动发布到NPM和创建GitHub Release

**触发条件**:

- 推送标签 (v*.*.\*)

**工作流步骤**:

1. 代码检出
2. 设置PNPM
3. 设置Node.js (带NPM注册表配置)
4. 安装依赖
5. 运行测试
6. 构建项目
7. 发布到NPM
8. 创建GitHub Release

## 🔧 包管理器支持

### 智能依赖安装

项目支持NPM和PNPM两种包管理器，CI/CD会自动检测并使用合适的安装方式：

```yaml
- name: Install dependencies
  run: pnpm run ci:install
```

对应的脚本逻辑：

```bash
if [ -f pnpm-lock.yaml ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi
```

### 缓存策略

**PNPM缓存**:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
    cache: 'pnpm'
```

**NPM缓存** (备用):

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
    cache: 'npm'
```

## 🛠️ 本地CI/CD测试

### 模拟CI环境

```bash
# 1. 清理环境
rm -rf node_modules dist

# 2. 使用CI安装脚本
pnpm run ci:install

# 3. 运行完整的CI检查
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
pnpm run test:all
```

### 测试发布流程

```bash
# 1. 模拟发布前检查
pnpm run prepublishOnly

# 2. 检查包内容
npm pack --dry-run

# 3. 本地测试安装
npm install -g ./juejin-mcp-server-*.tgz
```

## 🔍 故障排除

### 常见CI/CD问题

#### 1. 缺少锁文件错误

**错误信息**:

```bash
Error: Dependencies lock file is not found in /path/to/project.
Supported file patterns: pnpm-lock.yaml
```

**解决方案**:

```yaml
# 方案1: 使用智能检测脚本
- name: Install dependencies
  run: |
    if [ -f pnpm-lock.yaml ]; then
      echo "Found pnpm-lock.yaml, installing with frozen lockfile"
      pnpm install --frozen-lockfile
    else
      echo "No pnpm-lock.yaml found, installing without frozen lockfile"
      pnpm install
    fi

# 方案2: 使用备用NPM工作流
# 触发 .github/workflows/ci-npm.yml
```

**项目配置**:

- 主CI使用PNPM，包含智能锁文件检测
- 备用CI使用NPM，作为fallback方案
- 两种方案都经过测试验证

#### 2. PNPM版本不匹配

**错误信息**:

```
The lockfile is associated with pnpm version X.X.X but the current pnpm is Y.Y.Y
```

**解决方案**:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8.15.0 # 固定版本
```

#### 3. 缓存问题

**症状**: 依赖安装缓慢或失败

**解决方案**:

```yaml
- name: Clear cache
  run: |
    pnpm store prune
    npm cache clean --force
```

#### 4. 权限问题

**错误信息**:

```
EACCES: permission denied
```

**解决方案**:

- 使用 `npx` 而不是全局安装
- 配置正确的NPM权限

### 调试技巧

#### 启用详细日志

```yaml
- name: Install dependencies
  run: pnpm run ci:install
  env:
    DEBUG: '*'
    PNPM_DEBUG: true
```

#### 检查环境信息

```yaml
- name: Debug info
  run: |
    node --version
    npm --version
    pnpm --version
    echo "Lock files:"
    ls -la *lock*
    echo "Package manager:"
    cat package.json | grep packageManager
```

## 📊 性能优化

### 缓存优化

**依赖缓存**:

- 使用 `actions/setup-node` 的内置缓存
- 缓存键基于锁文件内容
- 支持多个Node.js版本的并行缓存

**构建缓存**:

```yaml
- name: Cache build
  uses: actions/cache@v3
  with:
    path: dist
    key: build-${{ hashFiles('src/**/*') }}
```

### 并行执行

**矩阵构建**:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
```

**并行测试**:

```bash
# 并行运行不同类型的测试
pnpm run test:unit & pnpm run test:integration & wait
```

## 🔐 安全配置

### 密钥管理

**NPM发布令牌**:

```yaml
env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**GitHub令牌**:

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 安全检查

**依赖审计**:

```yaml
- name: Security audit
  run: pnpm audit --audit-level=moderate
```

**代码扫描**:

```yaml
- name: CodeQL Analysis
  uses: github/codeql-action/analyze@v3
```

## 📋 最佳实践

### 工作流设计

1. **快速反馈**: 先运行快速检查（lint、type check）
2. **并行执行**: 利用矩阵策略并行测试多个版本
3. **缓存利用**: 充分利用依赖和构建缓存
4. **错误处理**: 提供清晰的错误信息和调试信息

### 发布策略

1. **语义化版本**: 使用标准的版本号格式
2. **自动发布**: 基于标签自动触发发布
3. **发布验证**: 发布前运行完整测试
4. **回滚准备**: 保留发布历史，支持快速回滚

### 监控和维护

1. **定期更新**: 定期更新GitHub Actions版本
2. **依赖更新**: 定期更新依赖和工具版本
3. **性能监控**: 监控CI/CD执行时间和成功率
4. **安全扫描**: 定期进行安全扫描和审计

---

**通过完善的CI/CD配置，确保项目的高质量和可靠发布！** 🚀🔧

_最后更新: 2025-07-03_
