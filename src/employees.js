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
          email: { type: "string", description: "Email address" },
          meta: { type: "object", description: "Optional metadata" }
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
        properties: {
          filter: { type: "object", description: "Optional filter e.g. { department: 'Engineering' }" },
          limit: { type: "number" },
          offset: { type: "number" }
        }
      }
    },
    {
      name: "employee_get",
      title: "Get employee",
      description: "Get an employee by id",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Employee id" }
        },
        required: ["id"]
      }
    },
    {
      name: "employee_update",
      title: "Update employee",
      description: "Update fields on an employee by id. Provide 'id' and 'updates' object.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Employee id" },
          updates: { type: "object", description: "Fields to update, e.g. { role: 'Senior SWE' }" }
        },
        required: ["id", "updates"]
      }
    },
    {
      name: "employee_delete",
      title: "Delete employee",
      description: "Delete an employee by id",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Employee id" }
        },
        required: ["id"]
      }
    }
  ];
}

// Execute a tool
export function executeTool(toolName, params) {
  // Helper for consistent text response formatting
  const textResp = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

  if (toolName === "employee_create") {
    const list = loadEmployees();
    const newEmployee = {
      id: String(Date.now()),
      name: params.name,
      department: params.department || "",
      role: params.role || "",
      email: params.email || "",
      meta: params.meta || {}
    };
    list.push(newEmployee);
    saveEmployees(list);
    return textResp({ status: "ok", employee: newEmployee });
  }

  if (toolName === "employee_list") {
    let employees = loadEmployees();
    // Optional filtering
    if (params && params.filter && typeof params.filter === "object") {
      const filter = params.filter;
      employees = employees.filter((e) =>
        Object.entries(filter).every(([k, v]) =>
          e[k] !== undefined && String(e[k]).toLowerCase().includes(String(v).toLowerCase())
        )
      );
    }
    // Optional pagination
    const offset = Number.isFinite(params?.offset) ? params.offset : 0;
    const limit = Number.isFinite(params?.limit) ? params.limit : employees.length;
    const sliced = employees.slice(offset, offset + limit);
    return textResp({ status: "ok", count: sliced.length, employees: sliced });
  }

  if (toolName === "employee_get") {
    const { id } = params || {};
    if (!id) return textResp({ status: "error", error: "missing id" });
    const employees = loadEmployees();
    const e = employees.find((x) => x.id === id);
    if (!e) return textResp({ status: "error", error: "not_found", id });
    return textResp({ status: "ok", employee: e });
  }

  if (toolName === "employee_update") {
    const { id, updates } = params || {};
    if (!id || !updates || typeof updates !== "object") {
      return textResp({ status: "error", error: "missing id or updates" });
    }
    const list = loadEmployees();
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return textResp({ status: "error", error: "not_found", id });
    // apply updates (shallow)
    list[idx] = { ...list[idx], ...updates };
    saveEmployees(list);
    return textResp({ status: "ok", employee: list[idx] });
  }

  if (toolName === "employee_delete") {
    const { id } = params || {};
    if (!id) return textResp({ status: "error", error: "missing id" });
    const list = loadEmployees();
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return textResp({ status: "error", error: "not_found", id });
    const deleted = list.splice(idx, 1)[0];
    saveEmployees(list);
    return textResp({ status: "ok", deleted });
  }

  throw new Error(`Unknown tool: ${toolName}`);
}