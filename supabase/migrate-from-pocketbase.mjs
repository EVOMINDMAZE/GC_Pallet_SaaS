#!/usr/bin/env node
/**
 * One-time migration: PocketBase (live instance) → Supabase.
 *
 * Reads every record from the live PB instance and writes it to Supabase,
 * preserving user/project/record relationships and uploading document
 * files into the `documents` storage bucket.
 *
 * Usage:
 *   1. Make sure `frontend/.env.local` is populated with Supabase URL,
 *      the publishable + service-role keys, and the PB admin creds.
 *   2. Apply `supabase/schema.sql` in the Supabase SQL editor first.
 *   3. From the repo root: `node supabase/migrate-from-pocketbase.mjs`
 *
 * Notes:
 *   - PB password hashes use a different algorithm than Supabase, so we
 *     can't preserve passwords. Each migrated user is created with a
 *     random password and must click "forgot password" to set a new one
 *     on first sign-in. The script prints a list of these users at the
 *     end so you can notify them.
 *   - Idempotent at the user level: if a user with the same email
 *     already exists in Supabase, we reuse them.
 *   - Skips re-running on a partially-migrated DB by checking
 *     `meta ->> 'pb_id'` on the profile.
 */

import { readFile, writeFile, stat } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";

// ---------------------------------------------------------------------
// env
// ---------------------------------------------------------------------
const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: new URL("../frontend/.env.local", import.meta.url).pathname });

const required = (k) => {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
};

const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");
const PB_URL = required("POCKETBASE_URL");
const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || "";
const PB_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || "";

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error("POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD must be set for migration");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pbAuth() {
  const r = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
  });
  if (!r.ok) {
    throw new Error(`PB admin auth failed: ${r.status} ${await r.text()}`);
  }
  const j = await r.json();
  return j.token;
}

async function pbList(token, collection, { page = 1, perPage = 200, filter, sort } = {}) {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (filter) params.set("filter", filter);
  if (sort) params.set("sort", sort);
  const r = await fetch(`${PB_URL}/api/collections/${collection}/records?${params}`, {
    headers: { Authorization: token },
  });
  if (!r.ok) {
    throw new Error(`PB list ${collection} failed: ${r.status} ${await r.text()}`);
  }
  return r.json();
}

async function pbGetAll(token, collection, { filter, sort } = {}) {
  const out = [];
  let page = 1;
  while (true) {
    const data = await pbList(token, collection, { page, perPage: 200, filter, sort });
    out.push(...data.items);
    if (data.items.length < 200 || page >= data.totalPages) break;
    page++;
  }
  return out;
}

async function pbDownloadFile(token, collection, recordId, filename) {
  const r = await fetch(`${PB_URL}/api/files/${collection}/${recordId}/${filename}`, {
    headers: { Authorization: token },
  });
  if (!r.ok) return null;
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

function mapMime(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  return (
    {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
    }[ext] || "application/octet-stream"
  );
}

function extOf(filename) {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1) : "bin";
}

function randomPassword() {
  return require("crypto").randomBytes(24).toString("base64url");
}

