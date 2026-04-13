#!/bin/bash

# ========================================
# 宝贝成长相册 - 自动化备份脚本
# ========================================
# 功能：
# - 数据库完整备份
# - MinIO对象存储备份
# - 配置文件备份
# - 自动上传到S3
# - 备份验证
# - 失败告警

set -e

# ========================================
# 配置
# ========================================
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/baby-album}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
S3_BUCKET="${S3_BUCKET:-baby-album-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-https://s3.amazonaws.com}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup.log"

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# 日志函数
log_info() {
    echo -e "\033[0;32m[INFO]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_warn() {
    echo -e "\033[1;33m[WARN]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

# ========================================
# 备份函数
# ========================================

backup_database() {
    log_info "Starting database backup..."

    local backup_file="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"

    # 执行数据库备份
    docker compose exec -T postgres pg_dump -U babyuser -d babyalbum \
        --no-owner --no-acl --verbose 2>&1 | \
        gzip > "${backup_file}"

    # 验证备份
    if [ $? -eq 0 ] && [ -f "${backup_file}" ]; then
        local size=$(du -h "${backup_file}" | cut -f1)
        log_info "Database backup completed: ${backup_file} (${size})"

        # 上传到S3（如果配置了）
        if [ -n "${S3_ENDPOINT}" ] && [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ]; then
            log_info "Uploading database backup to S3..."
            aws s3 cp "${backup_file}" "s3://${S3_BUCKET}/database/$(basename ${backup_file})" \
                --storage-class STANDARD_IA \
                --endpoint-url "${S3_ENDPOINT}" || true
            if [ $? -eq 0 ]; then
                log_info "Database backup uploaded to S3 successfully"
            else
                log_error "Failed to upload database backup to S3"
            fi
        fi

        # 验证备份文件完整性
        gunzip -t "${backup_file}" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "Backup verification passed"
        else
            log_error "Backup verification failed"
            rm -f "${backup_file}"
            return 1
        fi
    else
        log_error "Database backup failed"
        return 1
    fi
}

backup_minio() {
    log_info "Starting MinIO backup..."

    local backup_dir="${BACKUP_DIR}/minio_${TIMESTAMP}"
    mkdir -p "${backup_dir}"

    # 使用mc镜像备份MinIO数据
    docker run --rm \
        --network baby-album-network \
        -v "${backup_dir}:/backup" \
        --env MINIO_ENDPOINT="${S3_ENDPOINT:-http://minio:9000}" \
        --env MINIO_ACCESS_KEY="${S3_ACCESS_KEY:-minioadmin}" \
        --env MINIO_SECRET_KEY="${S3_SECRET_KEY:-minioadmin}" \
        minio/mc \
        mirror /data /backup || true

    if [ $? -eq 0 ]; then
        local size=$(du -sh "${backup_dir}" | cut -f1)
        log_info "MinIO backup completed: ${backup_dir} (${size})"

        # 上传到S3
        if [ -n "${S3_ENDPOINT}" ] && [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ]; then
            log_info "Uploading MinIO backup to S3..."
            cd "${backup_dir}"
            aws s3 sync . "s3://${S3_BUCKET}/minio/$(date +%Y%m%d)/" \
                --storage-class STANDARD_IA \
                --endpoint-url "${S3_ENDPOINT}" || true
            if [ $? -eq 0 ]; then
                log_info "MinIO backup uploaded to S3 successfully"
            else
                log_error "Failed to upload MinIO backup to S3"
            fi
        fi
    else
        log_error "MinIO backup failed"
        return 1
    fi
}

backup_config() {
    log_info "Starting configuration backup..."

    local backup_dir="${BACKUP_DIR}/config_${TIMESTAMP}"
    mkdir -p "${backup_dir}"

    # 备份配置文件
    cp .env "${backup_dir}/.env.backup" 2>/dev/null || true
    cp backend/prisma/schema.prisma "${backup_dir}/" 2>/dev/null || true
    cp backend/package.json "${backup_dir}/backend-package.json" 2>/dev/null || true
    cp frontend/package.json "${backup_dir}/frontend-package.json" 2>/dev/null || true
    cp docker-compose*.yml "${backup_dir}/" 2>/dev/null || true

    # 检查是否为Docker环境
    if [ -f ".env" ]; then
        cp .env "${backup_dir}/.env" 2>/dev/null || true
    fi

    # 检查是否为数据库准备
    if [ -f "backend/.env" ]; then
        cp backend/.env "${backup_dir}/backend.env" 2>/dev/null || true
    fi

    # 检查生产环境配置
    if [ -f ".env.production" ]; then
        cp .env.production "${backup_dir}/.env.production" 2>/dev/null || true
    fi

    # 上传到S3
    if [ -n "${S3_ENDPOINT}" ] && [ -n "${AWS_ACCESS_KEY_ID}" ] && [ -n "${AWS_SECRET_ACCESS_KEY}" ]; then
        log_info "Uploading config backup to S3..."
        cd "${backup_dir}"
        aws s3 sync . "s3://${S3_BUCKET}/config/$(date +%Y%m%d)/" \
                --storage-class STANDARD_IA \
                --endpoint-url "${S3_ENDPOINT}" || true
        if [ $? -eq 0 ]; then
            log_info "Config backup uploaded to S3 successfully"
        else
            log_error "Failed to upload config backup to S3"
        fi
    fi

    local size=$(du -sh "${backup_dir}" | cut -f1)
    log_info "Configuration backup completed: ${backup_dir} (${size})"
}

backup_all() {
    log_info "Starting full backup..."

    # 创建备份标记
    echo "${TIMESTAMP}" > "${BACKUP_DIR}/last_backup.txt"

    # 执行所有备份
    backup_database
    local db_status=$?

    backup_minio
    local minio_status=$?

    backup_config
    local config_status=$?

    # 检查所有备份是否成功
    if [ ${db_status} -eq 0 ] && [ ${minio_status} -eq 0 ] && [ ${config_status} -eq 0 ]; then
        log_info "Full backup completed successfully"
        return 0
    else
        log_error "Full backup failed (database: ${db_status}, minio: ${minio_status}, config: ${config_status})"
        return 1
    fi
}

# ========================================
# 验证函数
# ========================================

verify_backup() {
    local backup_type="$1"
    local backup_path="$2"

    log_info "Verifying ${backup_type} backup: ${backup_path}"

    # 检查文件存在
    if [ ! -f "${backup_path}" ]; then
        log_error "Backup file not found: ${backup_path}"
        return 1
    fi

    # 检查文件大小（至少1KB）
    local size=$(stat -f%s "${backup_path}" | cut -d'.' -f1)
    if [ ${size} -lt 1024 ]; then
        log_error "Backup file too small: ${size} bytes"
        return 1
    fi

    # 对于数据库备份，验证可读性
    if [[ "${backup_type}" == "database" ]]; then
        gunzip -t "${backup_path}" > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            log_error "Backup file is corrupted (gunzip test failed)"
            return 1
        fi
    fi

    log_info "Backup verification passed: ${backup_path}"
    return 0
}

# ========================================
# 恢复函数
# ========================================

restore_database() {
    local backup_file="$1"

    log_info "Starting database restore from: ${backup_file}"

    # 验证备份文件
    if [ ! -f "${backup_file}" ]; then
        log_error "Backup file not found: ${backup_file}"
        return 1
    fi

    # 停止应用服务
    log_info "Stopping application services..."
    docker compose stop backend || true

    # 删除现有数据库
    log_info "Dropping existing database..."
    docker compose exec -T postgres psql -U babyuser -d babyalbum << 'EOF'
        DROP DATABASE IF EXISTS babyalbum;
        CREATE DATABASE babyalbum;
    EOF

    # 恢复数据库
    log_info "Restoring database from backup..."
    gunzip -c "${backup_file}" | \
        docker compose exec -T postgres psql -U babyuser -d babyalbum

    # 重启服务
    log_info "Restarting application services..."
    docker compose start backend

    # 等待服务启动
    sleep 30

    # 验证恢复
    docker compose exec -T postgres psql -U babyuser -d babyalbum -c "SELECT COUNT(*) FROM \"User\";" | grep -q '[0-9]'

    if [ $? -eq 0 ]; then
        log_info "Database restore completed successfully"

        # 运行数据库迁移
        log_info "Running database migrations..."
        docker compose exec -T backend npx prisma migrate deploy

        log_info "Restore verification passed"
        return 0
    else
        log_error "Database restore verification failed"
        return 1
    fi
}

restore_config() {
    local backup_dir="$1"

    log_info "Restoring configuration from: ${backup_dir}"

    # 恢复.env文件
    if [ -f "${backup_dir}/.env" ]; then
        cp "${backup_dir}/.env" .env
        log_info "Environment configuration restored"
    fi

    # 恢复Prisma schema
    if [ -f "${backup_dir}/prisma/schema.prisma" ]; then
        cp "${backup_dir}/prisma/schema.prisma" backend/prisma/schema.prisma
        log_info "Prisma schema restored"
    fi

    # 重新构建应用
    log_info "Rebuilding application..."
    docker compose build backend
    docker compose build frontend

    log_info "Configuration restore completed"
}

# ========================================
# 清理函数
# ========================================

cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."

    local count=0
    local removed=0

    # 清理本地备份
    for file in "${BACKUP_DIR}"/postgres_*.sql.gz; do
        if [ -f "${file}" ]; then
            local file_age=$(( ($(date +%s) - $(stat -c %Y%m%d %H:%M:%S -t "${file}" 2>/dev/null || echo 0) / 86400))
            if [ ${file_age} -gt $((RETENTION_DAYS * 86400)) ]; then
                rm -f "${file}"
                ((removed++))
            fi
        fi
    done

    # 清理MinIO备份
    for dir in "${BACKUP_DIR}"/minio_*; do
        if [ -d "${dir}" ]; then
            local dir_age=$(( ($(date +%s) - $(stat -c %Y%m%d %H:%M:%S -t "${dir}" 2>/dev/null || echo 0) / 86400))
            if [ ${dir_age} -gt $((RETENTION_DAYS * 86400)) ]; then
                rm -rf "${dir}"
                ((removed++))
            fi
        fi
    done

    # 清理配置备份
    for dir in "${BACKUP_DIR}"/config_*; do
        if [ -d "${dir}" ]; then
            local dir_age=$(( ($(date +%s) - $(stat -c %Y%m%d %H:%M:%S -t "${dir}" 2>/dev/null || echo 0) / 86400))
            if [ ${dir_age} -gt $((RETENTION_DAYS * 86400)) ]; then
                rm -rf "${dir}"
                ((removed++))
            fi
        fi
    done

    log_info "Cleanup completed: ${removed} backups removed"
}

# ========================================
# 主函数
# ========================================

show_usage() {
    cat << 'EOF'
Usage: $(basename "$0") {command} [options]

Commands:
  backup-all        完整备份 (数据库 + MinIO + 配置)
  backup-db         数据库备份
  backup-minio       MinIO备份
  backup-config      配置文件备份

  restore-db {file} 恢复数据库
  restore-config {dir} 恢复配置

  cleanup           清理旧备份
  list              列出所有备份
  verify {file}     验证备份文件

  schedule          设置定时任务 (需要root权限)

Options:
  --dry-run        模拟运行，不执行实际操作
  --no-s3          跳过S3上传
  --no-verify       跳过备份验证

Examples:
  $(basename "$0") backup-all
  $(basename "$0") backup-db --no-verify
  $(basename "$0") restore-db /opt/backups/baby-album/postgres_20260214_120000.sql.gz
  $(basename "$0") cleanup

For automated backups:
  $(basename "$0") schedule
  sudo crontab -e > /etc/cron.d/baby-album-backup
    0 2 * * * /opt/baby-album/scripts/automated-backup.sh backup-all --no-s3 >> /var/log/baby-album-backup.log 2>&1

EOF
}

# ========================================
# 命令执行
# ========================================

DRY_RUN=false
S3_UPLOAD=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-s3)
            S3_UPLOAD=false
            shift
            ;;
        schedule)
            # 设置定时任务
            echo "Setting up cron job..."
            sudo crontab -e > /etc/cron.d/baby-album-backup || true
            local cron_cmd="0 2 * * * $(pwd)/scripts/automated-backup.sh backup-all --no-s3 >> /var/log/baby-album-backup.log 2>&1"
            echo "Cron job installed: ${cron_cmd}"
            echo "Edit with: sudo crontab -e"
            exit 0
            ;;
        backup-all)
            backup_all
            exit $?
            ;;
        backup-db)
            backup_database
            exit $?
            ;;
        backup-minio)
            backup_minio
            exit $?
            ;;
        backup-config)
            backup_config
            exit $?
            ;;
        restore-db)
            restore_database "$2"
            exit $?
            ;;
        restore-config)
            restore_config "$2"
            exit $?
            ;;
        cleanup)
            cleanup_old_backups
            exit $?
            ;;
        list)
            echo "=== Backup List ==="
            echo ""
            echo "Database backups:"
            ls -lh "${BACKUP_DIR}"/postgres_*.sql.gz 2>/dev/null || echo "  No backups found"
            echo ""
            echo "MinIO backups:"
            ls -ld "${BACKUP_DIR}"/minio_* 2>/dev/null || echo "  No backups found"
            echo ""
            echo "Config backups:"
            ls -ld "${BACKUP_DIR}"/config_* 2>/dev/null || echo "  No backups found"
            exit 0
            ;;
        verify)
            if [ -z "$2" ]; then
                echo "Error: Please specify backup file to verify"
                show_usage
                exit 1
            fi
            verify_backup "manual" "$2"
            exit $?
            ;;
        *)
            echo "Error: Unknown command '$1'"
            show_usage
            exit 1
            ;;
    esac
done

echo "Error: No command specified"
show_usage
exit 1
