#!/bin/bash

# Phase 2 Smoke Test Script
# Quick verification that all endpoints are responding

set -e

BASE_URL="${API_BASE_URL:-http://localhost:3001}"
EMAIL="${TEST_EMAIL:-test@example.com}"
PASSWORD="${TEST_PASSWORD:-test123}"

echo "==================================="
echo "Phase 2 Smoke Tests"
echo "==================================="
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Test helper
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local expected_code="${4:-200}"
  local token="$5"

  echo -n "Testing $method $endpoint ... "

  local response
  if [ -n "$token" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      "$BASE_URL$endpoint" \
      -H "Content-Type: application/json")
  fi

  local body=$(echo "$response" | head -n -1)
  local code=$(echo "$response" | tail -n 1)

  if [ "$code" = "$expected_code" ]; then
    echo -e "${GREEN}✓ PASS${NC} ($code)"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (expected $expected_code, got $code)"
    echo "  Response: $body"
    ((FAILED++))
    return 1
  fi
}

echo "Step 1: Health Check"
test_endpoint "Health Check" "GET" "/health" "200"

echo ""
echo "Step 2: Login"
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

ACCESS_TOKEN=$(echo "$login_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}Login failed${NC}"
  echo "Response: $login_response"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
((PASSED++))

echo ""
echo "Step 3: Albums Endpoints"
test_endpoint "List Albums" "GET" "/albums" "200" "$ACCESS_TOKEN"
test_endpoint "Invalid Album ID" "GET" "/albums/00000000-0000-0000-0000-000000000000" "404" "$ACCESS_TOKEN"

echo ""
echo "Step 4: Timeline Endpoints"
test_endpoint "Get Timeline" "GET" "/timeline" "200" "$ACCESS_TOKEN"
test_endpoint "List Milestones" "GET" "/timeline/milestones" "200" "$ACCESS_TOKEN"
test_endpoint "List Important Dates" "GET" "/timeline/important-dates" "200" "$ACCESS_TOKEN"

echo ""
echo "Step 5: Auth Endpoints"
test_endpoint "Get Profile" "GET" "/users/me" "200" "$ACCESS_TOKEN"

echo ""
echo "==================================="
echo "Smoke Test Results"
echo "==================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All smoke tests passed!${NC}"
  echo "Ready for full test execution."
  exit 0
else
  echo -e "${RED}Some smoke tests failed!${NC}"
  echo "Please investigate before running full tests."
  exit 1
fi
