#!/bin/bash

BASE_URL="http://127.0.0.1:8080"

echo "=== MCP Server API Test ==="
echo ""

# Step 1: Register client
echo "Step 1: Registering client..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/register)
CLIENT_ID=$(echo $REGISTER_RESPONSE | grep -o '"client_id":"[^"]*' | cut -d'"' -f4)
CLIENT_SECRET=$(echo $REGISTER_RESPONSE | grep -o '"client_secret":"[^"]*' | cut -d'"' -f4)

if [ -z "$CLIENT_ID" ]; then
  echo "Error: Failed to register client"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi

echo "✓ Client ID: $CLIENT_ID"
echo "✓ Client Secret: $CLIENT_SECRET"
echo ""

# Step 2: Get token
echo "Step 2: Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/token \
  -H "Content-Type: application/json" \
  -d "{\"grant_type\":\"client_credentials\",\"client_id\":\"$CLIENT_ID\",\"client_secret\":\"$CLIENT_SECRET\"}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✓ Access Token: $ACCESS_TOKEN"
echo ""

# Step 3: Create employee
echo "Step 3: Creating employee..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/call \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_create",
    "params": {
      "name": "Test User",
      "department": "Engineering",
      "role": "SWE",
      "email": "test@example.com"
    }
  }')

echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Step 4: List employees
echo "Step 4: Listing all employees..."
LIST_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/call \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_list",
    "params": {}
  }')

echo "$LIST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LIST_RESPONSE"
echo ""

echo "=== Test Complete ==="

