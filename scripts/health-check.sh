#!/bin/bash

# ========================================
# 宝贝成长相册 - 系统健康检查脚本
# ========================================
# 功能：
# 1. 检查所有服务状态
# 2. 验证服务连通性
# 3. 检查资源使用情况
# 4. 验证备份状态
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
PASS=0
FAIL=0
WARN=0

# 打印函数
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_pass() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASS++))
}

print_fail() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAIL++))
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARN++))
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# ========================================
# 1. Docker 环境检查
# ========================================
print_header "1. Docker 环境检查"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_pass "Docker 已安装: ${DOCKER_VERSION}"
else
    print_fail "Docker 未安装"
    exit 1
fi

if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    print_pass "Docker Compose 已安装: ${COMPOSE_VERSION}"
else
    print_fail "Docker Compose 未安装"
    exit 1
fi

# 检查 Docker 是否运行
if docker info &> /dev/null; then
    print_pass "Docker 服务运行中"
else
    print_fail "Docker 服务未运行"
    exit 1
fi

# ========================================
# 2. 配置文件检查
# ========================================
print_header "2. 配置文件检查"

if [ -f .env ]; then
    print_pass ".env 文件存在"

    # 检查关键配置
    if grep -q "your-super-secret-jwt-key-change-this-in-production" .env; then
        print_fail "JWT_SECRET 使用默认值，请修改！"
    else
        print_pass "JWT_SECRET 已配置"
    fi

    if grep -q "minioadmin" .env | grep -q "MINIO_ROOT_PASSWORD"; then
        print_warn "MINIO_ROOT_PASSWORD 使用默认值"
    else
        print_pass "MINIO_ROOT_PASSWORD 已配置"
    fi
else
    print_fail ".env 文件不存在"
fi

# ========================================
# 3. 容器状态检查
# ========================================
print_header "3. 容器状态检查"

SERVICES=("frontend" "backend" "postgres" "redis" "minio")
ALL_RUNNING=true

for service in "${SERVICES[@]}"; do
    CONTAINER_NAME="baby-album-${service}"

    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null || echo "no-healthcheck")

        if [ "${STATUS}" = "healthy" ] || [ "${STATUS}" = "no-healthcheck" ]; then
            print_pass "${service} 运行中"
        else
            print_fail "${service} 状态: ${STATUS}"
            ALL_RUNNING=false
        fi
    else
        print_fail "${service} 未运行"
        ALL_RUNNING=false
    fi
done

if [ "$ALL_RUNNING" = true ]; then
    print_pass "所有服务运行正常"
else
    print_fail "部分服务未运行"
fi

# ========================================
# 4. 端口连通性检查
# ========================================
print_header "4. 端口连通性检查"

check_port() {
    local host=$1
    local port=$2
    local service=$3

    if timeout 1 bash -c "cat < /dev/null > /dev/tcp/${host}/${port}" 2>/dev/null; then
        print_pass "${service} (${host}:${port}) 可访问"
        return 0
    else
        print_fail "${service} (${host}:${port}) 不可访问"
        return 1
    fi
}

check_port "localhost" "80" "前端服务"
check_port "localhost" "3010" "后端 API"
check_port "localhost" "5432" "PostgreSQL"
check_port "localhost" "6379" "Redis"
check_port "localhost" "9000" "MinIO API"
check_port "localhost" "9001" "MinIO Console"

# ========================================
# 5. API 健康检查
# ========================================
print_header "5. API 健康检查"

