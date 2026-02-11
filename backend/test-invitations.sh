#!/bin/bash

# 邀请系统专项测试

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "   邀请系统测试"
echo "========================================"

# 1. 登录已存在的用户
echo -e "\n${YELLOW}步骤 1: 登录用户1${NC}"
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"user1@test.com","password":"Test1234"}' \
    "${BASE_URL}/api/api/v1/auth/login")

USER1_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER1_TOKEN" ]; then
    echo -e "${RED}❌ 用户1不存在，先创建用户...${NC}"
    REGISTER_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"user1@test.com","password":"Test1234","displayName":"用户1"}' \
        "${BASE_URL}/api/api/v1/auth/register")

    USER1_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$USER1_TOKEN" ]; then
    echo -e "${RED}❌ 无法获取用户1 Token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 用户1 Token: ${USER1_TOKEN:0:30}...${NC}"

# 2. 创建用户2
echo -e "\n${YELLOW}步骤 2: 创建用户2${NC}"
REGISTER_USER2=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"user2@test.com","password":"Test1234","displayName":"用户2"}' \
    "${BASE_URL}/api/api/v1/auth/register")

USER2_TOKEN=$(echo "$REGISTER_USER2" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER2_TOKEN" ]; then
    # 可能已存在，尝试登录
    LOGIN_USER2=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"user2@test.com","password":"Test1234"}' \
        "${BASE_URL}/api/api/v1/auth/login")

    USER2_TOKEN=$(echo "$LOGIN_USER2" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

echo -e "${GREEN}✅ 用户2 Token: ${USER2_TOKEN:0:30}...${NC}"

# 3. 创建家庭
echo -e "\n${YELLOW}步骤 3: 创建家庭${NC}"
FAMILY_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${USER1_TOKEN}" \
    -d '{"name":"测试家庭"}' \
    "${BASE_URL}/api/api/v1/families")

FAMILY_ID=$(echo "$FAMILY_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

echo -e "${GREEN}✅ 家庭 ID: $FAMILY_ID${NC}"

# 4. 创建邀请
echo -e "\n${YELLOW}步骤 4: 创建邀请${NC}"
INVITE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${USER1_TOKEN}" \
    -d '{"role":"MEMBER","expiresInDays":7}' \
    "${BASE_URL}/api/api/v1/families/${FAMILY_ID}/invitations")

echo "响应: $INVITE_RESPONSE"

INVITE_TOKEN=$(echo "$INVITE_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$INVITE_TOKEN" ]; then
    echo -e "${RED}❌ 创建邀请失败${NC}"
    echo "完整响应: $INVITE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ 邀请 Token: ${INVITE_TOKEN:0:40}...${NC}"

# 5. 验证邀请
echo -e "\n${YELLOW}步骤 5: 验证邀请${NC}"
VALIDATE_RESPONSE=$(curl -s -X GET \
    "${BASE_URL}/api/api/v1/invitations/validate?token=${INVITE_TOKEN}")

echo "响应: $VALIDATE_RESPONSE"

if echo "$VALIDATE_RESPONSE" | grep -q '"familyName"'; then
    echo -e "${GREEN}✅ 邀请验证成功${NC}"
else
    echo -e "${RED}❌ 邀请验证失败${NC}"
fi

# 6. 用户2接受邀请
echo -e "\n${YELLOW}步骤 6: 用户2接受邀请${NC}"
ACCEPT_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${USER2_TOKEN}" \
    -d "{\"token\":\"${INVITE_TOKEN}\"}" \
    "${BASE_URL}/api/api/v1/invitations/accept")

echo "响应: $ACCEPT_RESPONSE"

if echo "$ACCEPT_RESPONSE" | grep -q '"familyId"'; then
    echo -e "${GREEN}✅ 接受邀请成功${NC}"
else
    echo -e "${RED}❌ 接受邀请失败${NC}"
fi

# 7. 获取家庭成员（验证用户2已加入）
echo -e "\n${YELLOW}步骤 7: 获取家庭成员${NC}"
MEMBERS_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer ${USER1_TOKEN}" \
    "${BASE_URL}/api/api/v1/families/${FAMILY_ID}/members")

echo "响应: $MEMBERS_RESPONSE"

MEMBER_COUNT=$(echo "$MEMBERS_RESPONSE" | grep -o '"userId"' | wc -l)

echo -e "${GREEN}✅ 家庭成员数: $MEMBER_COUNT${NC}"

# 8. 测试用户2切换家庭
echo -e "\n${YELLOW}步骤 8: 用户2切换家庭${NC}"
SWITCH_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer ${USER2_TOKEN}" \
    "${BASE_URL}/api/api/v1/families/${FAMILY_ID}/switch")

echo "响应: $SWITCH_RESPONSE"

if echo "$SWITCH_RESPONSE" | grep -q '"familyId"'; then
    echo -e "${GREEN}✅ 切换家庭成功${NC}"
else
    echo -e "${RED}❌ 切换家庭失败${NC}"
fi

echo -e "\n========================================"
echo "   邀请系统测试完成"
echo "========================================"
