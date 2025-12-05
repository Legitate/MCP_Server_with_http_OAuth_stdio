# Authentication Required - STDIO MCP Server

## ⚠️ Important: Authentication is Now Required

The STDIO MCP server **requires authentication** for all requests. You must provide a valid OAuth token during initialization.

## How to Use

### Step 1: Get an Access Token

Use the HTTP API to get a token:

```bash
# Register a client
curl -X POST http://127.0.0.1:8080/mcp/register

# Get a token
curl -X POST http://127.0.0.1:8080/mcp/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

### Step 2: Pass Token in Initialize Request

The token must be passed in the `initialize` request:

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
    "token": "YOUR_ACCESS_TOKEN_HERE"
  }
}
```

**Supported token parameter names:**
- `token` (preferred)
- `accessToken`
- `authorization.bearer`

## Error Responses

### Missing Token
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "error": {
    "code": -32000,
    "message": "Authentication required: Token must be provided in initialize request"
  }
}
```

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

## Token Validation

- ✅ Token must exist in `data/tokens.json`
- ✅ Token must not be expired (tokens expire after 1 hour)
- ✅ Token is validated on initialization
- ✅ Token is re-validated on each `tools/call` request

## Testing

### Test Without Token (Should Fail)
```bash
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node src/stdio-server.js
```

Expected: Authentication error

### Test With Valid Token (Should Succeed)
```bash
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"},"token":"4d17af90e6e84fa68fed5c5a1c6fa29d"}}' | node src/stdio-server.js
```

Expected: Successful initialization

## Claude Desktop Integration

**Note:** Claude Desktop doesn't natively support passing tokens in the initialize request. To use this server with Claude Desktop, you have two options:

1. **Modify the server** to read tokens from environment variables
2. **Wait for MCP client support** for token passing

For now, you can test the server manually or modify it to use environment variables.

## Making Authentication Optional Again

If you want to make authentication optional again, edit `src/stdio-server.js`:

1. In `handleInitialize()`, change the token check to be optional
2. In `processMessage()`, remove or comment out the authentication check for `tools/call`

