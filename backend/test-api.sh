#!/bin/bash

# API 测试脚本
# 后端服务器: http://localhost:3001

BASE_URL="http://localhost:3001"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local token=$5

    echo -e "\n${YELLOW}测试: ${name}${NC}"
    echo "请求: ${method} ${url}"

    if [ -n "$data" ]; then
        echo "数据: ${data}"
    fi

    if [ -n "$token" ]; then
        response=$(curl -s -X ${method} \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "${data}" \
            "${BASE_URL}${url}")
    else
        response=$(curl -s -X ${method} \
            -H "Content-Type: application/json" \
            -d "${data}" \
            "${BASE_URL}${url}")
    fi

    # 检查是否有错误
    if echo "$response" | grep -q '"statusCode":[45][0-9][0-9]'; then
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        ((FAILED++))
    else
        echo -e "${GREEN}✅ 成功${NC}"
        echo "响应: $response"
        ((PASSED++))
    fi
}

echo "========================================"
echo "   宝宝成长相册 API 测试"
echo "========================================"

# 1. 尝试登录获取 token（如果用户已存在）
echo -e "\n${YELLOW}=== 1. 用户认证 ===${NC}"

# 先尝试登录
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test1234"}' \
    "${BASE_URL}/api/api/v1/auth/login")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "用户不存在，尝试注册..."
    # 登录失败则注册
    REGISTER_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"test2@example.com","password":"Test1234","displayName":"测试用户"}' \
        "${BASE_URL}/api/api/v1/auth/register")

    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ 无法获取 Access Token，后续测试无法继续${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 已获取 Access Token: ${ACCESS_TOKEN:0:30}...${NC}"

# 2. 测试获取当前用户信息
test_api \
    "获取当前用户" \
    "GET" \
    "/api/api/v1/users/me" \
    "" \
    "$ACCESS_TOKEN"

# 2. 测试登录
test_api \
    "用户登录" \
    "POST" \
    "/api/api/v1/auth/login" \
    '{"email":"test@example.com","password":"Test1234"}'

# 3. 测试获取当前用户信息
test_api \
    "获取当前用户" \
    "GET" \
    "/api/api/v1/users/me" \
    "" \
    "$ACCESS_TOKEN"

# 4. 测试创建家庭
echo -e "\n${YELLOW}=== 2. 家庭管理 ===${NC}"

FAMILY_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -d '{"name":"测试家庭"}' \
    "${BASE_URL}/api/api/v1/families")

FAMILY_ID=$(echo "$FAMILY_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$FAMILY_ID" ]; then
    echo -e "${GREEN}家庭 ID: $FAMILY_ID${NC}"
else
    echo -e "${RED}❌ 无法获取家庭 ID${NC}"
fi

# 5. 测试获取家庭列表
test_api \
    "获取我的家庭列表" \
    "GET" \
    "/api/api/v1/families" \
    "" \
    "$ACCESS_TOKEN"

# 6. 测试获取家庭详情
if [ -n "$FAMILY_ID" ]; then
    test_api \
        "获取家庭详情" \
        "GET" \
        "/api/api/v1/families/${FAMILY_ID}" \
        "" \
        "$ACCESS_TOKEN"

    # 7. 测试切换家庭
    test_api \
        "切换当前家庭" \
        "POST" \
        "/api/api/v1/families/${FAMILY_ID}/switch" \
        "" \
        "$ACCESS_TOKEN"

    # 8. 测试获取家庭成员
    test_api \
        "获取家庭成员" \
        "GET" \
        "/api/api/v1/families/${FAMILY_ID}/members" \
        "" \
        "$ACCESS_TOKEN"

    # 9. 测试创建邀请
    echo -e "\n${YELLOW}=== 3. 邀请系统 ===${NC}"

    INVITE_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" \
        -d '{"role":"MEMBER","expiresInDays":7}' \
        "${BASE_URL}/api/api/v1/families/${FAMILY_ID}/invitations")

    INVITE_TOKEN=$(echo "$INVITE_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

    if [ -n "$INVITE_TOKEN" ]; then
        echo -e "${GREEN}邀请 Token: ${INVITE_TOKEN:0:20}...${NC}"

        # 10. 测试验证邀请
        test_api \
            "验证邀请" \
            "GET" \
            "/api/api/v1/invitations/validate?token=${INVITE_TOKEN}" \
            "" \
            ""

        # 11. 测试拒绝邀请
        test_api \
            "拒绝邀请" \
            "POST" \
            "/api/api/v1/invitations/reject" \
            "{\"token\":\"${INVITE_TOKEN}\"}" \
            "$ACCESS_TOKEN"
    fi

    # 12. 测试更新家庭信息
    test_api \
        "更新家庭名称" \
        "PATCH" \
        "/api/api/v1/families/${FAMILY_ID}" \
        '{"name":"测试家庭（已更新）"}' \
        "$ACCESS_TOKEN"
fi

# 测试结果总结
echo -e "\n========================================"
echo "   测试结果总结"
echo "========================================"
echo -e "${GREEN}✅ 通过: ${PASSED}${NC}"
echo -e "${RED}❌ 失败: ${FAILED}${NC}"
echo "总计: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 ${FAILED} 个测试失败${NC}"
    exit 1
fi
