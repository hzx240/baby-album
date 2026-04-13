# ========================================
# Stage 1: Base - 基础镜像
# ========================================
FROM node:18-alpine AS base

# 设置构建参数
ARG NODE_VERSION=18
ARG BUILD_DATE
ARG VCS_REF

# 添加镜像标签
LABEL org.opencontainers.image.title="Baby Album Backend" \
      org.opencontainers.image.description="Baby Growth Album Backend Service" \
      org.opencontainers.image.vendor="Baby Album Team" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}"

# 安装必要的系统依赖（合并层以减少镜像大小）
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl && \
    rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# ========================================
# Stage 2: Dependencies - 依赖安装
# ========================================
FROM base AS deps

# 复制 package 文件（利用 Docker 缓存层）
COPY package.json package-lock.json ./

# 设置 npm 镜像源（可选，用于加速）
# 生产环境建议使用官方源以确保包的完整性
RUN npm config set registry https://registry.npmmirror.com

# 安装所有依赖（包括 devDependencies，用于构建）
# 使用 npm ci 确保依赖版本一致性
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# ========================================
# Stage 3: Builder - 构建应用
# ========================================
FROM base AS builder

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码和配置文件
COPY . .

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# ========================================
# Stage 4: Production Dependencies - 生产依赖
# ========================================
FROM base AS production-deps

COPY package.json package-lock.json ./

# 只安装生产依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# ========================================
# Stage 5: Runner - 生产运行环境
# ========================================
FROM node:18-alpine AS runner

# 安全升级和安装必要工具
RUN apk add --no-cache tini curl && \
    apk upgrade --available && \
    rm -rf /var/cache/apk/*

# 设置 NODE_ENV 为生产环境
ENV NODE_ENV=production \
    PORT=3010 \
    NODE_OPTIONS="--max-old-space-size=512"

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 设置工作目录
WORKDIR /app

# 复制生产依赖
COPY --from=production-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# 复制 Prisma 相关文件
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# 复制构建产物
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# 设置文件权限
RUN chmod +x /app/node_modules/.bin/prisma 2>/dev/null || true

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3010

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3010/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 tini 作为 init 进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动命令
CMD ["node", "dist/main.js"]
