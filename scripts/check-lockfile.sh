#!/bin/bash

# 锁文件检查脚本
# 用于CI/CD环境中检查和处理包管理器锁文件

set -e

echo "🔍 检查包管理器锁文件..."

# 检查当前目录
echo "📁 当前目录: $(pwd)"
echo "📋 目录内容:"
ls -la

# 检查锁文件
echo ""
echo "🔒 检查锁文件:"

if [ -f "pnpm-lock.yaml" ]; then
    echo "✅ 找到 pnpm-lock.yaml"
    echo "📊 文件大小: $(du -h pnpm-lock.yaml | cut -f1)"
    echo "📅 修改时间: $(stat -c %y pnpm-lock.yaml 2>/dev/null || stat -f %Sm pnpm-lock.yaml)"
    LOCKFILE_TYPE="pnpm"
elif [ -f "package-lock.json" ]; then
    echo "✅ 找到 package-lock.json"
    echo "📊 文件大小: $(du -h package-lock.json | cut -f1)"
    echo "📅 修改时间: $(stat -c %y package-lock.json 2>/dev/null || stat -f %Sm package-lock.json)"
    LOCKFILE_TYPE="npm"
elif [ -f "yarn.lock" ]; then
    echo "✅ 找到 yarn.lock"
    echo "📊 文件大小: $(du -h yarn.lock | cut -f1)"
    echo "📅 修改时间: $(stat -c %y yarn.lock 2>/dev/null || stat -f %Sm yarn.lock)"
    LOCKFILE_TYPE="yarn"
else
    echo "⚠️  未找到任何锁文件"
    LOCKFILE_TYPE="none"
fi

# 检查package.json
echo ""
echo "📦 检查 package.json:"
if [ -f "package.json" ]; then
    echo "✅ 找到 package.json"
    
    # 检查packageManager字段
    if command -v jq >/dev/null 2>&1; then
        PACKAGE_MANAGER=$(jq -r '.packageManager // "not specified"' package.json)
        echo "📋 指定的包管理器: $PACKAGE_MANAGER"
    else
        echo "📋 无法检查packageManager字段 (jq未安装)"
    fi
else
    echo "❌ 未找到 package.json"
    exit 1
fi

# 检查可用的包管理器
echo ""
echo "🛠️  检查可用的包管理器:"

if command -v pnpm >/dev/null 2>&1; then
    PNPM_VERSION=$(pnpm --version)
    echo "✅ PNPM: $PNPM_VERSION"
else
    echo "❌ PNPM: 未安装"
fi

if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo "✅ NPM: $NPM_VERSION"
else
    echo "❌ NPM: 未安装"
fi

if command -v yarn >/dev/null 2>&1; then
    YARN_VERSION=$(yarn --version)
    echo "✅ Yarn: $YARN_VERSION"
else
    echo "❌ Yarn: 未安装"
fi

# 推荐安装命令
echo ""
echo "💡 推荐的安装命令:"

case $LOCKFILE_TYPE in
    "pnpm")
        if command -v pnpm >/dev/null 2>&1; then
            echo "🚀 pnpm install --frozen-lockfile"
        else
            echo "⚠️  PNPM未安装，建议使用: npm ci"
        fi
        ;;
    "npm")
        echo "🚀 npm ci"
        ;;
    "yarn")
        if command -v yarn >/dev/null 2>&1; then
            echo "🚀 yarn install --frozen-lockfile"
        else
            echo "⚠️  Yarn未安装，建议使用: npm ci"
        fi
        ;;
    "none")
        echo "⚠️  无锁文件，建议使用: npm install 或 pnpm install"
        ;;
esac

# 环境变量输出
echo ""
echo "🌍 环境变量设置:"
echo "LOCKFILE_TYPE=$LOCKFILE_TYPE"

# 如果在GitHub Actions中，设置输出
if [ -n "$GITHUB_OUTPUT" ]; then
    echo "lockfile_type=$LOCKFILE_TYPE" >> $GITHUB_OUTPUT
    echo "has_lockfile=$([ "$LOCKFILE_TYPE" != "none" ] && echo "true" || echo "false")" >> $GITHUB_OUTPUT
fi

echo ""
echo "✅ 锁文件检查完成"
