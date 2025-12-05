# Quick Start Guide

## How Authorization Works

### The Flow:
```
1. Register Client → Get client_id & client_secret
2. Get Token → Exchange credentials for access_token
3. Use Token → Include in Authorization header for all API calls
```

---

## Step-by-Step

### 1️⃣ Register a Client
```bash
curl -X POST http://127.0.0.1:8080/mcp/register
```
**Returns:** `client_id` and `client_secret`

### 2️⃣ Get Access Token
```bash
curl -X POST http://127.0.0.1:8080/mcp/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```
**Returns:** `access_token` (valid for 1 hour)

### 3️⃣ Make API Calls
```bash
curl -X POST http://127.0.0.1:8080/mcp/call \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_create",
    "params": {
      "name": "Charlie",
      "department": "Engineering",
      "role": "SWE",
      "email": "charlie@example.com"
    }
  }'
```

---

## Key Points

✅ **Authorization Header Format:**
```
Authorization: Bearer <access_token>
```

✅ **Request Body Format:**
```json
{
  "tool": "employee_create",
  "params": {
    "name": "Required",
    "department": "Optional",
    "role": "Optional",
    "email": "Optional"
  }
}
```

✅ **Token Expiration:** Tokens expire after 1 hour - get a new one when needed

✅ **Error Handling:** If you get `401 Unauthorized`, check:
- Is the Authorization header present?
- Is the token valid?
- Has the token expired?

---

## Available Tools

### `employee_create`
Creates a new employee record.

**Required:** `name`  
**Optional:** `department`, `role`, `email`

### `employee_list`
Lists all employees.

**No parameters required** (use empty object `{}`)

---

## Test It

Run the test script:
```bash
./test-api.sh
```

Or use the Node.js example:
```bash
node example.js
```

---

## Full Documentation

See `API_GUIDE.md` for complete documentation with examples in multiple languages.

