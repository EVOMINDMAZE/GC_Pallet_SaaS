"""Capture dashboard analytics screenshots with the simplest possible setup.

We register a single user, then create projects + inventory + documents via PB's
REST API (skipping the forms). After seeding, hit /dashboard and capture.
"""
import os, json, time, urllib.request, urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright

FRONTEND = os.environ.get("FRONTEND_URL", "http://127.0.0.1:3000")
PB = os.environ.get("POCKETBASE_URL", "http://127.0.0.1:8090")
OUT = Path("/tmp/gcpallet-dashboard")
OUT.mkdir(parents=True, exist_ok=True)


def pb_post(path, body, token=None):
    req = urllib.request.Request(
        PB + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", **({"Authorization": token} if token else {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.read().decode()


def pb_post_record(coll, body, token):
    return pb_post(f"/api/collections/{coll}/records", body, token=token)


def main():
    suffix = int(time.time() * 1000)
    email = f"demo{suffix}@e2e.local"
    name = "Demo Foreman"

    # 1) Register a user via the UI (the easy part)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        page.goto(f"{FRONTEND}/register", wait_until="networkidle")
        page.fill('input[name="name"]', name)
        page.fill('input[name="email"]', email)
        page.fill('input[name="password"]', 'SuperSecret123!')
        page.click('button[type="submit"]')
        page.wait_for_url(f"{FRONTEND}/dashboard", timeout=15000)
        time.sleep(0.5)

    # 2) Use the user's session token (stored in localStorage) to seed via PB REST.
    #    Read token via the same browser context.
    with sync_playwright() as p:
        # Re-use — easiest is to write/read the token to a file from the same context
        # but browsers exit, so we re-login programmatically via PB.
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        auth = pb_post("/api/collections/_pb_users_auth_/auth-with-password",
                       {"identity": email, "password": "SuperSecret123!"})
        token = auth["token"]
        user_id = auth["record"]["id"]

        # Projects (status must be a valid value)
        statuses = [("Riverside Tower",     "active",     125000, "2025-01-10", "2026-12-20"),
                    ("Oakridge Renovation", "active",      64000, "2025-05-01", "2026-09-15"),
                    ("Pinewood Addition",   "planning",    32000, "2026-08-01", "2027-02-28"),
                    ("Mountainview Office", "completed",  180000, "2024-03-15", "2025-12-01"),
                    ("Maple Street Demo",   "on_hold",     22000, "2025-09-15", "2026-06-30")]
        project_ids = []
        for n, s, b, sd, ed in statuses:
            r = pb_post_record("projects", {
                "name": n, "status": s, "budget": b,
                "start_date": sd, "end_date": ed,
                "user": user_id,
            }, token)
            if isinstance(r, dict) and "id" in r:
                project_ids.append(r["id"])
            else:
                print(f"  project create failed: {r}")
                break

        # Inventory items
        inventory = [
            ("2x4 Lumber",     120, 7.50,  "warehouse", "pieces"),
            ("Drywall 4x8",     44, 12.00, "job_site",  "pieces"),
            ("Concrete Mix",    18, 96.00, "job_site",  "pieces"),
            ("Copper Pipe",     30, 18.50, "in_transit","pieces"),
            ("3in Shingles",    60, 28.00, "warehouse", "pieces"),
            ("Plywood 4x8",     96, 38.00, "warehouse", "pieces"),
            ("Screws #8",      500, 0.10,  "job_site",  "pieces"),
        ]
        for i, (item, qty, cost, loc, unit) in enumerate(inventory):
            pb_post_record("inventory", {
                "item_name": item,
                "quantity": qty,
                "cost_per_unit": cost,
                "location": loc,
                "unit": unit,
                "project": project_ids[0] if project_ids else None,
                "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "user": user_id,
            }, token)

        # Documents (PB requires a file upload — do one via the SDK in the browser)
        page.goto(f"{FRONTEND}/register", wait_until="networkidle")
        # Login as the same user instead
        page.goto(f"{FRONTEND}/login", wait_until="networkidle")
        page.fill('input[name="email"]', email)
        page.fill('input[name="password"]', "SuperSecret123!")
        page.click('button[type="submit"]')
        try:
            page.wait_for_url(f"{FRONTEND}/dashboard", timeout=15000)
        except Exception:
            pass

        # Upload one file
        pdf_path = "/tmp/dashboard-sample.pdf"
        with open(pdf_path, "wb") as f:
            f.write(b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n")
        page.goto(f"{FRONTEND}/documents?project={project_ids[0]}", wait_until="networkidle")
        page.wait_for_timeout(1500)
        try:
            page.click('button:has-text("Upload"):not([role="button"]):has-text("Upload")')
        except Exception:
            pass
        # Try the "New upload" button - it varies. Use modal trigger.
        try:
            page.click('button:has-text("Upload document")')
        except Exception:
            try:
                page.click('button:has-text("New upload")')
            except Exception:
                pass
        page.wait_for_timeout(800)
        try:
            page.fill('input[name="name"]', "Building Permit #42")
            page.set_input_files('input[type="file"]', pdf_path)
            page.click('button[type="submit"]:has-text("Upload")')
            page.wait_for_timeout(2000)
        except Exception as ex:
            print(f"  document upload skipped: {ex}")

        # Capture the dashboard now
        for width in (1280, 1440):
            page.set_viewport_size({"width": width, "height": 900})
            for theme in ("light", "dark"):
                page.goto(f"{FRONTEND}/dashboard", wait_until="networkidle")
                page.wait_for_timeout(1500)
                if theme == "dark":
                    page.click('button[role="radio"][aria-label="Dark"]')
                    page.wait_for_timeout(600)
                page.wait_for_timeout(2500)  # let recharts render
                out = OUT / f"dashboard-{width}-{theme}.png"
                page.screenshot(path=str(out), full_page=True)
                print(f"  {out}  ({out.stat().st_size//1024} KB)")
                if theme == "dark":
                    page.click('button[role="radio"][aria-label="Light"]')
                    page.wait_for_timeout(400)
        browser.close()
    print(f"\nSaved to {OUT}")


if __name__ == "__main__":
    main()
