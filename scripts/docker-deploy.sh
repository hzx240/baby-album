#!/bin/bash

# 宝贝成长相册 - Docker 部署脚本
# 使用方法：
#   ./scripts/docker-deploy.sh dev     # 开发环境
#   ./scripts/docker-deploy.sh prod    # 生产环境
#   ./scripts/docker-deploy.sh stop    # 停止服务
#   ./scripts/docker-deploy.sh logs    # 查看日志

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 使用 docker compose 还是 docker-compose
DOCKER_COMPOSE="docker compose"
if ! docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
fi

# 开发环境部署
deploy_dev() {
    info "启动开发环境..."

    # 检查 .env 文件
    if [ ! -f .env ]; then
        warn ".env 文件不存在，使用默认配置"
    fi

    # 构建并启动开发环境
    $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml up -d

    info "✅ 开发环境启动成功！"
    info "前端地址: http://localhost:5173"
    info "后端地址: http://localhost:3001"
    info "MinIO 控制台: http://localhost:9001"
}

# 生产环境部署
deploy_prod() {
    info "启动生产环境..."

    # 检查 .env 文件
    if [ ! -f .env ]; then
        error "生产环境需要 .env 文件！"
        info "请创建 .env 文件并设置以下环境变量："
        info "  - POSTGRES_USER"
        info "  - POSTGRES_PASSWORD"
        info "  - POSTGRES_DB"
        info "  - JWT_SECRET"
        info "  - MINIO_ROOT_USER"
        info "  - MINIO_ROOT_PASSWORD"
        exit 1
    fi

    # 构建并启动生产环境
    $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.prod.yml up -d

    info "✅ 生产环境启动成功！"
    info "前端地址: http://localhost"
    info "后端地址: http://localhost:3001"
    info "MinIO 控制台: http://localhost:9001"

    # 运行数据库迁移
    info "运行数据库迁移..."
    docker-compose exec backend npx prisma migrate deploy
}

# 停止服务
stop_services() {
    info "停止所有服务..."
    $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.prod.yml down
    info "✅ 服务已停止"
}

# 查看日志
view_logs() {
    $DOCKER_COMPOSE -f docker-compose.yml logs -f
}

# 重启服务
restart_services() {
    info "重启服务..."
    $DOCKER_COMPOSE -f docker-compose.yml restart
    info "✅ 服务已重启"
}

# 清理数据（危险操作）
clean_data() {
    warn "⚠️  这将删除所有数据，包括数据库、上传的文件等！"
    read -p "确定要继续吗？(yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        info "操作已取消"
        exit 0
    fi

    info "停止服务..."
    $DOCKER_COMPOSE -f docker-compose.yml down

    info "删除数据卷..."
    docker volume rm baby-album-postgres-data baby-album-minio-data baby-album-redis-data

    info "✅ 数据已清理"
}

# 主函数
main() {
    check_docker

    case "$1" in
        dev)
            deploy_dev
            ;;
        prod)
            deploy_prod
            ;;
        stop)
            stop_services
            ;;
        logs)
            view_logs
            ;;
        restart)
            restart_services
            ;;
        clean)
            clean_data
            ;;
        *)
            echo "宝贝成长相册 - Docker 部署脚本"
            echo ""
            echo "使用方法："
            echo "  $0 dev     启动开发环境"
            echo "  $0 prod    启动生产环境"
            echo "  $0 stop    停止服务"
            echo "  $0 logs    查看日志"
            echo "  $0 restart 重启服务"
            echo "  $0 clean   清理所有数据（危险操作）"
            exit 1
            ;;
    esac
}

main "$@"
