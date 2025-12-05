# Troubleshooting Guide

## Claude Desktop "Server disconnected" Error

If you see "MCP employee-server: Server disconnected" in Claude Desktop, follow these steps:

### 1. Check the Configuration File

The Claude Desktop config file is located at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Make sure it has the correct absolute path:
```json
{
  "mcpServers": {
    "employee-server": {
      "command": "node",
      "args": ["/Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/src/stdio-server.js"]
    }
  }
}
```

**Important:** Use the absolute path, not a relative path.

### 2. Verify Node.js is Available

Check that Node.js is in your PATH:
```bash
which node
node --version
```

If Node.js is not found, you may need to:
- Use the full path to node: `/usr/local/bin/node` or `/opt/homebrew/bin/node`
- Or install Node.js if it's missing

### 3. Test the Server Manually

Test if the server starts correctly:
```bash
cd /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server
node src/stdio-server.js
```

You should see:
```
MCP Server (STDIO) ready. Waiting for messages...
```

If you see errors, check:
- All dependencies are installed: `npm install`
- Node.js version is 18+: `node --version`

### 4. Test with JSON-RPC Messages

Send a test message to verify the server works:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node src/stdio-server.js
```

You should get a JSON response back.

### 5. Check Claude Desktop Logs

Claude Desktop logs errors to:
```
~/Library/Logs/Claude/
```

Check the latest log file for error messages.

### 6. Restart Claude Desktop

After updating the config file:
1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. The server should connect automatically

### 7. Verify File Permissions

Make sure the server file is executable:
```bash
ls -l src/stdio-server.js
```

If needed, make it executable:
```bash
chmod +x src/stdio-server.js
```

## Common Issues

### Issue: "Command not found: node"

**Solution:** Use the full path to node in the config:
```json
{
  "mcpServers": {
    "employee-server": {
      "command": "/usr/local/bin/node",
      "args": ["/Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/src/stdio-server.js"]
    }
  }
}
```

Or find your node path:
```bash
which node
```

### Issue: "Cannot find module"

**Solution:** Make sure dependencies are installed:
```bash
cd /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server
npm install
```

### Issue: Server starts but immediately exits

**Solution:** Check for syntax errors:
```bash
node src/stdio-server.js
```

Look for error messages in the output.

### Issue: Server works manually but not in Claude Desktop

**Solution:** 
1. Verify the path in the config is absolute (starts with `/`)
2. Check that Node.js is available in Claude Desktop's environment
3. Try using the full path to node in the `command` field

## Testing the Connection

### Quick Test Script

Create a test file `test-connection.js`:

```javascript
import { spawn } from "child_process";

const server = spawn("node", ["src/stdio-server.js"]);

// Send initialize
const initMsg = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test", version: "1.0.0" }
  }
};

server.stdin.write(JSON.stringify(initMsg) + "\n");

server.stdout.on("data", (data) => {
  console.log("Response:", data.toString());
});

server.stderr.on("data", (data) => {
  console.error("Error:", data.toString());
});

setTimeout(() => {
  server.kill();
  process.exit(0);
}, 2000);
```

Run it:
```bash
node test-connection.js
```

## Getting Help

If issues persist:
1. Check the server logs (stderr output)
2. Check Claude Desktop logs
3. Verify the server works manually with test messages
4. Ensure all file paths are absolute and correct

