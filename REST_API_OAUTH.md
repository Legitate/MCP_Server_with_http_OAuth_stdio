# REST API with OAuth 2.0 - Complete Guide

## ✅ Status: Fully Working

The REST API server is running at `http://127.0.0.1:8080` with OAuth 2.0 authentication.

## OAuth 2.0 Flow (Client Credentials)

### Step 1: Register a Client

**Endpoint:** `POST http://127.0.0.1:8080/mcp/register`

```bash
curl -X POST http://127.0.0.1:8080/mcp/register
```

**Response:**
```json
{
  "client_id": "client-abc123...",
  "client_secret": "secret123...",
  "redirect_uris": [],
  "token_endpoint": "http://127.0.0.1:8080/mcp/token"
}
```

**Save these credentials!** You'll need them for the next step.

---

### Step 2: Get Access Token

**Endpoint:** `POST http://127.0.0.1:8080/mcp/token`

**Request:**
```bash
curl -X POST http://127.0.0.1:8080/mcp/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "client-abc123...",
    "client_secret": "secret123..."
  }'
```

**Response:**
```json
{
  "access_token": "8b015a6a3ace446bad35108901c03c78",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Token expires in 3600 seconds (1 hour).**

---

### Step 3: Use API with Token

All API calls require the `Authorization: Bearer <token>` header.

#### List Employees

```bash
curl -X POST http://127.0.0.1:8080/mcp/call \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_list",
    "params": {}
  }'
```

**Response:**
```json
{
  "status": "ok",
  "employees": [
    {
      "id": "1",
      "name": "Charlie",
      "department": "Engineering",
      "role": "SWE",
      "email": "charlie@example.com"
    }
  ]
}
```

#### Create Employee

```bash
curl -X POST http://127.0.0.1:8080/mcp/call \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "employee_create",
    "params": {
      "name": "John Doe",
      "department": "Engineering",
      "role": "SWE",
      "email": "john@example.com"
    }
  }'
```

**Response:**
```json
{
  "status": "ok",
  "employee": {
    "id": "1764916523726",
    "name": "John Doe",
    "department": "Engineering",
    "role": "SWE",
    "email": "john@example.com"
  }
}
```

---

## Complete Example Script

Run the test script:
```bash
./test-oauth-api.sh
```

This demonstrates the complete OAuth flow with all test cases.

---

## API Endpoints

### Discovery
```
GET http://127.0.0.1:8080/mcp/.well-known
```
Returns server information and available tools.

### Register Client
```
POST http://127.0.0.1:8080/mcp/register
```
Registers a new OAuth client.

### Get Token
```
POST http://127.0.0.1:8080/mcp/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "...",
  "client_secret": "..."
}
```

### Call Tool (Requires Auth)
```
POST http://127.0.0.1:8080/mcp/call
Authorization: Bearer <token>
Content-Type: application/json

{
  "tool": "employee_create",
  "params": {...}
}
```

### Server-Sent Events
```
GET http://127.0.0.1:8080/mcp/sse
```

---

## Error Responses

### 401 Unauthorized - Missing Token
```json
{
  "error": "unauthorized",
  "message": "Authorization header missing"
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "error": "unauthorized",
  "message": "Invalid token"
}
```

### 401 Unauthorized - Expired Token
```json
{
  "error": "unauthorized",
  "message": "Token expired"
}
```

### 400 Bad Request - Invalid Client
```json
{
  "error": "invalid_client"
}
```

### 400 Bad Request - Unknown Tool
```json
{
  "error": "unknown_tool",
  "message": "Unknown tool: tool_name"
}
```

---

## Available Tools

### `employee_create`
Creates a new employee.

**Required:** `name`  
**Optional:** `department`, `role`, `email`

### `employee_list`
Lists all employees.

**No parameters required**

---

## Using with JavaScript/Node.js

```javascript
const BASE_URL = 'http://127.0.0.1:8080';

// Step 1: Register client
async function registerClient() {
  const response = await fetch(`${BASE_URL}/mcp/register`, {
    method: 'POST'
  });
  return await response.json();
}

// Step 2: Get token
async function getToken(clientId, clientSecret) {
  const response = await fetch(`${BASE_URL}/mcp/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  return await response.json();
}

// Step 3: Call API
async function callAPI(accessToken, tool, params) {
  const response = await fetch(`${BASE_URL}/mcp/call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tool, params })
  });
  return await response.json();
}

// Usage
(async () => {
  const client = await registerClient();
  const tokenData = await getToken(client.client_id, client.client_secret);
  const result = await callAPI(tokenData.access_token, 'employee_list', {});
  console.log(result);
})();
```

---

## Using with Python

```python
import requests

BASE_URL = 'http://127.0.0.1:8080'

# Step 1: Register client
def register_client():
    response = requests.post(f'{BASE_URL}/mcp/register')
    return response.json()

# Step 2: Get token
def get_token(client_id, client_secret):
    response = requests.post(
        f'{BASE_URL}/mcp/token',
        json={
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret
        }
    )
    return response.json()

# Step 3: Call API
def call_api(access_token, tool, params):
    response = requests.post(
        f'{BASE_URL}/mcp/call',
        headers={'Authorization': f'Bearer {access_token}'},
        json={'tool': tool, 'params': params}
    )
    return response.json()

# Usage
if __name__ == '__main__':
    client = register_client()
    token_data = get_token(client['client_id'], client['client_secret'])
    result = call_api(token_data['access_token'], 'employee_list', {})
    print(result)
```

---

## Security Notes

- ✅ **OAuth 2.0 Client Credentials** flow implemented
- ✅ **Token expiration**: 1 hour (3600 seconds)
- ✅ **Token validation**: Tokens are checked on every request
- ✅ **Secure storage**: Tokens stored in `data/tokens.json`
- ✅ **No token reuse**: Each client gets unique tokens

---

## Quick Test

Run the complete test:
```bash
./test-oauth-api.sh
```

This will test:
1. ✅ Client registration
2. ✅ Token generation
3. ✅ Authenticated API calls
4. ✅ Unauthorized request rejection
5. ✅ Invalid token rejection

---

## Server Status

- **HTTP Server**: Running on `http://127.0.0.1:8080`
- **OAuth**: Fully implemented and working
- **Authentication**: Required for all `/mcp/call` endpoints
- **Tools**: `employee_create`, `employee_list`

