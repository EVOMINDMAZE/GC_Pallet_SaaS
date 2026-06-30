#!/usr/bin/env node
// All-in-one bootstrap: starts PB, sets up admin, creates collections. Idempotent.
// Handles PB's "must restart after admin change" rule internally.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=longenoughpass node backend/scripts/bootstrap.mjs
//
// Exits 0 when done. Leaves PB running.

import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PB_DIR = process.env.PB_DIR || resolve(process.cwd(), "backend/pb_data");
const PB_BIN = process.env.PB_BIN || resolve(process.cwd(), "backend/pocketbase");

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) { console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD"); process.exit(1); }
if (ADMIN_PASSWORD.length < 10) { console.error("PB requires admin password ≥ 10 chars"); process.exit(1); }
if (!existsSync(PB_BIN)) { console.error(`PB binary not found at ${PB_BIN}`); process.exit(1); }

function startPB() {
  const p = spawn(PB_BIN, ["--dir", PB_DIR, "serve", "--http=127.0.0.1:8090"], {
    stdio: "ignore",
    detached: true,
  });
  p.unref();
  return p;
}

async function waitForHealth(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${PB_URL}/api/health`);
      if (r.ok) return true;
    } catch {}
    await wait(400);
  }
  return false;
}

async function adminAuth() {
  try {
    const r = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.token || null;
  } catch { return null; }
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (opts.token) headers.Authorization = opts.token;
  const res = await fetch(`${PB_URL}/api${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${opts.method || "GET"} /api${path} → ${res.status} ${text}`);
  return json;
}

async function collectionExists(token, name) {
  const list = await api(`/collections?perPage=200`, { token });
  return list.items.some((c) => c.name === name);
}

async function createCollection(token, def) {
  if (await collectionExists(token, def.name)) {
    console.log(`  ✓ ${def.name}`);
    return;
  }
  console.log(`  + creating ${def.name}`);
  await api(`/collections`, { method: "POST", token, body: def });
}

async function stopProcess(p) {
  if (!p || p.killed || p.exitCode != null) return;
  p.kill("SIGTERM");
  await wait(400);
  if (p.exitCode == null) p.kill("SIGKILL");
  await wait(200);
}

async function ensureAdmin(PBProcessRef) {
  // If already authenticated, nothing to do.
  let token = await adminAuth();
  if (token) return token;

  // We assume PB is running. Stop it before running the admin command.
  await stopProcess(PBProcessRef.current);
  PBProcessRef.current = null;

  let ok = false;
  try {
    execFileSync(PB_BIN, ["--dir", PB_DIR, "admin", "create", ADMIN_EMAIL, ADMIN_PASSWORD], { stdio: "pipe" });
    ok = true;
  } catch {
    try {
      execFileSync(PB_BIN, ["--dir", PB_DIR, "admin", "update", ADMIN_EMAIL, ADMIN_PASSWORD], { stdio: "pipe" });
      ok = true;
    } catch {}
  }
  if (!ok) {
    throw new Error("admin create/update failed");
  }

  // Start PB again.
  PBProcessRef.current = startPB();
  if (!(await waitForHealth())) throw new Error("PB didn't come back");

  for (let i = 0; i < 30; i++) {
    token = await adminAuth();
    if (token) return token;
    await wait(500);
  }
  throw new Error("admin auth never succeeded after restart");
}

async function extendUsers(token, usersId) {
  const users = await api(`/collections/${usersId}`, { token });
  const schema = JSON.parse(JSON.stringify(users.schema));
  const have = new Set(schema.map((f) => f.name));
  if (!have.has("company_name")) schema.push({ name: "company_name", type: "text", required: false, options: { max: 200 } });
  if (!have.has("phone")) schema.push({ name: "phone", type: "text", required: false, options: { max: 50 } });
  if (schema.length !== users.schema.length) {
    await api(`/collections/${usersId}`, { method: "PATCH", token, body: { schema } });
    console.log("  ✓ extended users");
  } else {
    console.log("  ✓ users already extended");
  }
}

async function main() {
  console.log("→ starting PocketBase");
  const PBProcessRef = { current: null };
  // Try to start PB (no-op if already running)
  PBProcessRef.current = startPB();
  // Check if it actually came up
  const up = await waitForHealth();
  if (!up) {
    PBProcessRef.current.kill("SIGKILL");
    PBProcessRef.current = null;
    throw new Error("PB failed to start");
  }
  console.log("  ✓ PB up");

  console.log("→ admin authentication");
  const token = await ensureAdmin(PBProcessRef);
  console.log("  ✓ admin authenticated");

  console.log("→ collections");
  const list = await api(`/collections?perPage=200`, { token });
  const usersCol = list.items.find((c) => c.name === "users");
  if (!usersCol) throw new Error("users auth collection missing");

  await extendUsers(token, usersCol.id);
  const usersId = usersCol.id;

  const projectsDef = {
    name: "projects",
    type: "base",
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
    schema: [
      { name: "name", type: "text", required: true, options: { max: 200 } },
      { name: "address", type: "text", required: false, options: { max: 500 } },
      { name: "budget", type: "number", required: false, options: { min: 0 } },
      { name: "start_date", type: "date", required: false, options: {} },
      { name: "end_date", type: "date", required: false, options: {} },
      { name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["planning", "active", "completed", "on_hold"] } },
      { name: "user", type: "relation", required: true, options: { collectionId: usersId, maxSelect: 1, cascadeDelete: true } },
    ],
  };
  await createCollection(token, projectsDef);
  const list2 = await api(`/collections?perPage=200`, { token });
  const projectsId = list2.items.find((c) => c.name === "projects").id;

  const documentsDef = {
    name: "documents",
    type: "base",
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
    schema: [
      { name: "name", type: "text", required: true, options: { max: 255 } },
      { name: "file", type: "file", required: true, options: { maxSelect: 1, maxSize: 50 * 1024 * 1024, mimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"] } },
      { name: "category", type: "select", required: true, options: { maxSelect: 1, values: ["contract", "permit", "invoice", "receipt", "photo", "other"] } },
      { name: "project", type: "relation", required: true, options: { collectionId: projectsId, maxSelect: 1, cascadeDelete: true } },
      { name: "uploaded_at", type: "date", required: true, options: {} },
      { name: "user", type: "relation", required: true, options: { collectionId: usersId, maxSelect: 1, cascadeDelete: true } },
    ],
  };
  await createCollection(token, documentsDef);

  const inventoryDef = {
    name: "inventory",
    type: "base",
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
    schema: [
      { name: "item_name", type: "text", required: true, options: { max: 200 } },
      { name: "quantity", type: "number", required: true, options: { min: 0 } },
      { name: "unit", type: "select", required: true, options: { maxSelect: 1, values: ["pieces", "lbs", "kg", "sqft", "sqm"] } },
      { name: "location", type: "select", required: true, options: { maxSelect: 1, values: ["warehouse", "job_site", "in_transit"] } },
      { name: "cost_per_unit", type: "number", required: false, options: { min: 0 } },
      { name: "project", type: "relation", required: true, options: { collectionId: projectsId, maxSelect: 1, cascadeDelete: true } },
      { name: "last_updated", type: "date", required: true, options: {} },
      { name: "user", type: "relation", required: true, options: { collectionId: usersId, maxSelect: 1, cascadeDelete: true } },
    ],
  };
  await createCollection(token, inventoryDef);

  console.log("\n✓ Bootstrap complete. PB running at", PB_URL);
}

main().catch((e) => { console.error("ERROR:", e.message || e); process.exit(1); });