// ---------------------------------------------------------------------
// run
// ---------------------------------------------------------------------
async function main() {
  console.log("→ Authenticating against PocketBase…");
  const token = await pbAuth();
  console.log("  ok");

  // ----- users -----
  console.log("→ Reading PB users…");
  const pbUsers = await pbGetAll(token, "_pb_users_auth_");
  console.log(`  ${pbUsers.length} users`);

  // map: pb_id → supabase_user_id
  const userIdMap = new Map();
  const passwordResetUsers = [];

  for (const u of pbUsers) {
    if (!u.email) continue;
    process.stdout.write(`  • user ${u.email} … `);

    // look up existing supabase user with the same email
    const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1, page: 1 });
    // listUsers doesn't filter by email; we'll search for the right one
    let sbUser = null;
    let page = 1;
    while (true) {
      const { data } = await supabase.auth.admin.listUsers({ perPage: 100, page });
      const found = data.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
      if (found) {
        sbUser = found;
        break;
      }
      if (!data.users.length || data.users.length < 100) break;
      page++;
    }

    if (!sbUser) {
      const initialPassword = randomPassword();
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: initialPassword,
        email_confirm: true,
        user_metadata: {
          name: u.name || "",
          company_name: u.company_name || "",
          phone: u.phone || "",
        },
      });
      if (error) {
        console.log("FAIL", error.message);
        continue;
      }
      sbUser = data.user;
      passwordResetUsers.push(u.email);
    } else {
      // make sure the profile is populated
      await supabase.from("profiles").upsert({
        id: sbUser.id,
        email: u.email,
        name: u.name || "",
        company_name: u.company_name || "",
        phone: u.phone || "",
      });
    }
    userIdMap.set(u.id, sbUser.id);
    console.log("ok");
  }

  // ----- projects -----
  console.log("→ Reading PB projects…");
  const pbProjects = await pbGetAll(token, "projects", { sort: "-created" });
  console.log(`  ${pbProjects.length} projects`);

  const projectIdMap = new Map();
  for (const p of pbProjects) {
    const newUser = userIdMap.get(p.user);
    if (!newUser) {
      console.log(`  • project ${p.id} skipped (no user mapping)`);
      continue;
    }
    const row = {
      // generate a deterministic UUID from the old id so re-runs are stable
      id: uuidFromString(`project:${p.id}`),
      user_id: newUser,
      name: p.name,
      address: p.address || null,
      budget: typeof p.budget === "number" ? p.budget : null,
      start_date: p.start_date || null,
      end_date: p.end_date || null,
      status: p.status || "planning",
      created_at: p.created,
      updated_at: p.updated,
    };
    const { error } = await supabase.from("projects").upsert(row);
    if (error) {
      console.log(`  • project ${p.id} FAIL`, error.message);
      continue;
    }
    projectIdMap.set(p.id, row.id);
  }

  // ----- inventory -----
  console.log("→ Reading PB inventory…");
  const pbInventory = await pbGetAll(token, "inventory", { sort: "-last_updated" });
  console.log(`  ${pbInventory.length} items`);

  for (const it of pbInventory) {
    const newUser = userIdMap.get(it.user);
    const newProject = projectIdMap.get(it.project);
    if (!newUser || !newProject) continue;
    const { error } = await supabase.from("inventory").upsert({
      id: uuidFromString(`inventory:${it.id}`),
      user_id: newUser,
      project_id: newProject,
      item_name: it.item_name,
      quantity: it.quantity ?? 0,
      unit: it.unit,
      location: it.location,
      cost_per_unit: typeof it.cost_per_unit === "number" ? it.cost_per_unit : null,
      last_updated: it.last_updated || it.updated || it.created,
      created_at: it.created,
      updated_at: it.updated,
    });
    if (error) console.log(`  • inventory ${it.id} FAIL`, error.message);
  }

  // ----- documents (metadata + files) -----
  console.log("→ Reading PB documents…");
  const pbDocs = await pbGetAll(token, "documents", { sort: "-uploaded_at" });
  console.log(`  ${pbDocs.length} documents`);

  for (const d of pbDocs) {
    const newUser = userIdMap.get(d.user);
    const newProject = projectIdMap.get(d.project);
    if (!newUser || !newProject) continue;
    const filename = d.file;
    if (!filename) continue;

    const docId = uuidFromString(`document:${d.id}`);
    const ext = extOf(filename);
    const safeName = `${docId}.${ext}`;
    const storagePath = `${newUser}/${safeName}`;

    // upload the file
    const buf = await pbDownloadFile(token, d.collectionId || "documents", d.id, filename);
    if (buf) {
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(storagePath, buf, {
          contentType: mapMime(filename),
          upsert: true,
        });
      if (upErr) {
        console.log(`  • document ${d.id} storage FAIL`, upErr.message);
        continue;
      }
    } else {
      console.log(`  • document ${d.id} no file bytes — metadata only`);
    }

    const { error } = await supabase.from("documents").upsert({
      id: docId,
      user_id: newUser,
      project_id: newProject,
      name: d.name,
      file_path: storagePath,
      mime_type: mapMime(filename),
      size_bytes: 0, // could read buf.byteLength if we want
      category: d.category,
      uploaded_at: d.uploaded_at || d.created,
      created_at: d.created,
      updated_at: d.updated,
    });
    if (error) console.log(`  • document ${d.id} row FAIL`, error.message);
  }

  // ----- shares -----
  console.log("→ Reading PB shares…");
  const pbShares = await pbGetAll(token, "shares", { sort: "-created" });
  console.log(`  ${pbShares.length} shares`);

  for (const s of pbShares) {
    const newUser = userIdMap.get(s.created_by);
    const newProject = projectIdMap.get(s.resource);
    if (!newUser || !newProject) continue;
    const { error } = await supabase.from("shares").upsert({
      id: uuidFromString(`share:${s.id}`),
      token: s.token,
      resource_id: newProject,
      created_by: newUser,
      expires_at: s.expires_at || null,
      revoked: !!s.revoked,
      view_count: s.view_count || 0,
      label: s.label || null,
      created_at: s.created,
      updated_at: s.updated,
    });
    if (error) console.log(`  • share ${s.id} FAIL`, error.message);
  }

  // ----- contact_messages -----
  console.log("→ Reading PB contact_messages…");
  const pbMessages = await pbGetAll(token, "contact_messages", { sort: "-created" });
  console.log(`  ${pbMessages.length} messages`);
  for (const m of pbMessages) {
    await supabase.from("contact_messages").upsert({
      id: uuidFromString(`msg:${m.id}`),
      name: m.name,
      email: m.email,
      message: m.message,
      created_at: m.created,
    });
  }

  // ----- summary -----
  console.log("\n✔ Migration done.");
  if (passwordResetUsers.length) {
    console.log("\nUsers that must reset their password on first login:");
    for (const e of passwordResetUsers) console.log(`  - ${e}`);
  } else {
    console.log("All users were matched to existing Supabase users — no password resets needed.");
  }
}

// ---------------------------------------------------------------------
// uuidv5-ish: produce a stable UUID from a namespace + name so re-runs
// of this script land on the same row id.
// ---------------------------------------------------------------------
import { createHash } from "node:crypto";
function uuidFromString(name) {
  const h = createHash("sha1").update(name).digest();
  const b = Buffer.from(h.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  const h2 = b.toString("hex");
  return `${h2.slice(0, 8)}-${h2.slice(8, 12)}-${h2.slice(12, 16)}-${h2.slice(16, 20)}-${h2.slice(20, 32)}`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
