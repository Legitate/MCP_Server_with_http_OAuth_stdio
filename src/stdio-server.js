import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import { getToolDefinitions, executeTool } from "./employees.js";
import { loadTokens } from "./oauth.js";

// Ensure we're in the correct directory (important when spawned by Claude Desktop)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.chdir(path.join(__dirname, ".."));

/**
 * MCP Server over STDIO (JSON-RPC 2.0)
 * 
 * This implements the Model Context Protocol over standard input/output.
 * Messages are JSON-RPC 2.0 format, one per line.
 */

let initialized = false;
let authenticated = false;
let authToken = null;
let serverInfo = {
  name: "mcp-employee-server",
  version: "1.0.0"
};

// Create readline interface for stdin only (not stdout)
const rl = readline.createInterface({
  input: process.stdin,
  output: null, // Don't let readline write to stdout
  terminal: false
});

/**
 * Send a JSON-RPC response
 */
function sendResponse(id, result = null, error = null) {
  const response = {
    jsonrpc: "2.0",
    id
  };

  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }

  // Write directly to stdout (MCP protocol uses stdout for responses)
  const output = JSON.stringify(response) + "\n";
  
  // Write and ensure it's flushed immediately (critical for MCP over pipes)
  try {
    process.stdout.write(output);
    // Force flush - critical for MCP over pipes
    if (typeof process.stdout.flushSync === 'function') {
      process.stdout.flushSync();
    }
  } catch (error) {
    console.error("Error writing response:", error);
  }
}

/**
 * Send a JSON-RPC notification
 */
function sendNotification(method, params) {
  const notification = {
    jsonrpc: "2.0",
    method,
    params
  };
  process.stdout.write(JSON.stringify(notification) + "\n");
}

/**
 * Verify authentication token
 */
function verifyToken(token) {
  if (!token) {
    return { ok: false, error: "Token required" };
  }

  const tokens = loadTokens();
  const tokenRecord = tokens.find(t => t.access_token === token);

  if (!tokenRecord) {
    return { ok: false, error: "Invalid token" };
  }

  // Check if token is expired
  const expiresAt = tokenRecord.created_at + (tokenRecord.expires_in * 1000);
  if (Date.now() > expiresAt) {
    return { ok: false, error: "Token expired" };
  }

  return { ok: true, token };
}

/**
 * Handle initialize request
 */
function handleInitialize(params) {
  // Authentication is OPTIONAL for STDIO (to support Claude Desktop)
  // HTTP API still requires OAuth authentication
  const token = params?.token || params?.accessToken || params?.authorization?.bearer;
  
  if (token) {
    // If token is provided, validate it
    const authResult = verifyToken(token);
    if (!authResult.ok) {
      throw {
        code: -32000,
        message: `Authentication failed: ${authResult.error}`
      };
    }
    authenticated = true;
    authToken = token;
  } else {
    // No token provided - allow connection but mark as unauthenticated
    // This allows Claude Desktop to connect without tokens
    authenticated = false;
    authToken = null;
  }

  initialized = true;
  
  // Use the protocol version from the client request, or default to a supported version
  const protocolVersion = params?.protocolVersion || "2024-11-05";
  return {
    protocolVersion: protocolVersion,
    capabilities: {
      tools: {}
    },
    serverInfo
  };
}

/**
 * Handle tools/list request
 */
function handleToolsList() {
  const tools = getToolDefinitions();
  return { tools };
}

/**
 * Handle tools/call request
 */
async function handleToolsCall(params) {
  const { name, arguments: args } = params;

  try {
    const result = executeTool(name, args || {});
    return result;
  } catch (error) {
    throw {
      code: -32603,
      message: error.message || "Internal error"
    };
  }
}

/**
 * Process incoming JSON-RPC message
 */
async function processMessage(line) {
  if (!line.trim()) {
    console.error("Empty line received");
    return;
  }

  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    sendResponse(null, null, {
      code: -32700,
      message: "Parse error"
    });
    return;
  }

  // Validate JSON-RPC 2.0 format
  if (message.jsonrpc !== "2.0") {
    sendResponse(message.id || null, null, {
      code: -32600,
      message: "Invalid Request"
    });
    return;
  }

  // Handle notifications (no id)
  if (message.id === undefined || message.id === null) {
    // Handle notifications if needed
    if (message.method === "notifications/initialized") {
      // Acknowledge but no response needed
    }
    return;
  }

  const { method, params, id } = message;

  // Check if initialized (except for initialize itself)
  if (!initialized && method !== "initialize") {
    sendResponse(id, null, {
      code: -32002,
      message: "Server not initialized"
    });
    return;
  }

  // Authentication is OPTIONAL for STDIO tool calls
  // If a token was provided during initialization, validate it
  if (initialized && method === "tools/call" && authToken) {
    // Token was provided - validate it
    const authResult = verifyToken(authToken);
    if (!authResult.ok) {
      sendResponse(id, null, {
        code: -32000,
        message: `Authentication failed: ${authResult.error}`
      });
      return;
    }
  }
  // If no token was provided, allow the request (for Claude Desktop compatibility)

  // Route to appropriate handler
  try {
    let result;

    switch (method) {
      case "initialize":
        result = handleInitialize(params);
        break;

      case "tools/list":
        result = handleToolsList();
        break;

      case "tools/call":
        result = await handleToolsCall(params);
        break;

      case "notifications/initialized":
        // Acknowledge but no response needed
        return;

      default:
        sendResponse(id, null, {
          code: -32601,
          message: `Method not found: ${method}`
        });
        return;
    }

    sendResponse(id, result);
  } catch (error) {
    console.error("Error in handler:", error);
    sendResponse(id, null, {
      code: error.code || -32603,
      message: error.message || "Internal error"
    });
  }
}

// Handle stdin line by line
rl.on("line", (line) => {
  // Wrap in try-catch to handle any synchronous errors
  try {
    processMessage(line).catch((error) => {
      console.error("Error processing message:", error);
      // Don't exit, just log the error
    });
  } catch (error) {
    console.error("Synchronous error processing message:", error);
  }
});

// Handle errors
rl.on("error", (error) => {
  console.error("Readline error:", error);
  // Don't exit immediately, let Claude Desktop handle it
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit - let the process continue
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Still don't exit - Claude Desktop should handle server restarts
});

// Handle process termination
process.on("SIGINT", () => {
  rl.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  rl.close();
  process.exit(0);
});

// Ensure stdout is not buffered (important for MCP)
// Set stdout to line-buffered mode for non-TTY (pipes)
if (process.stdout.isTTY === false) {
  process.stdout.setDefaultEncoding("utf8");
  // Disable buffering by setting _flushSync
  if (typeof process.stdout._flushSync === 'undefined') {
    process.stdout._flushSync = () => {};
  }
}

// Test that modules load correctly
try {
  // Verify employees module loads
  getToolDefinitions();
} catch (error) {
  console.error("Failed to load employees module:", error);
  process.exit(1);
}

// Log that server is ready (to stderr so it doesn't interfere with JSON-RPC)
console.error("MCP Server (STDIO) ready. Waiting for messages...");

