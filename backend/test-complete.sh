#!/bin/bash

# 完整的 API 测试脚本
# 测试所有模块、权限控制和错误场景

BASE_URL="http://localhost:3001"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试结果统计
PASSED=0
FAILED=0

# 存储 tokens 和 IDs
USER1_TOKEN=""
USER2_TOKEN=""
FAMILY_ID=""
INVITE_TOKEN=""

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local token=$5
    local expect_error=$6

    echo -e "\n${BLUE}▶ ${name}${NC}"
    echo "${method} ${url}"

    if [ -n "$data" ]; then
        echo "Body: ${data}"
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

    # 检查结果
    has_error=$(echo "$response" | grep -o '"statusCode":[45][0-9][0-9]')

    if [ -n "$expect_error" ]; then
        # 期望错误
        if [ -n "$has_error" ]; then
            echo -e "${GREEN}✅ 成功（预期错误）${NC}"
            error_msg=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
            echo "错误信息: $error_msg"
            ((PASSED++))
        else
            echo -e "${RED}❌ 失败（应该返回错误但没有）${NC}"
            echo "响应: $response"
            ((FAILED++))
        fi
    else
        # 期望成功
        if [ -n "$has_error" ]; then
            echo -e "${RED}❌ 失败${NC}"
            error_msg=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
            echo "错误: $error_msg"
            ((FAILED++))
        else
            echo -e "${GREEN}✅ 成功${NC}"
            echo "响应: $response"
            ((PASSED++))
        fi
    fi

    echo "$response"
}

echo "========================================"
echo "   宝宝成长相册 - 完整 API 测试"
echo "========================================"

# ========================================
# 阶段 1: 用户认证测试
# ========================================
echo -e "\n${YELLOW}========== 阶段 1: 用户认证 ==========${NC}"

# 注册用户1
echo -e "\n${BLUE}注册测试用户1...${NC}"
USER1_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"user1@test.com","password":"Test1234","displayName":"用户1"}' \
    "${BASE_URL}/api/api/v1/auth/register")

