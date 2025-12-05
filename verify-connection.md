# Verifying MCP Connection to Claude Desktop

## Current Tools Available

Your MCP server exposes **2 tools**:

1. **`employee_create`** - Create a new employee
2. **`employee_list`** - List all employees

## Why Claude Might Not Show MCP Tools

If Claude is only showing default tools (Web Search, Web Fetch, etc.) and not your MCP tools, it means the MCP server isn't connected. Here's how to fix it:

### Step 1: Verify Configuration

Your config file should be at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Current config:
```json
{
  "mcpServers": {
    "employee-server": {
      "command": "/Users/vigneshdhanraj/.nvm/versions/node/v24.11.1/bin/node",
      "args": ["/Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/src/stdio-server.js"]
    }
  }
}
```

### Step 2: Restart Claude Desktop

**Important:** After changing the config, you MUST:
1. **Quit Claude Desktop completely** (not just close the window)
2. **Wait a few seconds**
3. **Restart Claude Desktop**

The MCP server connection is established when Claude Desktop starts.

### Step 3: Check Connection Status

In Claude Desktop, you should see:
- No red "Server disconnected" banner
- The server should connect automatically on startup

### Step 4: Test the Tools

Once connected, try asking Claude:
- "List all employees"
- "Create an employee named Test User"
- "What MCP tools do you have access to?"

If the tools are connected, Claude will use them automatically.

### Step 5: Check Logs

If still not working, check Claude Desktop logs:
```
~/Library/Logs/Claude/
```

Look for error messages related to "employee-server" or "MCP".

## Alternative: Test Server Manually

Test if the server works:
```bash
cd /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server
node src/stdio-server.js
```

Then in another terminal:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/src/stdio-server.js
```

You should get a JSON response back.

