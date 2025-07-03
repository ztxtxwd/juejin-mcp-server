# 使用官方 Node.js 运行时作为基础镜像
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装 dumb-init 用于信号处理
RUN apk add --no-cache dumb-init

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S juejin -u 1001

# 依赖安装阶段
FROM base AS deps

# 复制 package 文件和 pnpm 锁文件
COPY package.json pnpm-lock.yaml ./

# 安装所有依赖（跳过 prepare 脚本，因为还没有源代码）
RUN pnpm install --frozen-lockfile --ignore-scripts

# 构建阶段
FROM base AS builder

# 从依赖阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 复制源代码
COPY . .

# 构建项目
RUN pnpm run build

# 生产阶段
FROM base AS runner

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 复制 package 文件和 pnpm 锁文件
COPY package.json pnpm-lock.yaml ./

# 只安装生产依赖（跳过脚本，因为我们已经有构建产物了）
RUN pnpm install --frozen-lockfile --prod --ignore-scripts && pnpm store prune

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 复制必要文件
COPY --from=builder /app/README.md ./
COPY --from=builder /app/docs ./docs

# 更改文件所有者
RUN chown -R juejin:nodejs /app
USER juejin

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/index.js --help >/dev/null || exit 1

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
