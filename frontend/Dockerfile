# ========================================
# Stage 1: Builder - 构建前端应用
# ========================================
FROM node:18-alpine AS builder

# 设置构建参数
ARG NODE_VERSION=18
ARG BUILD_DATE
ARG VCS_REF
ARG VITE_API_URL=/api

# 添加镜像标签
LABEL org.opencontainers.image.title="Baby Album Frontend" \
      org.opencontainers.image.description="Baby Growth Album Frontend Service" \
      org.opencontainers.image.vendor="Baby Album Team" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}"

# 设置工作目录
WORKDIR /app

# 复制 package 文件（优先使用 Docker 缓存）
COPY package.json package-lock.json ./

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# 复制源代码
COPY . .

# 设置构建时环境变量
ENV VITE_API_URL=${VITE_API_URL}

# 构建生产版本
RUN npm run build && \
    # 验证构建输出
    ls -la dist/ && \
    # 计算 index.html hash 用于缓存破坏
    sha256sum dist/index.html > dist/index.html.sha256

# ========================================
# Stage 2: Runner - Nginx 静态文件服务
# ========================================
FROM nginx:1.25-alpine AS runner

# 安装必要工具
RUN apk add --no-cache \
    curl \
    tini && \
    rm -rf /var/cache/apk/*

# 创建非 root 用户
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /usr/share/nginx/html -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# 删除默认的 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从 builder 阶段复制构建产物
COPY --from=builder --chown=nginx-user:nginx-user /app/dist /usr/share/nginx/html

# 设置权限
RUN chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    chown -R nginx-user:nginx-user /var/run && \
    touch /var/run/nginx.pid && \
    chown nginx-user:nginx-user /var/run/nginx.pid

# 切换到非 root 用户
USER nginx-user

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# 使用 tini 作为 init 进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动 nginx（使用前台模式）
CMD ["nginx", "-g", "daemon off;"]
