#!/usr/bin/env node
// Test that every Next.js route compiles, serves, and renders sensibly.
// Runs against `next start` on :3000.

const BASE = process.env.FRONTEND_URL || "http://127.0.0.1:3000";

// The auth-gated routes (/projects, /documents) render either
// "Redirecting to login…" (DashboardGate, pre-mount) or "Loading…"
// (DashboardGate post-mount, while SWR is fetching the auth user) in
// their SSR HTML — both are acceptable SSR renders because the gate
// runs client-side. We accept either the expected heading, the redirect
// marker, or the loading marker as a "passing" SSR render.

const routes = [
  // Public marketing
  { path: "/", status: 200, mustContain: ["Run every job site"] },
  { path: "/pricing", status: 200, mustContain: ["Pricing"] },
  { path: "/features", status: 200, mustContain: ["Features"] },
  { path: "/about", status: 200, mustContain: ["About"] },
  { path: "/contact", status: 200, mustContain: ["Contact"] },
  { path: "/legal/privacy", status: 200, mustContain: ["Privacy"] },
  { path: "/legal/terms", status: 200, mustContain: ["Terms"] },
  // Auth
  { path: "/login", status: 200, mustContain: ["Operations Hub"] },
  { path: "/register", status: 200, mustContain: ["Create your account"] },
  // Dashboard (auth-gated)
  { path: "/dashboard", status: 200, mustContainAny: ["Operations overview", "Redirecting to login", "Loading"] },
  { path: "/projects", status: 200, mustContainAny: ["Projects", "Redirecting to login", "Loading"] },
  { path: "/projects/new", status: 200, mustContain: ["New Project"] },
  { path: "/documents", status: 200, mustContainAny: ["Documents", "Redirecting to login", "Loading"] },
  { path: "/inventory", status: 200, mustContainAny: ["Inventory", "Redirecting to login", "Loading"] },
  { path: "/settings", status: 200, mustContainAny: ["Account settings", "Redirecting to login", "Loading"] },
];

let passed = 0;
let failed = 0;

async function main() {
  console.log("\n=== Frontend Route Test ===\n");
  for (const r of routes) {
    let res, body;
    try {
      res = await fetch(BASE + r.path, { redirect: "manual" });
      body = await res.text();
    } catch (e) {
      console.log(`  ✗ ${r.path} (network error: ${e.message})`);
      failed++;
      continue;
    }
    if (res.status !== r.status) {
      console.log(`  ✗ ${r.path} got ${res.status}, want ${r.status}`);
      failed++;
      continue;
    }
    if (r.mustContain) {
      const missing = r.mustContain.filter((s) => !body.includes(s));
      if (missing.length) {
        console.log(`  ✗ ${r.path} missing content: ${missing.join(", ")}`);
        failed++;
        continue;
      }
    } else if (r.mustContainAny) {
      const anyHit = r.mustContainAny.some((s) => body.includes(s));
      if (!anyHit) {
        console.log(`  ✗ ${r.path} missing content (any-of): ${r.mustContainAny.join(", ")}`);
        failed++;
        continue;
      }
    }
    passed++;
    console.log(`  ✓ ${r.path} (${res.status}, ${body.length} bytes)`);
  }
  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed ? 1 : 0);
}
main();
