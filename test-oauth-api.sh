#!/bin/bash

# Complete OAuth REST API Test Script
# This demonstrates the full OAuth 2.0 Client Credentials flow

BASE_URL="http://127.0.0.1:8080"

echo "=== OAuth REST API Test ==="
echo ""

# Step 1: Register a client
echo "Step 1: Registering client..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/register)
CLIENT_ID=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['client_id'])" 2>/dev/null)
CLIENT_SECRET=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['client_secret'])" 2>/dev/null)

if [ -z "$CLIENT_ID" ]; then
  echo "❌ Error: Failed to register client"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi

echo "✅ Client registered"
echo "   Client ID: $CLIENT_ID"
echo "   Client Secret: $CLIENT_SECRET"
echo ""

# Step 2: Get access token
echo "Step 2: Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/token \
  -H "Content-Type: application/json" \
  -d "{
    \"grant_type\": \"client_credentials\",
    \"client_id\": \"$CLIENT_ID\",
    \"client_secret\": \"$CLIENT_SECRET\"
  }")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('access_token', ''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Access token received"
echo "   Token: $ACCESS_TOKEN"
echo "   Expires in: $(echo $TOKEN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('expires_in', 'N/A'), 'seconds')" 2>/dev/null)"
echo ""

# Step 3: List employees (requires auth)
echo "Step 3: Listing employees (requires OAuth)..."
LIST_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/call \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_list",
    "params": {}
  }')

echo "$LIST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LIST_RESPONSE"
echo ""

# Step 4: Create employee (requires auth)
echo "Step 4: Creating employee (requires OAuth)..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/call \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_create",
    "params": {
      "name": "API Test User",
      "department": "Engineering",
      "role": "SWE",
      "email": "api-test@example.com"
    }
  }')

echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Step 5: Test without token (should fail)
echo "Step 5: Testing without token (should fail)..."
NO_AUTH_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_list",
    "params": {}
  }')

echo "$NO_AUTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$NO_AUTH_RESPONSE"
echo ""

# Step 6: Test with invalid token (should fail)
echo "Step 6: Testing with invalid token (should fail)..."
INVALID_TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/mcp/call \
  -H "Authorization: Bearer invalid_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_list",
    "params": {}
  }')

echo "$INVALID_TOKEN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$INVALID_TOKEN_RESPONSE"
echo ""

echo "=== Test Complete ==="

