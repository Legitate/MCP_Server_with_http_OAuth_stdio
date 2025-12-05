import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File where employees are stored
const EMP_FILE = path.join(__dirname, "..", "data", "employees.json");

// Load employees
export function loadEmployees() {
  try {
    return JSON.parse(fs.readFileSync(EMP_FILE, "utf-8"));
  } catch {
    return [];
  }
}

// Save employees
export function saveEmployees(list) {
  fs.writeFileSync(EMP_FILE, JSON.stringify(list, null, 2));
}

// Get tool definitions
export function getToolDefinitions() {
  return [
    {
      name: "employee_create",
      title: "Create employee",
      description: "Create a new employee",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Employee name" },
          department: { type: "string", description: "Department name" },
          role: { type: "string", description: "Job role" },
          email: { type: "string", description: "Email address" }
        },
        required: ["name"]
      }
    },
    {
      name: "employee_list",
      title: "List employees",
      description: "List all employees",
      inputSchema: {
        type: "object",
        properties: {}
      }
    }
  ];
}

// Execute a tool
export function executeTool(toolName, params) {
  if (toolName === "employee_create") {
    const list = loadEmployees();
    const newEmployee = {
      id: String(Date.now()),
      ...params
    };
    list.push(newEmployee);
    saveEmployees(list);
    return { content: [{ type: "text", text: JSON.stringify({ status: "ok", employee: newEmployee }, null, 2) }] };
  }

  if (toolName === "employee_list") {
    const employees = loadEmployees();
    return { content: [{ type: "text", text: JSON.stringify({ status: "ok", employees }, null, 2) }] };
  }

  throw new Error(`Unknown tool: ${toolName}`);
}

