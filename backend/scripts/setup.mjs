#!/usr/bin/env node
// Bootstrap script: creates all PB collections needed by GC Pallet.
// Idempotent. Run AFTER the superuser is created via PB admin UI.
//
// Usage:
//   PB_URL=http://127.0.0.1:8090 ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret node backend/scripts/setup.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.");
  process.exit(1);
}

async function api(path, opts = {}) {
  const token = opts.token || "";
  const headers = {
    "Content-Type": "application/json",
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: token } : {}),
    ...(opts.headers || {}),
  };
  const res = await fetch(`${PB_URL}/api${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    throw new Error(`${opts.method || "GET"} /api${path} → ${res.status}: ${text}`);
  }
  return json;
}

async function auth() {
  const res = await api("/admins/auth-with-password", {
    method: "POST",
    body: { identity: EMAIL, password: PASSWORD },
  });
  return res.token;
}

async function collectionExists(token, name) {
  const list = await api(`/collections?perPage=200`, { token });
  return list.items.some((c) => c.name === name);
}

async function createUsersExtension(token, usersId) {
  if (await collectionExists(token, "users_extension_done")) return;
  const users = await api(`/collections/${usersId}`, { token });
  const schema = JSON.parse(JSON.stringify(users.schema));
  if (!schema.find((f) => f.name === "company_name")) {
    schema.push({ name: "company_name", type: "text", required: false, options: { max: 200 } });
  }
  if (!schema.find((f) => f.name === "phone")) {
    schema.push({ name: "phone", type: "text", required: false, options: { max: 50 } });
  }
  await api(`/collections/${usersId}`, { method: "PATCH", token, body: { schema } });
  // sentinel
  await api(`/collections`, {
    method: "POST",
    token,
    body: {
      name: "users_extension_done",
      type: "base",
      schema: [{ name: "done", type: "bool", required: false }],
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
  });
}

async function createCollection(token, def) {
  if (await collectionExists(token, def.name)) {
    console.log(`  ✓ ${def.name} already exists`);
    return;
  }
  console.log(`  + creating ${def.name}`);
  await api(`/collections`, { method: "POST", token, body: def });
}

async function main() {
  console.log("Authenticating as admin...");
  const token = await auth();
  console.log("OK");

  const colls = await api(`/collections?perPage=200`, { token });
  const usersCol = colls.items.find((c) => c.name === "users");
  if (!usersCol) throw new Error("users auth collection not found — did PB initialize?");

  console.log("Extending users collection...");
  await createUsersExtension(token, usersCol.id);

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
      {
        name: "status",
        type: "select",
        required: true,
        options: { maxSelect: 1, values: ["planning", "active", "completed", "on_hold"] },
      },
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: usersId, maxSelect: 1, cascadeDelete: true },
      },
    ],
  };

  await createCollection(token, projectsDef);
  const collsAfter = await api(`/collections?perPage=200`, { token });
  const projectsCol = collsAfter.items.find((c) => c.name === "projects");
  const projectsId = projectsCol.id;

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
      {
        name: "file",
        type: "file",
        required: true,
        options: {
          maxSelect: 1,
          maxSize: 50 * 1024 * 1024,
          mimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"],
        },
      },
      {
        name: "category",
        type: "select",
        required: true,
        options: { maxSelect: 1, values: ["contract", "permit", "invoice", "receipt", "photo", "other"] },
      },
      {
        name: "project",
        type: "relation",
        required: true,
        options: { collectionId: projectsId, maxSelect: 1, cascadeDelete: true },
      },
      { name: "uploaded_at", type: "date", required: true, options: {} },
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: usersId, maxSelect: 1, cascadeDelete: true },
      },
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
      {
        name: "unit",
        type: "select",
        required: true,
        options: { maxSelect: 1, values: ["pieces", "lbs", "kg", "sqft", "sqm"] },
      },
      {
        name: "location",
        type: "select",
        required: true,
        options: { maxSelect: 1, values: ["warehouse", "job_site", "in_transit"] },
      },
      { name: "cost_per_unit", type: "number", required: false, options: { min: 0 } },
      {
        name: "project",
        type: "relation",
        required: true,
        options: { collectionId: projectsId, maxSelect: 1, cascadeDelete: true },
      },
      { name: "last_updated", type: "date", required: true, options: {} },
      {
        name: "user",
        type: "relation",
        required: true,
        options: { collectionId: usersId, maxSelect: 1, cascadeDelete: true },
      },
    ],
  };

  await createCollection(token, inventoryDef);

  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
