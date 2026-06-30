// Headless E2E test for GC Pallet.
// Requires: PocketBase running at PB_URL, collections already created (via bootstrap.mjs).
// Exits non-zero on any failure.

import { writeFileSync } from "node:fs";

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";

let passed = 0;
let failed = 0;
const log = [];

function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    log.push(`  ✓ ${name}`);
    console.log(`  ✓ ${name}${detail ? " " + detail : ""}`);
  } else {
    failed++;
    log.push(`  ✗ ${name} ${detail}`);
    console.error(`  ✗ ${name}${detail ? " " + detail : ""}`);
  }
}

async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.token) headers.Authorization = opts.token;
  let body = opts.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const res = await fetch(`${PB_URL}/api${path}`, {
    method: opts.method || "GET",
    headers,
    body,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: res.status, ok: res.ok, text, json };
}

function bemail() { return `user-${Math.random().toString(36).slice(2, 10)}@test.local`; }

async function registerUser(email, password, name) {
  const r = await api("/collections/users/records", {
    method: "POST",
    body: {
      email,
      password,
      passwordConfirm: password,
      name,
      emailVisibility: true,
    },
  });
  return r;
}

async function login(email, password) {
  const r = await api("/collections/users/auth-with-password", {
    method: "POST",
    body: { identity: email, password },
  });
  return r;
}

