# Fixing "Could not attach to MCP server" Error

## Current Status
- ✅ Server code is working correctly
- ✅ Server responds to JSON-RPC messages
- ✅ Configuration file has correct paths
- ❌ Claude Desktop shows "Could not attach" error

## Steps to Fix

### Step 1: Verify the Server Works Manually

Test the server directly:
```bash
cd /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server
node src/stdio-server.js
```

Then in another terminal, send a test message:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/src/stdio-server.js
```

You should see a JSON response.

### Step 2: Check Claude Desktop Logs

Check for error messages:
```bash
tail -50 ~/Library/Logs/Claude/*.log
```

Look for errors related to:
- "employee-server"
- "stdio-server"
- "MCP"
- Node.js errors
- Permission errors

### Step 3: Verify File Permissions

Make sure the server file is readable:
```bash
ls -l /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/src/stdio-server.js
chmod +r /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/src/stdio-server.js
```

### Step 4: Test with Full Paths

Try updating the config to use absolute paths for everything. The current config should be:

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

### Step 5: Check Node Version Compatibility

Verify Node.js version:
```bash
/Users/vigneshdhanraj/.nvm/versions/node/v24.11.1/bin/node --version
```

If this doesn't work, find where node is:
```bash
which node
```

Then update the config with that path.

### Step 6: Restart Claude Desktop

**Critical:** After any config changes:
1. **Completely quit** Claude Desktop (⌘Q or right-click dock icon → Quit)
2. Wait 5 seconds
3. Restart Claude Desktop
4. Check the Developer settings again

### Step 7: Check for Environment Issues

Claude Desktop might not have access to nvm. Try using a system node if available:

```bash
/usr/local/bin/node --version
# or
/opt/homebrew/bin/node --version
```

If either works, update the config to use that path instead.

### Step 8: Verify Dependencies

Make sure all npm packages are installed:
```bash
cd /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server
npm install
```

### Step 9: Test Server Startup

Run the server and check for immediate errors:
```bash
cd /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server
node src/stdio-server.js 2>&1
```

You should see:
```
MCP Server (STDIO) ready. Waiting for messages...
```

If you see any errors, fix them first.

### Step 10: Alternative - Use System Node

If nvm path doesn't work, install node via Homebrew and use that:

```bash
brew install node
which node  # Use this path in config
```

## Common Issues

### Issue: "Command not found"
- **Fix:** Use full absolute path to node in the `command` field

### Issue: "Cannot find module"
- **Fix:** Run `npm install` in the project directory

### Issue: "Permission denied"
- **Fix:** `chmod +x src/stdio-server.js` and ensure file is readable

### Issue: Server starts but immediately exits
- **Fix:** Check for uncaught errors in the code (we've added error handling)

### Issue: Server works manually but not in Claude Desktop
- **Fix:** Ensure paths are absolute, restart Claude Desktop completely

## Debug Mode

To see what Claude Desktop is sending, you could temporarily add logging:

The server already logs to stderr, so check:
```bash
# In Claude Desktop logs
grep -i "employee\|mcp\|stdio" ~/Library/Logs/Claude/*.log
```

## Still Not Working?

1. Check if the server process is actually running when Claude Desktop tries to connect
2. Verify the exact error message in Claude Desktop logs
3. Try creating a minimal test server to isolate the issue
4. Check if there are any macOS security/permission prompts blocking the connection

