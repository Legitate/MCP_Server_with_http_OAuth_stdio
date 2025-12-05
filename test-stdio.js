#!/usr/bin/env node

/**
 * Test script for STDIO MCP server
 * 
 * This script tests the STDIO server by sending JSON-RPC messages
 * and reading responses.
 */

import { spawn } from "child_process";
import readline from "readline";

const serverProcess = spawn("node", ["src/stdio-server.js"], {
  stdio: ["pipe", "pipe", "pipe"]
});

const rl = readline.createInterface({
  input: serverProcess.stdout,
  output: process.stdout,
  terminal: false
});

let messageId = 0;
const pendingRequests = new Map();

// Handle responses
rl.on("line", (line) => {
  try {
    const response = JSON.parse(line);
    console.log("\n📥 Response:", JSON.stringify(response, null, 2));

    if (response.id && pendingRequests.has(response.id)) {
      const { resolve, reject } = pendingRequests.get(response.id);
      pendingRequests.delete(response.id);

      if (response.error) {
        reject(response.error);
      } else {
        resolve(response.result);
      }
    }
  } catch (error) {
    console.error("Failed to parse response:", line);
  }
});

// Handle stderr (server logs)
serverProcess.stderr.on("data", (data) => {
  process.stderr.write(data);
});

// Send a JSON-RPC message
function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    messageId++;
    const message = {
      jsonrpc: "2.0",
      id: messageId,
      method,
      params
    };

    pendingRequests.set(messageId, { resolve, reject });
    const messageStr = JSON.stringify(message) + "\n";
    console.log("\n📤 Sending:", JSON.stringify(message, null, 2));
    serverProcess.stdin.write(messageStr);
  });
}

// Send a notification
function sendNotification(method, params = {}) {
  const message = {
    jsonrpc: "2.0",
    method,
    params
  };
  const messageStr = JSON.stringify(message) + "\n";
  console.log("\n📤 Sending notification:", JSON.stringify(message, null, 2));
  serverProcess.stdin.write(messageStr);
}

// Test sequence
async function runTests() {
  console.log("🧪 Starting STDIO MCP Server Tests\n");
  console.log("=" .repeat(50));

  try {
    // Test 1: Initialize
    console.log("\n1️⃣ Testing initialize...");
    const initResult = await sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    });
    console.log("✅ Initialize successful");

    // Test 2: Send initialized notification
    console.log("\n2️⃣ Sending initialized notification...");
    sendNotification("notifications/initialized");
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log("✅ Notification sent");

    // Test 3: List tools
    console.log("\n3️⃣ Testing tools/list...");
    const toolsResult = await sendRequest("tools/list");
    console.log("✅ Tools listed:", toolsResult.tools.length, "tools found");

    // Test 4: Create employee
    console.log("\n4️⃣ Testing employee_create...");
    const createResult = await sendRequest("tools/call", {
      name: "employee_create",
      arguments: {
        name: "Test User",
        department: "Engineering",
        role: "SWE",
        email: "test@example.com"
      }
    });
    console.log("✅ Employee created");

    // Test 5: List employees
    console.log("\n5️⃣ Testing employee_list...");
    const listResult = await sendRequest("tools/call", {
      name: "employee_list",
      arguments: {}
    });
    console.log("✅ Employees listed");

    // Test 6: Invalid method
    console.log("\n6️⃣ Testing invalid method (should fail)...");
    try {
      await sendRequest("invalid/method", {});
      console.log("❌ Should have failed");
    } catch (error) {
      console.log("✅ Correctly rejected invalid method");
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ All tests completed!");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    // Cleanup
    setTimeout(() => {
      serverProcess.kill();
      process.exit(0);
    }, 1000);
  }
}

// Start tests after a short delay
setTimeout(runTests, 500);