async function main() {
  console.log("\n=== GC Pallet Headless E2E ===\n");

  // ============== 1. Health ==============
  console.log("## 1. Backend health");
  const health = await api("/health");
  ok("PB healthy", health.ok, `(status ${health.status})`);

  // ============== 2. User flow ==============
  console.log("\n## 2. Auth (register + login)");
  const userAEmail = bemail();
  const userBEmail = bemail();
  const passwordA = "supersecret123";
  const passwordB = "supersecret123";

  const regA = await registerUser(userAEmail, passwordA, "Alice Builder");
  ok("register user A", regA.ok, `(${userAEmail})`);
  if (!regA.ok) throw new Error(`register failed: ${regA.text}`);
  const userAId = regA.json.id;

  const regB = await registerUser(userBEmail, passwordB, "Bob Builder");
  ok("register user B", regB.ok);

  const loginA = await login(userAEmail, passwordA);
  ok("login user A", loginA.ok && !!loginA.json?.token);
  const tokenA = loginA.json.token;
  const modelA = loginA.json.record;

  const loginB = await login(userBEmail, passwordB);
  ok("login user B", loginB.ok && !!loginB.json?.token);
  const tokenB = loginB.json.token;

  // ============== 3. Projects CRUD ==============
  console.log("\n## 3. Projects CRUD");
  const projA = await api("/collections/projects/records", {
    method: "POST",
    token: tokenA,
    body: {
      name: "Riverside Renovation",
      address: "123 Main St, Springfield, IL",
      budget: 25000,
      start_date: "2026-07-01 00:00:00.000Z",
      end_date: "2026-12-31 00:00:00.000Z",
      status: "active",
      user: userAId,
    },
  });
  ok("create project (user A)", projA.ok, `(${projA.json?.id})`);
  const projAId = projA.json.id;

  const projB = await api("/collections/projects/records", {
    method: "POST",
    token: tokenB,
    body: { name: "Bob's Project", status: "planning", user: loginB.json.record.id },
  });
  ok("create project (user B)", projB.ok);

  const listA = await api("/collections/projects/records?perPage=100", { token: tokenA });
  ok("user A sees only their projects", listA.ok && listA.json.items.every((p) => p.user === userAId));
  ok("user A sees at least 1 project", (listA.json.items?.length || 0) >= 1);
  const crossList = listA.json.items.some((p) => p.user !== userAId);
  ok("user A does NOT see user B's projects", !crossList);

  // Update
  const updateA = await api(`/collections/projects/records/${projAId}`, {
    method: "PATCH",
    token: tokenA,
    body: { status: "completed" },
  });
  ok("update own project", updateA.ok && updateA.json.status === "completed");

  // Cross-user update must fail
  const crossUpdate = await api(`/collections/projects/records/${projAId}`, {
    method: "PATCH",
    token: tokenB,
    body: { status: "on_hold" },
  });
  ok("cross-user update blocked (4xx)", !crossUpdate.ok && crossUpdate.status >= 400 && crossUpdate.status < 500);

  // ============== 4. Inventory CRUD ==============
  console.log("\n## 4. Inventory CRUD");
  const inv1 = await api("/collections/inventory/records", {
    method: "POST",
    token: tokenA,
    body: {
      item_name: "2x4 lumber",
      quantity: 120,
      unit: "pieces",
      location: "warehouse",
      cost_per_unit: 4.5,
      project: projAId,
      last_updated: new Date().toISOString(),
      user: userAId,
    },
  });
  ok("add inventory item", inv1.ok);
  const inv1Id = inv1.json.id;

  const inv2 = await api("/collections/inventory/records", {
    method: "POST",
    token: tokenA,
    body: {
      item_name: "Drywall sheets",
      quantity: 30,
      unit: "pieces",
      location: "job_site",
      cost_per_unit: 12.0,
      project: projAId,
      last_updated: new Date().toISOString(),
      user: userAId,
    },
  });
  ok("add 2nd inventory item", inv2.ok);

  const listInvA = await api("/collections/inventory/records?perPage=100", { token: tokenA });
  ok("user A list inventory returns items",
    listInvA.ok && listInvA.json.items.length >= 2,
    `(${listInvA.json?.items?.length} items)`);
  ok("user B sees no inventory", await (async () => {
    const r = await api("/collections/inventory/records?perPage=100", { token: tokenB });
    return r.ok && r.json.items.length === 0;
  })());

  const totalA = listInvA.json.items.reduce(
    (s, it) => s + (it.cost_per_unit || 0) * it.quantity,
    0
  );
  ok("inventory total value", totalA === 120 * 4.5 + 30 * 12.0, `($${totalA.toFixed(2)})`);

  // Delete
  const del1 = await api(`/collections/inventory/records/${inv1Id}`, {
    method: "DELETE",
    token: tokenA,
  });
  ok("delete inventory item", del1.ok);

  // ============== 5. Documents (file upload) ==============
  console.log("\n## 5. Documents (upload + serve)");
  const pdfBytes = Buffer.from("%PDF-1.4\n% mock test pdf\ntrailer\n<<>>\n%%EOF\n", "utf8");
  const fd = new FormData();
  fd.append("name", "Building Permit");
  fd.append("category", "permit");
  fd.append("project", projAId);
  fd.append("uploaded_at", new Date().toISOString());
  fd.append("user", userAId);
  fd.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "permit.pdf");
  const upRes = await api("/collections/documents/records", {
    method: "POST",
    token: tokenA,
    body: fd,
  });
  ok("upload PDF document", upRes.ok, `(${upRes.json?.id}) [status ${upRes.status} body ${upRes.text?.slice(0, 100)}]`);
  const docId = upRes.json.id;
  const docFile = upRes.json.file;
  ok("document has filename", !!docFile, `(file=${docFile})`);

  // Fetch via the file URL
  const fileUrlRes = await fetch(`${PB_URL}/api/files/documents/${docId}/${docFile}`);
  ok("GET file URL returns 200", fileUrlRes.status === 200, `(status ${fileUrlRes.status})`);
  if (fileUrlRes.status === 200) {
    const dlBytes = await fileUrlRes.arrayBuffer();
    ok("downloaded bytes match original", Buffer.from(dlBytes).toString("utf8") === pdfBytes.toString("utf8"));
  } else {
    const t = await fileUrlRes.text();
    console.log("    file fetch body:", t.slice(0, 100));
  }

  // ============== 6. Unauthenticated ==============
  console.log("\n## 6. Unauthenticated access");
  const noauth = await api("/collections/projects/records");
  // PB returns 200 with empty list when listRule blocks (0 results); 400 if rule rejected.
  // Either way, the test data must not be visible.
  const unauthItems = noauth.json?.items || [];
  ok("unauthenticated list blocked or empty",
    !noauth.ok || noauth.status === 200,
    `status ${noauth.status}`);
  ok("unauthenticated cannot see any projects",
    unauthItems.length === 0,
    `(${unauthItems.length} items leaked)`);

  // ============== 7. Summary ==============
  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===\n`);
  writeFileSync("/tmp/e2e-result.txt", `${passed} passed, ${failed} failed\n${log.join("\n")}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
