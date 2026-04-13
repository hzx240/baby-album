#!/bin/bash

# ========================================
# 宝贝成长相册 - PostgreSQL 备份脚本
# ========================================
# 功能：
# 1. 每日自动全量备份
# 2. 备份保留策略（保留最近7天）
# 3. 备份验证
# 4. 压缩备份文件
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 环境变量（从 Docker Compose 传入）
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-babyuser}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-babypass}"
POSTGRES_DB="${POSTGRES_DB:-babyalbum}"

# 备份配置
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# ========================================
# 执行备份
# ========================================

log_info "开始 PostgreSQL 备份..."
log_info "数据库: ${POSTGRES_DB}"
log_info "备份文件: ${BACKUP_FILE}"

# 执行备份并压缩
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    2>&1 | tee >(cat >> "${LOG_FILE}") | gzip > "${BACKUP_FILE}"

# 检查备份是否成功
if [ $? -eq 0 ] && [ -f "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log_info "备份完成! 文件大小: ${BACKUP_SIZE}"

    # 验证备份文件
    log_info "验证备份文件..."
    gunzip -t "${BACKUP_FILE}"

    if [ $? -eq 0 ]; then
        log_info "备份验证成功!"
    else
        log_error "备份验证失败!"
        exit 1
    fi
else
    log_error "备份失败!"
    exit 1
fi

# ========================================
# 清理旧备份
# ========================================

log_info "清理 ${RETENTION_DAYS} 天前的旧备份..."

# 查找并删除旧备份
OLD_BACKUPS=$(find "${BACKUP_DIR}" -name "postgres_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -type f)

if [ -n "${OLD_BACKUPS}" ]; then
    echo "${OLD_BACKUPS}" | while read -r old_backup; do
        log_warn "删除旧备份: ${old_backup}"
        rm -f "${old_backup}"
    done
    log_info "清理完成!"
else
    log_info "没有需要清理的旧备份"
fi

# ========================================
# 列出当前备份
# ========================================

log_info "当前备份文件列表:"
ls -lh "${BACKUP_DIR}"/postgres_backup_*.sql.gz 2>/dev/null || log_warn "没有找到备份文件"

log_info "备份任务完成!"
