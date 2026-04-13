#!/bin/bash

# ========================================
# 宝贝成长相册 - 备份与恢复脚本
# ========================================
# 功能：
# 1. 数据库完整备份
# 2. MinIO 数据备份
# 3. 完整恢复
# 4. 备份验证
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 配置
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# ========================================
# 数据库备份
# ========================================
backup_database() {
    log_info "开始数据库备份..."

    local backup_file="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql.gz"

    docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-babyuser}" \
        -d "${POSTGRES_DB:-babyalbum}" \
        --no-owner \
        --no-acl \
        --verbose \
        2>&1 | gzip > "${backup_file}"

    if [ $? -eq 0 ] && [ -f "${backup_file}" ]; then
        local backup_size=$(du -h "${backup_file}" | cut -f1)
        log_info "数据库备份完成! 文件: ${backup_file}, 大小: ${backup_size}"

        # 验证备份
        gunzip -t "${backup_file}" && log_info "备份验证成功" || log_error "备份验证失败"
    else
        log_error "数据库备份失败!"
        exit 1
    fi
}

# ========================================
# MinIO 备份
# ========================================
backup_minio() {
    log_info "开始 MinIO 数据备份..."

    local backup_dir="${BACKUP_DIR}/minio_backup_${TIMESTAMP}"
    mkdir -p "${backup_dir}"

    # 使用 mc 镜像数据
    docker run --rm \
        --network baby-album-network \
        -v "${backup_dir}:/backup" \
        --env MINIO_ENDPOINT=minio:9000 \
        --env MINIO_ACCESS_KEY="${S3_ACCESS_KEY:-minioadmin}" \
        --env MINIO_SECRET_KEY="${S3_SECRET_KEY:-minioadmin}" \
        minio/mc \
        mirror /data /backup || log_warn "MinIO 备份失败，继续..."

    log_info "MinIO 备份完成: ${backup_dir}"
}

# ========================================
# 完整备份
# ========================================
backup_all() {
    log_info "开始完整备份..."
    backup_database
    backup_minio
    log_info "完整备份完成!"
}

# ========================================
# 数据库恢复
# ========================================
restore_database() {
    local backup_file="$1"

    if [ -z "${backup_file}" ]; then
        log_error "请指定备份文件!"
        echo "用法: $0 restore-db <backup-file.sql.gz>"
        exit 1
    fi

    if [ ! -f "${backup_file}" ]; then
        log_error "备份文件不存在: ${backup_file}"
        exit 1
    fi

    log_warn "即将恢复数据库，现有数据将被覆盖!"
    read -p "确定要继续吗? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "操作已取消"
        exit 0
    fi

    log_info "开始恢复数据库..."

    gunzip -c "${backup_file}" | docker compose -f "${COMPOSE_FILE}" exec -T postgres psql \
        -U "${POSTGRES_USER:-babyuser}" \
        -d "${POSTGRES_DB:-babyalbum}" \
        --quiet

    if [ $? -eq 0 ]; then
        log_info "数据库恢复完成!"
    else
        log_error "数据库恢复失败!"
        exit 1
    fi
}

# ========================================
# 列出备份
# ========================================
list_backups() {
    log_info "备份文件列表:"

    echo ""
    echo "数据库备份:"
    ls -lh "${BACKUP_DIR}"/postgres_backup_*.sql.gz 2>/dev/null || log_warn "未找到数据库备份"

    echo ""
    echo "MinIO 备份:"
    ls -ld "${BACKUP_DIR}"/minio_backup_* 2>/dev/null || log_warn "未找到 MinIO 备份"
}

# ========================================
# 清理旧备份
# ========================================
cleanup_old_backups() {
    local retention_days="${1:-7}"

    log_info "清理 ${retention_days} 天前的旧备份..."

    # 清理数据库备份
    find "${BACKUP_DIR}" -name "postgres_backup_*.sql.gz" -mtime +${retention_days} -type f -exec rm -v {} \;

    # 清理 MinIO 备份
    find "${BACKUP_DIR}" -name "minio_backup_*" -mtime +${retention_days} -type d -exec rm -rfv {} \; 2>/dev/null || true

    log_info "清理完成!"
}

# ========================================
# 主函数
# ========================================
main() {
    case "$1" in
        db)
            backup_database
            ;;
        minio)
            backup_minio
            ;;
        all)
            backup_all
            ;;
        restore-db)
            restore_database "$2"
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_old_backups "$2"
            ;;
        *)
            echo "宝贝成长相册 - 备份与恢复脚本"
            echo ""
            echo "用法:"
            echo "  $0 db              备份数据库"
            echo "  $0 minio           备份 MinIO 数据"
            echo "  $0 all             完整备份 (数据库 + MinIO)"
            echo "  $0 restore-db      恢复数据库"
            echo "  $0 list            列出所有备份"
            echo "  $0 cleanup [days]  清理旧备份 (默认 7 天)"
            echo ""
            echo "示例:"
            echo "  $0 all                           # 完整备份"
            echo "  $0 restore-db backups/db.sql.gz  # 恢复数据库"
            echo "  $0 cleanup 30                    # 清理 30 天前的备份"
            exit 1
            ;;
    esac
}

main "$@"