# 后端健康检查
BACKEND_HEALTH=$(curl -s http://localhost:3010/api/health 2>/dev/null || echo "failed")
if [ "${BACKEND_HEALTH}" != "failed" ]; then
    print_pass "后端 API 健康检查通过"
    print_info "响应: ${BACKEND_HEALTH}"
else
    print_fail "后端 API 健康检查失败"
fi

# 前端健康检查
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
if [ "${FRONTEND_HEALTH}" = "200" ]; then
    print_pass "前端健康检查通过"
else
    print_fail "前端健康检查失败 (HTTP ${FRONTEND_HEALTH})"
fi

# ========================================
# 6. 资源使用检查
# ========================================
print_header "6. 资源使用检查"

# CPU 使用率
print_info "容器资源使用情况:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -6

# 磁盘使用
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
print_info "磁盘使用率: ${DISK_USAGE}%"

if [ "${DISK_USAGE}" -gt 80 ]; then
    print_warn "磁盘使用率超过80%"
elif [ "${DISK_USAGE}" -gt 90 ]; then
    print_fail "磁盘使用率超过90%，需要清理！"
else
    print_pass "磁盘使用率正常"
fi

# Docker 磁盘使用
DOCKER_DISK=$(docker system df --format "{{.Size}}" | grep -v "0B" | head -1)
print_info "Docker 数据占用: ${DOCKER_DISK}"

# ========================================
# 7. 数据库连接检查
# ========================================
print_header "7. 数据库连接检查"

DB_CHECK=$(docker-compose exec -T postgres pg_isready -U babyuser 2>/dev/null || echo "failed")
if echo "${DB_CHECK}" | grep -q "accepting connections"; then
    print_pass "PostgreSQL 连接正常"

    # 检查连接数
    CONN_COUNT=$(docker-compose exec -T postgres psql -U babyuser -d babyalbum -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "0")
    print_info "当前数据库连接数: ${CONN_COUNT}"
else
    print_fail "PostgreSQL 连接失败"
fi

# ========================================
# 8. Redis 连接检查
# ========================================
print_header "8. Redis 连接检查"

REDIS_PING=$(docker-compose exec -T redis redis-cli ping 2>/dev/null || echo "failed")
if [ "${REDIS_PING}" = "PONG" ]; then
    print_pass "Redis 连接正常"

    # 获取 Redis 信息
    REDIS_KEYS=$(docker-compose exec -T redis redis-cli DBSIZE 2>/dev/null || echo "0")
    print_info "Redis 键数量: ${REDIS_KEYS}"
else
    print_fail "Redis 连接失败"
fi

# ========================================
# 9. MinIO 检查
# ========================================
print_header "9. MinIO 检查"

MINIO_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/minio/health/live 2>/dev/null || echo "000")
if [ "${MINIO_HEALTH}" = "200" ]; then
    print_pass "MinIO API 可访问"
else
    print_fail "MinIO API 不可访问"
fi

# ========================================
# 10. 日志错误检查
# ========================================
print_header "10. 最近的错误日志"

print_info "后端错误（最近10条）:"
docker-compose logs --tail=100 backend 2>/dev/null | grep -i "error" | tail -5 || print_pass "未发现错误日志"

print_info "前端错误（最近10条）:"
docker-compose logs --tail=100 frontend 2>/dev/null | grep -i "error" | tail -5 || print_pass "未发现错误日志"

# ========================================
# 11. 备份检查
# ========================================
print_header "11. 备份状态检查"

BACKUP_DIR="./backups"
if [ -d "${BACKUP_DIR}" ]; then
    BACKUP_COUNT=$(ls -1 ${BACKUP_DIR}/postgres_backup_*.sql.gz 2>/dev/null | wc -l)
    LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/postgres_backup_*.sql.gz 2>/dev/null | head -1)

    if [ "${BACKUP_COUNT}" -gt 0 ]; then
        print_pass "找到 ${BACKUP_COUNT} 个备份文件"
        print_info "最新备份: $(basename ${LATEST_BACKUP})"

        # 检查备份是否是最近的（24小时内）
        if [ -n "${LATEST_BACKUP}" ]; then
            BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "${LATEST_BACKUP}")) / 86400 ))
            if [ "${BACKUP_AGE}" -lt 2 ]; then
                print_pass "备份是最新的（${BACKUP_AGE} 天前）"
            else
                print_warn "备份已过期（${BACKUP_AGE} 天前）"
            fi
        fi
    else
        print_warn "未找到备份文件"
    fi
else
    print_warn "备份目录不存在"
fi

# ========================================
# 总结
# ========================================
print_header "健康检查总结"

echo -e "${GREEN}通过: ${PASS}${NC}"
echo -e "${YELLOW}警告: ${WARN}${NC}"
echo -e "${RED}失败: ${FAIL}${NC}"

if [ "${FAIL}" -eq 0 ]; then
    echo -e "\n${GREEN}✓ 系统运行正常！${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ 发现 ${FAIL} 个问题需要修复！${NC}\n"
    exit 1
fi
