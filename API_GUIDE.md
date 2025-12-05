# MCP Server API Guide

## Overview
This server uses OAuth 2.0 Client Credentials flow for authentication. You need to:
1. Register a client (get `client_id` and `client_secret`)
2. Exchange credentials for an access token
3. Use the token to make authenticated API calls

---

## Step 1: Register a Client

**Endpoint:** `POST http://127.0.0.1:8080/mcp/register`

**Request:**
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

## Step 2: Get an Access Token

**Endpoint:** `POST http://127.0.0.1:8080/mcp/token`

**Request Body:**
```json
{
  "grant_type": "client_credentials",
  "client_id": "client-abc123...",
  "client_secret": "secret123..."
}
```

**Example with curl:**
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
  "access_token": "4d17af90e6e84fa68fed5c5a1c6fa29d",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Token expires in 3600 seconds (1 hour).**

---

## Step 3: Make Authenticated Requests

All API calls require the `Authorization: Bearer <token>` header.

### Create an Employee

**Endpoint:** `POST http://127.0.0.1:8080/mcp/call`

**Request Headers:**
```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "tool": "employee_create",
  "params": {
    "name": "Charlie",
    "department": "Engineering",
    "role": "SWE",
    "email": "charlie@example.com"
  }
}
```

**Example with curl:**
```bash
curl -X POST http://127.0.0.1:8080/mcp/call \
  -H "Authorization: Bearer 4d17af90e6e84fa68fed5c5a1c6fa29d" \
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

**Response:**
```json
{
  "status": "ok",
  "employee": {
    "id": "1764912720495",
    "name": "Charlie",
    "department": "Engineering",
    "role": "SWE",
    "email": "charlie@example.com"
  }
}
```

### List All Employees

**Endpoint:** `POST http://127.0.0.1:8080/mcp/call`

**Request:**
```bash
curl -X POST http://127.0.0.1:8080/mcp/call \
  -H "Authorization: Bearer 4d17af90e6e84fa68fed5c5a1c6fa29d" \
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
      "role": "Backend Engineer",
      "email": "charlie@example.com"
    }
  ]
}
```

---

## Authorization Flow Summary

```
┌─────────┐                    ┌──────────┐
│ Client  │                    │  Server  │
└────┬────┘                    └────┬─────┘
     │                              │
     │  1. POST /mcp/register       │
     │─────────────────────────────>│
     │                              │
     │  2. client_id + secret       │
     │<─────────────────────────────│
     │                              │
     │  3. POST /mcp/token          │
     │     (with credentials)       │
     │─────────────────────────────>│
     │                              │
     │  4. access_token             │
     │<─────────────────────────────│
     │                              │
     │  5. POST /mcp/call           │
     │     Authorization: Bearer    │
     │─────────────────────────────>│
     │                              │
     │  6. Response                 │
     │<─────────────────────────────│
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Authorization header missing"
}
```

Common causes:
- Missing `Authorization` header
- Invalid token format
- Token not found in database
- Token expired (tokens expire after 1 hour)

### Invalid Client
```json
{
  "error": "invalid_client"
}
```

This happens when `client_id` or `client_secret` is incorrect.

---

## Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

# Step 1: Register client
echo "Step 1: Registering client..."
REGISTER_RESPONSE=$(curl -s -X POST http://127.0.0.1:8080/mcp/register)
CLIENT_ID=$(echo $REGISTER_RESPONSE | grep -o '"client_id":"[^"]*' | cut -d'"' -f4)
CLIENT_SECRET=$(echo $REGISTER_RESPONSE | grep -o '"client_secret":"[^"]*' | cut -d'"' -f4)

echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"

# Step 2: Get token
echo -e "\nStep 2: Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8080/mcp/token \
  -H "Content-Type: application/json" \
  -d "{\"grant_type\":\"client_credentials\",\"client_id\":\"$CLIENT_ID\",\"client_secret\":\"$CLIENT_SECRET\"}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "Access Token: $ACCESS_TOKEN"

# Step 3: Create employee
echo -e "\nStep 3: Creating employee..."
curl -X POST http://127.0.0.1:8080/mcp/call \
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
  }'

echo -e "\n\nDone!"
```

Make it executable: `chmod +x test-api.sh`

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

// Step 3: Create employee
async function createEmployee(accessToken, employeeData) {
  const response = await fetch(`${BASE_URL}/mcp/call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'employee_create',
      params: employeeData
    })
  });
  return await response.json();
}

// Usage
(async () => {
  const client = await registerClient();
  const tokenData = await getToken(client.client_id, client.client_secret);
  const result = await createEmployee(tokenData.access_token, {
    name: 'John Doe',
    department: 'Engineering',
    role: 'SWE',
    email: 'john@example.com'
  });
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

# Step 3: Create employee
def create_employee(access_token, employee_data):
    response = requests.post(
        f'{BASE_URL}/mcp/call',
        headers={'Authorization': f'Bearer {access_token}'},
        json={
            'tool': 'employee_create',
            'params': employee_data
        }
    )
    return response.json()

# Usage
if __name__ == '__main__':
    client = register_client()
    token_data = get_token(client['client_id'], client['client_secret'])
    result = create_employee(
        token_data['access_token'],
        {
            'name': 'Jane Doe',
            'department': 'Engineering',
            'role': 'SWE',
            'email': 'jane@example.com'
        }
    )
    print(result)
```

---

## Notes

- **Token Expiration**: Tokens expire after 1 hour (3600 seconds). You'll need to get a new token after expiration.
- **Required Fields**: For `employee_create`, only `name` is required. Other fields (`department`, `role`, `email`) are optional.
- **Server**: Make sure the server is running on `http://127.0.0.1:8080` before making requests.