USER1_TOKEN=$(echo "$USER1_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
USER1_ID=$(echo "$USER1_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}用户1 Token: ${USER1_TOKEN:0:30}...${NC}"
echo -e "${GREEN}用户1 ID: $USER1_ID${NC}"

# 注册用户2
echo -e "\n${BLUE}注册测试用户2...${NC}"
USER2_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"user2@test.com","password":"Test1234","displayName":"用户2"}' \
    "${BASE_URL}/api/api/v1/auth/register")

USER2_TOKEN=$(echo "$USER2_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
USER2_ID=$(echo "$USER2_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}用户2 Token: ${USER2_TOKEN:0:30}...${NC}"
echo -e "${GREEN}用户2 ID: $USER2_ID${NC}"

# ========================================
# 阶段 2: 家庭管理测试
# ========================================
echo -e "\n${YELLOW}========== 阶段 2: 家庭管理 ==========${NC}"

# 用户1创建家庭
echo -e "\n${BLUE}用户1创建家庭...${NC}"
FAMILY_RESPONSE=$(test_api \
    "创建家庭" \
    "POST" \
    "/api/api/v1/families" \
    '{"name":"测试家庭A"}' \
    "$USER1_TOKEN" \
    "")

FAMILY_ID=$(echo "$FAMILY_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo -e "${GREEN}家庭 ID: $FAMILY_ID${NC}"

# 获取家庭列表
test_api \
    "获取我的家庭列表" \
    "GET" \
    "/api/api/v1/families" \
    "" \
    "$USER1_TOKEN" \
    ""

# 切换家庭
test_api \
    "切换当前家庭" \
    "POST" \
    "/api/api/v1/families/${FAMILY_ID}/switch" \
    "" \
    "$USER1_TOKEN" \
    ""

# ========================================
# 阶段 3: 邀请系统测试
# ========================================
echo -e "\n${YELLOW}========== 阶段 3: 邀请系统 ==========${NC}"

# 创建邀请
echo -e "\n${BLUE}创建邀请...${NC}"
INVITE_RESPONSE=$(test_api \
    "创建邀请" \
    "POST" \
    "/api/api/v1/families/${FAMILY_ID}/invitations" \
    '{"role":"MEMBER","expiresInDays":7}' \
    "$USER1_TOKEN" \
    "")

INVITE_TOKEN=$(echo "$INVITE_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -1)
echo -e "${GREEN}邀请 Token: ${INVITE_TOKEN:0:30}...${NC}"

# 验证邀请
test_api \
    "验证邀请" \
    "GET" \
    "/api/api/v1/invitations/validate?token=${INVITE_TOKEN}" \
    "" \
    "" \
    ""

# 用户2接受邀请
test_api \
    "接受邀请" \
    "POST" \
    "/api/api/v1/invitations/accept" \
    "{\"token\":\"${INVITE_TOKEN}\"}" \
    "$USER2_TOKEN" \
    ""

# 用户2切换到这个家庭
test_api \
    "用户2切换家庭" \
    "POST" \
    "/api/api/v1/families/${FAMILY_ID}/switch" \
    "" \
    "$USER2_TOKEN" \
    ""

# 获取家庭成员
test_api \
    "获取家庭成员" \
    "GET" \
    "/api/api/v1/families/${FAMILY_ID}/members" \
    "" \
    "$USER1_TOKEN" \
    ""

# ========================================
# 阶段 4: RBAC 权限测试
# ========================================
echo -e "\n${YELLOW}========== 阶段 4: RBAC 权限控制 ==========${NC}"

# 测试: OWNER 可以删除家庭
echo -e "\n${BLUE}测试 OWNER 权限...${NC}"
# 创建另一个家庭用于删除测试
DELETE_FAMILY_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${USER1_TOKEN}" \
    -d '{"name":"待删除家庭"}' \
    "${BASE_URL}/api/api/v1/families")

DELETE_FAMILY_ID=$(echo "$DELETE_FAMILY_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

test_api \
    "OWNER 删除家庭" \
    "DELETE" \
    "/api/api/v1/families/${DELETE_FAMILY_ID}" \
    "" \
    "$USER1_TOKEN" \
    ""

# 测试: MEMBER 不能删除家庭
test_api \
    "MEMBER 删除家庭（应失败）" \
    "DELETE" \
    "/api/api/v1/families/${FAMILY_ID}" \
    "" \
    "$USER2_TOKEN" \
    "error"

# 测试: MEMBER 不能修改家庭信息
test_api \
    "MEMBER 修改家庭（应失败）" \
    "PATCH" \
    "/api/api/v1/families/${FAMILY_ID}" \
    '{"name":"尝试修改"}' \
    "$USER2_TOKEN" \
    "error"

# 测试: MEMBER 不能添加成员
test_api \
    "MEMBER 添加成员（应失败）" \
    "POST" \
    "/api/api/v1/families/${FAMILY_ID}/members" \
    "{\"userId\":\"${USER1_ID}\",\"role\":\"MEMBER\"}" \
    "$USER2_TOKEN" \
    "error"

# ========================================
# 阶段 5: 错误场景测试
# ========================================
echo -e "\n${YELLOW}========== 阶段 5: 错误场景 ==========${NC}"

# 未认证访问
test_api \
    "未认证访问（应失败）" \
    "GET" \
    "/api/api/v1/users/me" \
    "" \
    "" \
    "error"

# 无效 token
test_api \
    "无效 token（应失败）" \
    "GET" \
    "/api/api/v1/users/me" \
    "" \
    "invalid_token_12345" \
    "error"

# 重复注册
test_api \
    "重复注册（应失败）" \
    "POST" \
    "/api/api/v1/auth/register" \
    '{"email":"user1@test.com","password":"Test1234","displayName":"用户1"}' \
    "" \
    "error"

# 错误密码登录
test_api \
    "错误密码登录（应失败）" \
    "POST" \
    "/api/api/v1/auth/login" \
    '{"email":"user1@test.com","password":"WrongPassword"}' \
    "" \
    "error"

# 访问不存在的家庭
test_api \
    "访问不存在的家庭（应失败）" \
    "GET" \
    "/api/api/v1/families/non-existent-id" \
    "" \
    "$USER1_TOKEN" \
    "error"

# 接受无效的邀请码
test_api \
    "接受无效邀请（应失败）" \
    "POST" \
    "/api/api/v1/invitations/accept" \
    '{"token":"invalid_invite_token"}' \
    "$USER2_TOKEN" \
    "error"

# 尝试设置 OWNER 角色（应失败）
test_api \
    "添加 OWNER 成员（应失败）" \
    "POST" \
    "/api/api/v1/families/${FAMILY_ID}/members" \
    "{\"userId\":\"${USER2_ID}\",\"role\":\"OWNER\"}" \
    "$USER1_TOKEN" \
    "error"

# ========================================
# 阶段 6: 边界条件测试
# ========================================
echo -e "\n${YELLOW}========== 阶段 6: 边界条件 ==========${NC}"

# 更新用户信息
test_api \
    "更新用户显示名称" \
    "PATCH" \
    "/api/api/v1/users/me" \
    '{"displayName":"新名称"}' \
    "$USER1_TOKEN" \
    ""

# 更新家庭信息
test_api \
    "更新家庭名称" \
    "PATCH" \
    "/api/api/v1/families/${FAMILY_ID}" \
    '{"name":"更新后的家庭名"}' \
    "$USER1_TOKEN" \
    ""

# 获取用户信息验证更新
test_api \
    "验证用户信息更新" \
    "GET" \
    "/api/api/v1/users/me" \
    "" \
    "$USER1_TOKEN" \
    ""

# ========================================
# 测试结果总结
# ========================================
echo -e "\n========================================"
echo "   测试结果总结"
echo "========================================"
echo -e "${GREEN}✅ 通过: ${PASSED}${NC}"
echo -e "${RED}❌ 失败: ${FAILED}${NC}"
echo "总计: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 所有测试通过！后端 API 功能完整！${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  有 ${FAILED} 个测试失败${NC}"
    exit 1
fi
