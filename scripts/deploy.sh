#!/bin/bash
# ========================================
# 自动化部署脚本
# ========================================
# 用于CI/CD流程中的自动化部署

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的环境变量
check_env() {
    log_info "检查环境变量..."

    required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "REDIS_PASSWORD"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "环境变量 $var 未设置"
            exit 1
        fi
    done

    log_info "环境变量检查通过"
}

# 备份数据库
backup_database() {
    log_info "备份数据库..."

    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"

    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

    docker-compose exec -T postgres pg_dump -U "${POSTGRES_USER:-babyuser}" "${POSTGRES_DB:-babyalbum}" > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        log_info "数据库备份成功: $BACKUP_FILE"
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# 拉取最新代码
pull_code() {
    log_info "拉取最新代码..."

    git fetch origin
    git pull origin main

    log_info "代码更新完成"
}

# 构建Docker镜像
build_images() {
    log_info "构建Docker镜像..."

    docker-compose build --no-cache

    if [ $? -eq 0 ]; then
        log_info "镜像构建成功"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 运行数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."

    docker-compose exec -T backend npx prisma migrate deploy

    if [ $? -eq 0 ]; then
        log_info "数据库迁移成功"
    else
        log_error "数据库迁移失败"
        exit 1
    fi
}

# 滚动更新服务
rolling_update() {
    log_info "开始滚动更新..."

    # 更新后端
    log_info "更新后端服务..."
    docker-compose up -d --no-deps --build backend

    # 等待后端健康检查
    log_info "等待后端服务就绪..."
    sleep 10

    # 检查后端健康状态
    for i in {1..30}; do
        if curl -f http://localhost:3010/api/health > /dev/null 2>&1; then
            log_info "后端服务就绪"
            break
        fi

        if [ $i -eq 30 ]; then
            log_error "后端服务启动超时"
            exit 1
        fi

        sleep 2
    done

    # 更新前端
    log_info "更新前端服务..."
    docker-compose up -d --no-deps --build frontend

    log_info "滚动更新完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    # 检查后端
    if curl -f http://localhost:3010/api/health > /dev/null 2>&1; then
        log_info "后端健康检查通过"
    else
        log_error "后端健康检查失败"
        return 1
    fi

    # 检查前端
    if curl -f http://localhost/ > /dev/null 2>&1; then
        log_info "前端健康检查通过"
    else
        log_error "前端健康检查失败"
        return 1
    fi

    # 检查数据库
    if docker-compose exec -T postgres pg_isready -U "${POSTGRES_USER:-babyuser}" > /dev/null 2>&1; then
        log_info "数据库健康检查通过"
    else
        log_error "数据库健康检查失败"
        return 1
    fi

    # 检查Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_info "Redis健康检查通过"
    else
        log_error "Redis健康检查失败"
        return 1
    fi

    log_info "所有服务健康检查通过"
    return 0
}

# 回滚
rollback() {
    log_warn "开始回滚..."

    # 停止当前服务
    docker-compose down

    # 恢复数据库
    if [ -n "$1" ]; then
        log_info "恢复数据库: $1"
        docker-compose exec -T postgres psql -U "${POSTGRES_USER:-babyuser}" "${POSTGRES_DB:-babyalbum}" < "$1"
    fi

    # 使用旧版本镜像
    git checkout HEAD~1
    docker-compose build
    docker-compose up -d

    log_warn "回滚完成"
}

# 清理旧镜像
cleanup() {
    log_info "清理旧镜像..."

    docker image prune -f

    log_info "清理完成"
}

# 主函数
main() {
    log_info "========================================="
    log_info "开始自动化部署"
    log_info "========================================="

    # 检查环境变量
    check_env

    # 备份数据库
    backup_database
    BACKUP_FILE=$(ls -t ./backups/*.sql | head -1)

    # 拉取最新代码
    pull_code

    # 构建镜像
    build_images

    # 运行迁移
    run_migrations

    # 滚动更新
    rolling_update

    # 健康检查
    if health_check; then
        log_info "========================================="
        log_info "部署成功！"
        log_info "========================================="

        # 清理旧镜像
        cleanup
    else
        log_error "健康检查失败，开始回滚..."
        rollback "$BACKUP_FILE"
        exit 1
    fi
}

# 执行主函数
main "$@"
