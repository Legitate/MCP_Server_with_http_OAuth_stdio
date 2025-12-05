# Authentication for STDIO MCP Server

## Overview

The STDIO MCP server now supports **optional token-based authentication**. This allows you to secure your MCP server even when using STDIO transport.

## How It Works

### 1. Get an Access Token (via HTTP API)

First, get a token using the HTTP OAuth endpoints:

```bash
# Step 1: Register a client
curl -X POST http://127.0.0.1:8080/mcp/register

# Step 2: Get a token
curl -X POST http://127.0.0.1:8080/mcp/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

This returns:
```json
{
  "access_token": "4d17af90e6e84fa68fed5c5a1c6fa29d",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 2. Pass Token in Initialize Request

When Claude Desktop (or any MCP client) connects, pass the token in the `initialize` request:

```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": {
      "name": "claude-ai",
      "version": "0.1.0"
    },
    "token": "4d17af90e6e84fa68fed5c5a1c6fa29d"
  }
}
```

**Supported token parameter names:**
- `token` (preferred)
- `accessToken`
- `authorization.bearer`

### 3. Token Validation

The server will:
- ✅ Validate the token exists in `tokens.json`
- ✅ Check if the token has expired
- ✅ Store the token for subsequent requests
- ✅ Re-validate the token on each `tools/call` request

## Current Behavior

**Authentication is currently OPTIONAL** - the server will work without a token but will log a warning.

To make authentication **REQUIRED**, uncomment the authentication check in `src/stdio-server.js`:

```javascript
// In the tools/call handler, uncomment:
if (!authToken) {
  sendResponse(id, null, {
    code: -32000,
    message: "Authentication required"
  });
  return;
}
```

## Error Responses

### Invalid Token
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "error": {
    "code": -32000,
    "message": "Authentication failed: Invalid token"
  }
}
```

### Expired Token
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "error": {
    "code": -32000,
    "message": "Authentication failed: Token expired"
  }
}
```

## Using with Claude Desktop

Currently, Claude Desktop doesn't natively support passing tokens in the initialize request. However, you can:

1. **Make authentication optional** (current default) - Server works with or without tokens
2. **Use environment variables** - Modify the server to read tokens from environment
3. **Wait for MCP client support** - Future versions may support token passing

## Security Notes

- Tokens expire after 1 hour (3600 seconds)
- Tokens are stored in `data/tokens.json`
- Each token is tied to a client_id
- Expired tokens are automatically rejected

## Testing Authentication

Test with a valid token:
```bash
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"},"token":"YOUR_TOKEN_HERE"}}' | node src/stdio-server.js
```

Test without a token (should work but warn):
```bash
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node src/stdio-server.js
```

