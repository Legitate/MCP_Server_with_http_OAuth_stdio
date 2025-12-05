# MCP Node Server

A Model Context Protocol (MCP) server with employee management capabilities, supporting both **HTTP** and **STDIO** transports.

## Features

- ✅ **Dual Transport Support**
  - HTTP transport (REST API with OAuth 2.0)
  - STDIO transport (JSON-RPC 2.0 for MCP clients)
- ✅ **Employee Management**
  - Create employees
  - List employees
- ✅ **OAuth 2.0 Authentication** (HTTP transport)
- ✅ **MCP Protocol Compliance** (STDIO transport)

## Requirements

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Running the Server

### HTTP Transport (REST API)

Start the HTTP server:
```bash
npm start
# or
npm run dev  # with auto-reload
```

Server runs at: `http://127.0.0.1:8080`

**Features:**
- OAuth 2.0 client credentials flow
- REST API endpoints
- Server-Sent Events (SSE) support

See [API_GUIDE.md](./API_GUIDE.md) for HTTP API documentation.

### STDIO Transport (JSON-RPC 2.0)

Start the STDIO server:
```bash
npm run start:stdio
# or
npm run dev:stdio  # with auto-reload
```

**Features:**
- JSON-RPC 2.0 protocol
- Compatible with Claude Desktop and other MCP clients
- No authentication (local process)

See [STDIO_GUIDE.md](./STDIO_GUIDE.md) for STDIO protocol documentation.

## Quick Start

### HTTP Transport

1. Register a client:
```bash
curl -X POST http://127.0.0.1:8080/mcp/register
```

2. Get an access token:
```bash
curl -X POST http://127.0.0.1:8080/mcp/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}'
```

3. Create an employee:
```bash
curl -X POST http://127.0.0.1:8080/mcp/call \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tool":"employee_create","params":{"name":"Alice","department":"Engineering"}}'
```

### STDIO Transport

The STDIO server communicates via JSON-RPC messages over stdin/stdout. See [STDIO_GUIDE.md](./STDIO_GUIDE.md) for examples.

## Testing

### Test HTTP Server
```bash
./test-api.sh
```

### Test STDIO Server
```bash
node test-stdio.js
```

## Project Structure

```
mcp_server/
├── src/
│   ├── server.js          # HTTP transport server
│   ├── stdio-server.js    # STDIO transport server
│   ├── oauth.js           # OAuth 2.0 implementation
│   └── employees.js       # Shared employee management
├── data/
│   ├── employees.json     # Employee data store
│   ├── clients.json       # OAuth clients
│   └── tokens.json        # OAuth tokens
├── API_GUIDE.md          # HTTP API documentation
├── STDIO_GUIDE.md        # STDIO protocol documentation
└── QUICK_START.md        # Quick reference
```

## Available Tools

### `employee_create`
Creates a new employee record.

**Parameters:**
- `name` (required): Employee name
- `department` (optional): Department name
- `role` (optional): Job role
- `email` (optional): Email address

### `employee_list`
Lists all employees.

**Parameters:** None

## Transport Comparison

| Feature | HTTP | STDIO |
|---------|------|-------|
| Protocol | REST API | JSON-RPC 2.0 |
| Auth | OAuth 2.0 | None |
| Use Case | Remote API | Local MCP clients |
| Client | curl, Postman, etc. | Claude Desktop, etc. |

## Documentation

- [API_GUIDE.md](./API_GUIDE.md) - Complete HTTP API documentation
- [STDIO_GUIDE.md](./STDIO_GUIDE.md) - STDIO protocol guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference

## License

MIT
