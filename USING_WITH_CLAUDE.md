# Using MCP Server with Claude Desktop

## ✅ Status: Ready to Use!

The STDIO server now works **without authentication** for Claude Desktop compatibility, while the HTTP API still requires OAuth.

## How to Use in Claude Desktop

### 1. Restart Claude Desktop

**Important:** After the server changes, restart Claude Desktop:
1. Quit Claude Desktop completely (⌘Q)
2. Wait a few seconds
3. Restart Claude Desktop

### 2. Verify Connection

Check Claude Desktop Settings → Developer → Local MCP servers:
- ✅ "employee-server" should show as **connected** (no red error banner)
- ✅ Status should be "running"

### 3. Use the Tools

Once connected, you can ask Claude Desktop to:

#### List All Employees
```
List all employees
Show me all employees in the system
```

#### Create an Employee
```
Create an employee named John Doe in the Engineering department
Add a new employee: Alice, Engineering department, role SWE, email alice@example.com
```

#### Examples
- "List all employees"
- "Create an employee named Sarah in Marketing as a Manager"
- "Add John to Engineering as a Senior Engineer with email john@example.com"
- "Show me everyone in the system"

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

**No parameters required**

## Testing

Try these commands in Claude Desktop:

1. **List employees:**
   - "List all employees"
   - "Show me the employee database"

2. **Create employee:**
   - "Create an employee named Test User in Engineering"
   - "Add a new employee: Jane Doe, Marketing department, Manager role"

## Troubleshooting

### If Claude says "I don't have access to employee tools"

1. **Check connection:**
   - Go to Settings → Developer
   - Verify "employee-server" is connected (no red error)

2. **Restart Claude Desktop:**
   - Completely quit and restart

3. **Check logs:**
   ```bash
   tail -50 ~/Library/Logs/Claude/mcp-server-employee-server.log
   ```

### If tools don't appear

- The tools appear dynamically when Claude needs them
- Try asking directly: "List all employees" or "Create an employee"
- Claude will automatically use the tools when relevant

## Security Note

- **HTTP API**: Requires OAuth authentication (secure)
- **STDIO (Claude Desktop)**: No authentication required (local process, secure by default)

Both servers can run simultaneously!

