# Troubleshooting Claude Desktop "Taking longer than usual"

## Issue: Claude Desktop times out when calling tools

If Claude Desktop shows "Taking longer than usual" when you ask to list employees, try these steps:

### Step 1: Check Server Status

Verify the server is running:
```bash
ps aux | grep stdio-server.js | grep -v grep
```

If not running, restart it:
```bash
cd /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server
node src/stdio-server.js
```

### Step 2: Restart Claude Desktop

1. **Completely quit** Claude Desktop (⌘Q)
2. Wait 5 seconds
3. **Restart** Claude Desktop
4. Wait for it to connect (check Settings → Developer)

### Step 3: Check Logs

Check for errors:
```bash
tail -100 ~/Library/Logs/Claude/mcp-server-employee-server.log | grep -i "error\|timeout\|fail"
```

### Step 4: Test the Tool Manually

Test if the tool works:
```bash
cd /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"employee_list","arguments":{}}}' | node src/stdio-server.js
```

### Step 5: Try Different Phrasing

Instead of "list employee", try:
- "List all employees"
- "Show me all employees"
- "Get the employee list"
- "Display all employees in the system"

### Step 6: Check File Permissions

Ensure the employees.json file is readable:
```bash
ls -la /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/data/employees.json
chmod 644 /Users/vigneshdhanraj/Desktop/Altrosyn/mcp_server/data/employees.json
```

### Step 7: Verify Server Response Format

The server should return:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"status\":\"ok\",\"employees\":[...]}"
    }]
  }
}
```

## Quick Fix

1. **Kill any existing server processes:**
   ```bash
   pkill -f stdio-server.js
   ```

2. **Restart Claude Desktop completely**

3. **Try again with:**
   - "List all employees"
   - "Show me the employee database"

## If Still Not Working

Check if there are multiple server instances running:
```bash
ps aux | grep node | grep mcp_server
```

Kill all and restart:
```bash
pkill -f mcp_server
# Then restart Claude Desktop
```

