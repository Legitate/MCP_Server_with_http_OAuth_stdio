import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKENS_FILE = path.join(__dirname, "..", "data", "tokens.json");

// In-memory store
const registeredClients = new Map();

// Load tokens from file
export function loadTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

// Keep the old function for backward compatibility
function loadTokensInternal() {
  return loadTokens();
}

// Save tokens to file
function saveTokens(tokens) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export function registerClient() {
  const client_id = "client-" + uuidv4();
  const client_secret = uuidv4().replace(/-/g, "");

  const client = {
    client_id,
    client_secret,
    redirect_uris: []
  };

  registeredClients.set(client_id, client);

  return client;
}

export function getToken(body) {
  const { grant_type, client_id, client_secret } = body;

  if (grant_type !== "client_credentials") {
    return { error: "unsupported_grant_type" };
  }

  const client = registeredClients.get(client_id);
  if (!client || client.client_secret !== client_secret) {
    return { error: "invalid_client" };
  }

  const token = uuidv4().replace(/-/g, "");
  const expiresIn = 3600; // 1 hour
  const createdAt = Date.now();

  // Save token to file
  const tokens = loadTokensInternal();
  tokens.push({
    access_token: token,
    token_type: "bearer",
    expires_in: expiresIn,
    scope: "",
    client_id: client_id,
    created_at: createdAt
  });
  saveTokens(tokens);

  return {
    access_token: token,
    token_type: "bearer",
    expires_in: expiresIn
  };
}

// verify Authorization: Bearer <token>
export function verifyAuth(req) {
  const header = req.headers.authorization;

  if (!header) return { ok: false, error: "Authorization header missing" };

  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token)
    return { ok: false, error: "Invalid Authorization format" };

  // Verify token exists and is not expired
  const tokens = loadTokensInternal();
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