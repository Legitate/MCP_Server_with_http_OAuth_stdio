import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

import { registerClient, getToken, verifyAuth } from "./oauth.js";
import { loadEmployees, saveEmployees, getToolDefinitions, executeTool } from "./employees.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ----------------------------------------------------------
 *  OAuth ENDPOINTS
 * -------------------------------------------------------- */
app.post("/mcp/register", (req, res) => {
  const client = registerClient();
  res.json({
    ...client,
    token_endpoint: "http://127.0.0.1:8080/mcp/token"
  });
});

app.post("/mcp/token", (req, res) => {
  const token = getToken(req.body);
  res.json(token);
});

/* ----------------------------------------------------------
 *  Discovery endpoint
 * -------------------------------------------------------- */
app.get("/mcp/.well-known", (req, res) => {
  res.json({
    id: "local-mcp-server",
    title: "Local MCP Node Server",
    description: "MCP test server with OAuth + employee CRUD",
    tools: getToolDefinitions().map(tool => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      parameters: tool.inputSchema
    })),
    invoke_url: "http://127.0.0.1:8080/mcp/call",
    registration_endpoint: "http://127.0.0.1:8080/mcp/register",
    token_endpoint: "http://127.0.0.1:8080/mcp/token",
    sse_url: "http://127.0.0.1:8080/mcp/sse"
  });
});

/* ----------------------------------------------------------
 * MCP CALL — Requires OAuth Authorization
 * -------------------------------------------------------- */
app.post("/mcp/call", (req, res) => {
  const auth = verifyAuth(req);
  if (!auth.ok) {
    return res.status(401).json({
      error: "unauthorized",
      message: auth.error
    });
  }

  const { tool, params } = req.body;

  try {
    const result = executeTool(tool, params || {});
    // Extract the text content from MCP format
    const textContent = result.content?.[0]?.text;
    if (textContent) {
      try {
        // Try to parse as JSON for better formatting
        return res.json(JSON.parse(textContent));
      } catch {
        return res.json({ status: "ok", result: textContent });
      }
    }
    return res.json({ status: "ok", result });
  } catch (error) {
    return res.status(400).json({ error: "unknown_tool", message: error.message });
  }
});

/* ----------------------------------------------------------
 * SSE Endpoint (optional)
 * -------------------------------------------------------- */
app.get("/mcp/sse", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  res.write("retry: 10000\n\ndata: {\"type\":\"welcome\"}\n\n");
});

/* ----------------------------------------------------------
 * START SERVER
 * -------------------------------------------------------- */
app.listen(8080, "127.0.0.1", () => {
  console.log("Server running at http://127.0.0.1:8080");
  console.log("Discovery:", "http://127.0.0.1:8080/mcp/.well-known");
});