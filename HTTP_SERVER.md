# HTTP Server Configuration

## Status

✅ **HTTP Server is Running** on `http://127.0.0.1:8080`

## Available Endpoints

### 1. Discovery Endpoint
```bash
GET http://127.0.0.1:8080/mcp/.well-known
```

Returns server information and available tools.

### 2. Client Registration
```bash
POST http://127.0.0.1:8080/mcp/register
```

Returns `client_id` and `client_secret` for OAuth.

### 3. Token Endpoint
```bash
POST http://127.0.0.1:8080/mcp/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "...",
  "client_secret": "..."
}
```

Returns access token.

### 4. Tool Invocation
```bash
POST http://127.0.0.1:8080/mcp/call
Authorization: Bearer <token>
Content-Type: application/json

{
  "tool": "employee_create",
  "params": {
    "name": "John",
    "department": "Engineering"
  }
}
```

### 5. Server-Sent Events (SSE)
```bash
GET http://127.0.0.1:8080/mcp/sse
```

## Starting the HTTP Server

### Start Server
```bash
npm start
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

## Testing the HTTP Server

### Quick Test
```bash
# 1. Register client
curl -X POST http://127.0.0.1:8080/mcp/register

# 2. Get token (use client_id and client_secret from step 1)
curl -X POST http://127.0.0.1:8080/mcp/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}'

# 3. List employees (use token from step 2)
curl -X POST http://127.0.0.1:8080/mcp/call \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tool":"employee_list","params":{}}'
```

## HTTP vs STDIO

| Feature | HTTP Server | STDIO Server |
|---------|-------------|--------------|
| **Transport** | HTTP/REST | stdin/stdout |
| **Protocol** | REST API | JSON-RPC 2.0 |
| **Authentication** | OAuth 2.0 Required | Token-based (optional) |
| **Use Case** | Web clients, APIs | Claude Desktop, CLI |
| **Status** | ✅ Running | ✅ Running |

## Note on Claude Desktop

Claude Desktop uses **STDIO transport** by default. To use the HTTP server with Claude Desktop, you would need:
1. A proxy/wrapper that converts STDIO to HTTP
2. Or wait for Claude Desktop to support HTTP transport natively

For now, Claude Desktop should continue using the STDIO server configuration.

