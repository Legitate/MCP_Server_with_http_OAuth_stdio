# STDIO Transport Guide

## Overview

The MCP server now supports **STDIO transport** in addition to HTTP. STDIO is the standard transport for MCP servers and is used by clients like Claude Desktop.

## Transport Comparison

| Feature | HTTP Transport | STDIO Transport |
|---------|---------------|-----------------|
| **Protocol** | REST API | JSON-RPC 2.0 |
| **Communication** | HTTP requests | stdin/stdout |
| **Authentication** | OAuth 2.0 | None (local process) |
| **Use Case** | Remote servers | Local servers |
| **Client Support** | Custom clients | Claude Desktop, etc. |

## Running the STDIO Server

### Start STDIO Server
```bash
npm run start:stdio
```

Or directly:
```bash
node src/stdio-server.js
```

### Development Mode (with auto-reload)
```bash
npm run dev:stdio
```

## MCP Protocol (JSON-RPC 2.0)

The STDIO server implements the Model Context Protocol using JSON-RPC 2.0. Messages are sent one per line over stdin/stdout.

### Protocol Flow

1. **Initialize** - Client sends initialization request
2. **Initialized** - Server acknowledges (notification)
3. **Tools/List** - Client requests available tools
4. **Tools/Call** - Client invokes a tool

## Example Messages

### 1. Initialize Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "test-client",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "mcp-employee-server",
      "version": "1.0.0"
    }
  }
}
```

### 2. Initialized Notification
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

### 3. List Tools Request
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "employee_create",
        "title": "Create employee",
        "description": "Create a new employee",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "Employee name"
            },
            "department": {
              "type": "string",
              "description": "Department name"
            },
            "role": {
              "type": "string",
              "description": "Job role"
            },
            "email": {
              "type": "string",
              "description": "Email address"
            }
          },
          "required": ["name"]
        }
      },
      {
        "name": "employee_list",
        "title": "List employees",
        "description": "List all employees",
        "inputSchema": {
          "type": "object",
          "properties": {}
        }
      }
    ]
  }
}
```

### 4. Call Tool Request
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "employee_create",
    "arguments": {
      "name": "Alice",
      "department": "Engineering",
      "role": "SWE",
      "email": "alice@example.com"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"status\": \"ok\",\n  \"employee\": {\n    \"id\": \"1764913010668\",\n    \"name\": \"Alice\",\n    \"department\": \"Engineering\",\n    \"role\": \"SWE\",\n    \"email\": \"alice@example.com\"\n  }\n}"
      }
    ]
  }
}
```

## Testing the STDIO Server

### Manual Test with echo

```bash
# Start the server in one terminal
node src/stdio-server.js

# In another terminal, send test messages
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node src/stdio-server.js
```

### Using a Test Script

Create a test file `test-stdio.sh`:

```bash
#!/bin/bash

# Start server in background
node src/stdio-server.js > /tmp/mcp-output.log 2>&1 &
SERVER_PID=$!

sleep 1

# Send initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' > /proc/$SERVER_PID/fd/0

# Send tools/list
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' > /proc/$SERVER_PID/fd/0

# Cleanup
kill $SERVER_PID
```

## Using with Claude Desktop

To use this server with Claude Desktop, add to your MCP settings:

```json
{
  "mcpServers": {
    "employee-server": {
      "command": "node",
      "args": ["/path/to/mcp_server/src/stdio-server.js"]
    }
  }
}
```

## Error Handling

### Invalid JSON
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32700,
    "message": "Parse error"
  }
}
```

### Method Not Found
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found: unknown_method"
  }
}
```

### Server Not Initialized
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32002,
    "message": "Server not initialized"
  }
}
```

## Available Tools

### `employee_create`
Creates a new employee.

**Parameters:**
- `name` (required): Employee name
- `department` (optional): Department name
- `role` (optional): Job role
- `email` (optional): Email address

### `employee_list`
Lists all employees.

**Parameters:** None

## Notes

- Messages must be valid JSON, one per line
- Each request must have a unique `id` (except notifications)
- Server must be initialized before calling tools
- Responses are sent to stdout
- Errors are sent to stderr (for logging)

