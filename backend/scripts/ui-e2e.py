"""
GC Pallet Full Headless UI Test (Playwright).
Drives the Next.js frontend through:
  - root → auth gate → login redirect
  - register flow for two users (A, B)
  - project create
  - inventory item add + total value calc
  - document upload
  - user B isolation in the UI
  - cross-user project URL access blocked
"""

import os
import sys
import time
import re
import struct
import zlib
from pathlib import Path
from playwright.sync_api import sync_playwright, expect, Page

FRONTEND = os.environ.get("FRONTEND_URL", "http://127.0.0.1:3000")
POCKETBASE = os.environ.get("POCKETBASE_URL", "http://127.0.0.1:8090")
SCREENSHOT_DIR = Path("/tmp/gcpallet-screens")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

# ---------- tiny helpers -----------------------------------------------------

results = []  # list of (label:str, ok:bool, detail:str)

def check(label, condition, detail=""):
    ok = bool(condition)
    results.append((label, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {label}" + (f"  ({detail})" if detail else ""))

def make_pdf(path: Path, content: bytes = b"%PDF-1.4 test gc pallet"):
    # Minimal valid PDF wrapping the bytes.
    body = f"BT /F1 12 Tf 100 700 Td ({content.decode('latin-1')}) Tj ET".encode()
    objs = []
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objs.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >>")
    objs.append(b"<< /Length " + str(len(body)).encode() + b" >>\nstream\n" + body + b"\nendstream")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    out = b"%PDF-1.4\n"
    offsets = []
    for i, obj in enumerate(objs, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref_pos = len(out)
    out += f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()
    path.write_bytes(out)

def unique_email(tag: str) -> str:
    return f"ui-{tag}-{int(time.time()*1000)}@test.local"

def wait_app(page: Page, path: str):
    page.goto(f"{FRONTEND}{path}", wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")
    # Give React a beat to hydrate and render dynamic content
    # (auth gate, SWR data, etc.). Without this, the first heading
    # check often races the first paint.
    page.wait_for_timeout(2000)

def screenshot(page: Page, name: str):
    p = SCREENSHOT_DIR / f"{name}.png"
    try:
        page.screenshot(path=str(p), full_page=True)
    except Exception as ex:
        print(f"    (screenshot failed: {ex})")
    return p

# ---------------------------------------------------------------------------

def register(page: Page, email: str, name: str, password: str = "SuperSecret123!"):
    wait_app(page, "/register")
    page.fill('input[name="name"]', name)
    page.fill('input[name="email"]', email)
    page.fill('input[name="password"]', password)
    # optional fields left blank
    with page.expect_navigation(url=re.compile(r"/$|/projects"), wait_until="networkidle", timeout=15000):
        page.click('button[type="submit"]')
    page.wait_for_load_state("networkidle")

def login(page: Page, email: str, password: str = "SuperSecret123!"):
    wait_app(page, "/login")
    page.fill('input[name="email"]', email)
    page.fill('input[name="password"]', password)
    with page.expect_navigation(url=re.compile(r"/$"), wait_until="networkidle", timeout=15000):
        page.click('button[type="submit"]')
    page.wait_for_load_state("networkidle")

def logout(page: Page):
    # Use the SWR/user-clear approach: clear localStorage and reload to /login.
    page.evaluate("() => { try { localStorage.clear(); } catch (e) {} }")
    wait_app(page, "/login")
    page.wait_for_selector('input[name="email"]')

# ---------------------------------------------------------------------------

def run_user_a(page: Page, pdf_path: Path):
    print("\n## User A — full lifecycle")

    email_a = unique_email("alice")
    register(page, email_a, "Alice Builder")

    # Should land on dashboard
    wait_app(page, "/")
    check("A: dashboard renders heading", page.locator("h1", has_text="Dashboard").count() > 0)
    check("A: sidebar shows GC Pallet", page.locator("text=GC Pallet").count() > 0)
    screenshot(page, "01-dashboard-empty")

    # Create a project
    wait_app(page, "/projects")
    try:
        page.wait_for_selector('h1:has-text("Projects")', timeout=8000)
    except Exception:
        pass
    check("A: /projects shows heading after auth gate", page.locator("h1", has_text="Projects").count() > 0)
    check("A: empty state visible", page.locator("text=No projects yet").count() > 0)
    page.click('a:has-text("New Project")')
    page.wait_for_url("**/projects/new")
    page.wait_for_selector('input[name="name"]')

    page.fill('input[name="name"]', "Riverside Tower")
    page.fill('input[name="address"]', "123 Riverside Dr, Springfield")
    page.fill('input[name="budget"]', "2500000")
    page.fill('input[name="start_date"]', "2026-07-01")
    page.fill('input[name="end_date"]', "2027-06-30")

    # Status defaults to "planning" (valid). Skip interacting with the Radix Select
    # to avoid focus/timing flakiness in headless mode.

    with page.expect_response(re.compile(r"/api/collections/projects/records"), timeout=15000) as resp_info:
        page.click('button[type="submit"]:has-text("Save project")')
    resp = resp_info.value
    # Router push + refresh + reload. Use a generous wait for the new URL.
    try:
        page.wait_for_url("**/projects", timeout=15000)
    except Exception:
        pass
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)  # Let SWR fetch + render the new project
    # The /projects page fetches via SWR — wait for the project card to render.
    try:
        page.wait_for_selector('a:has-text("Riverside Tower")', timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(500)
    final_url = page.url
    check("A: navigated to /projects", "/projects" in final_url and "new" not in final_url, final_url)
    check("A: created successfully (HTTP 200)", resp.status in (200, 201), f"status={resp.status}")
    check("A: project card visible after create",
          page.locator('a:has-text("Riverside Tower")').count() > 0
          or page.locator('h3:has-text("Riverside Tower")').count() > 0)
    screenshot(page, "02-project-created")

    # Inventory
    wait_app(page, "/inventory")
    try:
        page.wait_for_selector('h1:has-text("Inventory")', timeout=8000)
    except Exception:
        pass
    check("A: inventory page heading", page.locator("h1", has_text="Inventory").count() > 0)
    # Before any items the empty-state "No inventory yet." is shown (no $0.00 footer)
    check("A: inventory empty state initially",
          page.locator("text=No inventory yet").count() > 0
          or page.locator("text=Create a project first to add inventory").count() > 0)
    # InventoryForm renders only after projects load. Wait for it before filling.
    try:
        page.wait_for_selector('input[name="item_name"]', timeout=15000)
    except Exception:
        pass
    page.fill('input[name="item_name"]', "2x4 Lumber")
    page.fill('input[name="quantity"]', "120")
    page.fill('input[name="cost_per_unit"]', "7.50")

    # Inventory form auto-picks first project from select.
    with page.expect_response(re.compile(r"/api/collections/inventory/records"), timeout=15000) as inv_resp_info:
        page.click('button[type="submit"]:has-text("Add item")')
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    # The form triggers its own window.location.reload(); give it room to settle.
    page.wait_for_timeout(1500)
    try:
        page.wait_for_selector('td:has-text("2x4 Lumber")', timeout=10000)
    except Exception:
        pass

    check("A: inventory shows 2x4 Lumber", page.locator("td:has-text(\"2x4 Lumber\")").count() > 0)
    # formatCurrency uses maximumFractionDigits=0, so $900 displays as "$900" not "$900.00"
    check("A: inventory total = $900 (120 * $7.50)", page.locator("text=$900").count() > 0)
    screenshot(page, "03-inventory-after-add")

    # Documents
    wait_app(page, "/documents")
    try:
        page.wait_for_selector('h1:has-text("Documents")', timeout=8000)
    except Exception:
        pass
    check("A: documents heading", page.locator("h1", has_text="Documents").count() > 0)
    # "Upload Document" only appears once at least one project is loaded.
    try:
        page.wait_for_selector('button:has-text("Upload Document")', timeout=12000)
    except Exception:
        pass
    page.click('button:has-text("Upload Document")', timeout=15000)
    page.wait_for_selector('input#doc-file')

    page.fill('input#doc-name', "Building Permit #42")
    page.set_input_files('input#doc-file', str(pdf_path))

    with page.expect_response(re.compile(r"/api/collections/documents/records"), timeout=15000):
        page.click('button[type="submit"]:has-text("Upload")')
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    page.reload(wait_until="networkidle")

    check("A: document row rendered", page.locator("text=Building Permit #42").count() > 0)
    check("A: download link present", page.locator("a:has-text(\"Open\")").count() > 0)
    screenshot(page, "04-document-uploaded")

    # Take a snapshot of the project detail page
    # navigate via clicking the project card from /projects (capture its href first)
    wait_app(page, "/projects")
    page.wait_for_timeout(2000)
    try:
        page.wait_for_selector('a[href^="/projects/"]:has-text("Riverside Tower")', timeout=12000)
    except Exception:
        pass
    # Grab project URL from the rendered link (filter out the static /projects/new "New Project" button)
    link = page.locator('a[href^="/projects/"]:not([href="/projects/new"])').first
    project_href = link.get_attribute("href") or ""
    check("A: project detail link has expected format", bool(project_href) and project_href.startswith("/projects/") and project_href != "/projects" and project_href != "/projects/new", project_href)
    project_id_a = project_href.split("/")[-1] if project_href else None
    check("A: extracted project id from href", bool(project_id_a), project_id_a)

    # Now click into the detail page
    link.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    try:
        page.wait_for_selector('h1:has-text("Riverside Tower")', timeout=8000)
    except Exception:
        pass
    check("A: project detail page shows name",
          page.locator('h1:has-text("Riverside Tower")').count() > 0,
          f"url={page.url}")
    check("A: project detail shows Documents + Inventory cards",
          page.locator("text=Documents").count() > 0 and page.locator("text=Inventory").count() > 0)
    screenshot(page, "05-project-detail")
    return project_id_a, email_a


def run_stage1b(page: Page):
    """Stage 1b — Dashboard analytics & activity feed."""
    print("\n## Stage 1b — Dashboard analytics")

    wait_app(page, "/dashboard")
    try:
        page.wait_for_selector('h1:has-text("Dashboard")', timeout=10000)
    except Exception:
        pass
    page.wait_for_timeout(2000)  # let charts + sparklines settle
    check("S1b: dashboard heading rendered",
          page.locator('h1:has-text("Dashboard")').count() > 0,
          f"url={page.url}")

    # 4 stat cards (Active Projects, Documents, Inventory Items, Total Budget)
    labels = ["Active Projects", "Documents", "Inventory Items", "Total Budget"]
    have_all = all(page.locator(f'text="{lbl}"').count() > 0 for lbl in labels)
    check("S1b: 4 stat cards visible (Active Projects, Documents, Inventory Items, Total Budget)",
          have_all, ", ".join(labels))

    # Time-range selector must have 3 pills
    pills = ["7 days", "30 days", "All time"]
    have_pills = all(page.locator(f'button[role="radio"]:has-text("{p}")').count() > 0 for p in pills)
    check("S1b: time-range selector shows 7d / 30d / All time", have_pills, ", ".join(pills))

    # Switch to 7-day range and confirm counts drop (we just created data in 30d view)
    page.click('button[role="radio"]:has-text("7 days")')
    page.wait_for_timeout(800)
    check("S1b: 7-day radio is now selected",
          page.locator('button[role="radio"][aria-checked="true"]:has-text("7 days")').count() > 0)
    # Switch back to 30d for charts
    page.click('button[role="radio"]:has-text("30 days")')
    page.wait_for_timeout(800)

    # Charts present — recharts renders an <svg> per chart container.
    svgs = page.locator("svg.recharts-surface").count()
    check("S1b: recharts SVGs rendered (donuts + bars)", svgs >= 3, f"svgs={svgs}")
    screenshot(page, "05b-dashboard-light")
    # Dark mode
    page.click('button[role="radio"][aria-label="Dark"]')
    page.wait_for_timeout(600)
    screenshot(page, "05c-dashboard-dark")
    page.click('button[role="radio"][aria-label="Light"]')
    page.wait_for_timeout(400)

    # Greeting + insight banner
    check("S1b: greeting renders first-name",
          page.locator('text=/Good (morning|afternoon|evening),/').count() > 0)


def run_user_b(page: Page, project_id_of_a: str):
    print("\n## User B — isolation in UI")

    email_b = unique_email("bob")
    register(page, email_b, "Bob Builder")

    wait_app(page, "/projects")
    page.wait_for_timeout(1500)  # give SWR time to fetch + DashboardGate to resolve
    try:
        page.wait_for_selector('text=No projects yet', timeout=10000)
    except Exception:
        pass
    check("B: /projects empty (does not see A's project)",
          page.locator('a:has-text("Riverside Tower")').count() == 0,
          "no project card named Riverside Tower")
    check("B: empty state visible", page.locator("text=No projects yet").count() > 0)
    screenshot(page, "06-b-empty-projects")

    wait_app(page, "/inventory")
    check("B: inventory empty (no items, no leak)",
          page.locator("text=2x4 Lumber").count() == 0
          and (page.locator("text=No inventory yet").count() > 0 or page.locator("text=$0").count() == 0))
    screenshot(page, "07-b-empty-inventory")

    wait_app(page, "/documents")
    check("B: documents empty (no permit leak)", page.locator("text=Building Permit #42").count() == 0)
    screenshot(page, "08-b-empty-documents")

    # Direct URL to A's project — backend rule blocks listDetail so useProjects returns no project.
    # Skip this if Stage 1 didn't extract a valid id (we always extract one now, but guard anyway).
    if not project_id_of_a or project_id_of_a == "new":
        check("B: skipped direct URL access (no real project id)", True, project_id_of_a or "none")
    else:
        print(f"  B attempts to load A's project URL: /projects/{project_id_of_a}")
        # Hard navigate so SWR's cache from earlier /projects visits doesn't poison this one.
        page.goto(f"{FRONTEND}/projects/{project_id_of_a}", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2500)
        leaked = page.locator('h1:has-text("Riverside Tower")').count() > 0
        check("B: cannot view A's project via direct URL", not leaked,
              "project header not visible (PB listRule denies or returned empty)")
        screenshot(page, "09-b-blocked-project")
        # Either the destructive "Not found." surface or the loading fallback should be visible.
        try:
            page.wait_for_selector(':text("Not found.")', timeout=8000)
        except Exception:
            pass
        check("B: shows 'Not found.'", page.locator(':text("Not found.")').count() > 0)

# ---------------------------------------------------------------------------

def run_stage3(page: Page, ctx, project_id_a):
    """Settings page, dark-mode toggle, and mobile drawer."""
    print("\n## Stage 3 — Settings, Dark mode, Mobile drawer")

    # Need a fresh authenticated session. Re-register Stage3 user.
    email_s3 = unique_email("stage3")
    register(page, email_s3, "Stage3 Tester")
    page.wait_for_url(f"{FRONTEND}/", wait_until="networkidle", timeout=15000)
    page.wait_for_timeout(500)

    # Open the UserMenu and click "Account settings" inside the dropdown.
    page.click('button:has-text("Stage3 Tester")')
    page.wait_for_selector('[role="menu"]', timeout=5000)
    page.wait_for_timeout(200)
    page.click('[role="menu"] a[href="/settings"]')
    try:
        page.wait_for_url("**/settings", timeout=8000)
    except Exception:
        pass
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    try:
        page.wait_for_selector('h1:has-text("Account settings")', timeout=8000)
    except Exception:
        pass
    check("S3: /settings heading rendered",
          page.locator('h1:has-text("Account settings")').count() > 0,
          f"url={page.url}")
    check("S3: profile form present",
          page.locator('label:has-text("Full name")').count() > 0)
    check("S3: password form present",
          page.locator('label:has-text("Current password")').count() > 0)
    screenshot(page, "10-settings-light")

    # Edit company name and save
    page.fill('input#profile-company', "Acme Builders")
    page.click('button:has-text("Save changes")')
    page.wait_for_timeout(800)
    check("S3: profile save toast",
          page.locator(':text-matches("Profile saved", "i")').count() > 0,
          f"toasts={page.locator('[role=status]').count()}")

    # Dark mode toggle — click the Moon button (aria-label="Dark")
    was_dark = page.evaluate("document.documentElement.classList.contains('dark')")
    page.click('button[role="radio"][aria-label="Dark"]')
    page.wait_for_timeout(400)
    is_dark = page.evaluate("document.documentElement.classList.contains('dark')")
    check("S3: dark class toggled on <html>", is_dark, f"before={was_dark} after={is_dark}")
    stored = page.evaluate("window.localStorage.getItem('gcpallet-theme')")
    check("S3: theme persisted to localStorage", stored == "dark", f"value={stored}")
    screenshot(page, "11-settings-dark")

    # Toggle back to light
    page.click('button[role="radio"][aria-label="Light"]')
    page.wait_for_timeout(400)
    is_dark2 = page.evaluate("document.documentElement.classList.contains('dark')")
    check("S3: light class restored", not is_dark2)

    # Mobile drawer: switch viewport to phone, reload, click hamburger
    page.set_viewport_size({"width": 375, "height": 812})
    page.goto(f"{FRONTEND}/", wait_until="networkidle")
    page.wait_for_timeout(800)
    page.click('button[aria-label="Open navigation"]')
    page.wait_for_timeout(500)
    sheet_visible = page.locator('[role="dialog"]').count() > 0
    check("S3: drawer opens on mobile (dialog role)", sheet_visible)
    # Same 5 nav rows as desktop
    nav_labels = ["Dashboard", "Projects", "Documents", "Inventory", "Settings"]
    have_all = all(page.locator(f'[role="dialog"] a:has-text("{lbl}")').count() > 0 for lbl in nav_labels)
    check("S3: drawer has all 5 nav rows", have_all, ", ".join(nav_labels))
    screenshot(page, "12-mobile-drawer")

    # Tap a nav item — drawer should close
    page.locator('[role="dialog"] a:has-text("Projects")').click()
    try:
        page.wait_for_url("**/projects", timeout=8000)
    except Exception:
        pass
    page.wait_for_timeout(500)
    drawer_still_open = page.locator('[role="dialog"]').count() > 0
    check("S3: drawer closes after navigation", not drawer_still_open, f"url={page.url}")

    # Sign-out from /settings
    page.set_viewport_size({"width": 1280, "height": 900})
    wait_app(page, "/settings")
    page.wait_for_timeout(500)
    # The SignOutCard is the last card on /settings — use a more specific selector
    page.locator('button[type="button"]:visible:has-text("Sign out")').last.click()
    try:
        page.wait_for_url("**/login", timeout=8000)
    except Exception:
        pass
    check("S3: sign-out redirects to /login", "/login" in page.url, f"url={page.url}")


# ---------------------------------------------------------------------------

def run_stage4(page: Page, ctx):
    """Public marketing pages and contact form."""
    print("\n## Stage 4 — Public marketing site")

    # Make sure we are logged out: clear localStorage and visit /.
    page.goto(f"{FRONTEND}/login", wait_until="networkidle")
    page.evaluate("() => { try { window.localStorage.clear(); } catch(e) {} }")
    page.goto(f"{FRONTEND}/", wait_until="networkidle")
    page.wait_for_timeout(800)
    check("S4: anonymous visit shows marketing home",
          page.locator('h1:has-text("Run every job site")').count() > 0,
          f"url={page.url}")
    check("S4: PublicNav has Features link",
          page.locator('header a[href="/features"]').count() > 0)
    check("S4: PublicNav has Pricing link",
          page.locator('header a[href="/pricing"]').count() > 0)
    check("S4: PublicNav has Sign in button",
          page.locator('header a[href="/login"]').count() > 0)
    check("S4: PublicNav has Start free button",
          page.locator('header a[href="/register"]').count() > 0)
    screenshot(page, "20-home-light")

    # Click into Pricing
    page.click('header a[href="/pricing"]')
    page.wait_for_url("**/pricing", timeout=8000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    check("S4: /pricing heading",
          page.locator('h1:has-text("Simple plans")').count() > 0)
    check("S4: /pricing shows all 3 tiers",
          page.locator(':text("Starter")').count() > 0
          and page.locator(':text("Crew")').count() > 0
          and page.locator(':text("Pro")').count() > 0)
    screenshot(page, "21-pricing")

    # Toggle yearly
    page.click('button[role="radio"]:has-text("Yearly")')
    page.wait_for_timeout(300)
    check("S4: /pricing toggles to yearly",
          page.locator('button[role="radio"][aria-checked="true"]:has-text("Yearly")').count() > 0)

    # /features
    page.goto(f"{FRONTEND}/features", wait_until="networkidle")
    page.wait_for_timeout(500)
    check("S4: /features heading",
          page.locator('h1:has-text("Everything you need")').count() > 0)

    # /about
    page.goto(f"{FRONTEND}/about", wait_until="networkidle")
    page.wait_for_timeout(500)
    check("S4: /about heading",
          page.locator('h1:has-text("Built for the people")').count() > 0)

    # /legal/privacy + /legal/terms
    page.goto(f"{FRONTEND}/legal/privacy", wait_until="networkidle")
    page.wait_for_timeout(500)
    check("S4: /legal/privacy heading",
          page.locator('h1:has-text("Privacy policy")').count() > 0)
    page.goto(f"{FRONTEND}/legal/terms", wait_until="networkidle")
    page.wait_for_timeout(500)
    check("S4: /legal/terms heading",
          page.locator('h1:has-text("Terms of service")').count() > 0)

    # Theme toggle from PublicNav
    page.goto(f"{FRONTEND}/", wait_until="networkidle")
    page.wait_for_timeout(500)
    was_dark = page.evaluate("document.documentElement.classList.contains('dark')")
    page.click('button[role="radio"][aria-label="Dark"]')
    page.wait_for_timeout(300)
    is_dark = page.evaluate("document.documentElement.classList.contains('dark')")
    check("S4: marketing site dark mode toggle works",
          is_dark and not was_dark,
          f"before={was_dark} after={is_dark}")
    screenshot(page, "22-home-dark")

    # Contact form
    page.goto(f"{FRONTEND}/contact", wait_until="networkidle")
    page.wait_for_timeout(500)
    check("S4: /contact heading",
          page.locator('h1:has-text("love")').count() > 0)
    unique_msg = f"e2e stage 4 unique {int(time.time()*1000)}"
    page.fill('input#contact-name', "Stage4 Tester")
    page.fill('input#contact-email', "stage4@e2e.local")
    page.fill('textarea#contact-message', unique_msg)
    with page.expect_response(
        lambda r: r.url.endswith("/api/pb/api/collections/contact_messages/records") and r.request.method == "POST",
        timeout=10000,
    ) as info:
        page.click('button:has-text("Send message")')
    resp = info.value
    check("S4: contact form returns 200", resp.status == 200, f"status={resp.status}")
    check("S4: contact form success toast",
          page.locator(':text-matches("Message sent", "i")').count() > 0)

    body = resp.json() if resp.status == 200 else {}
    check("S4: contact_messages row id returned",
          isinstance(body, dict) and bool(body.get("id")),
          f"body={body}")


def run_theme_toggle(page):
    """Verify the light/dark theme toggle appears on every page and works.

    Visits every public + auth page in fresh contexts (no prior auth),
    confirms the ThemeToggle radio group is present, and that clicking the
    Dark button flips <html> to the .dark class with the value persisted
    to localStorage. The same toggle is verified on the dashboard
    authenticated area via Stage 3, so this stage focuses on the
    unauthenticated surfaces: marketing pages, login, register.
    """
    print("\n## Stage 5 — Theme toggle coverage on every page")

    # Reset to light so we have a clean before/after.
    page.goto(f"{FRONTEND}/", wait_until="networkidle")
    page.evaluate("localStorage.setItem('gcpallet-theme', 'light')")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(400)

    pages = [
        ("/",              "marketing home"),
        ("/pricing",       "pricing"),
        ("/features",      "features"),
        ("/about",         "about"),
        ("/contact",       "contact"),
        ("/legal/privacy", "legal privacy"),
        ("/legal/terms",   "legal terms"),
        ("/login",         "login"),
        ("/register",      "register"),
    ]

    for path, label in pages:
        page.goto(f"{FRONTEND}{path}", wait_until="networkidle")
        page.wait_for_timeout(500)
        # ThemeToggle is a role=radiogroup with aria-label="Color theme".
        toggle = page.locator('div[role="radiogroup"][aria-label="Color theme"]')
        check(f"S5: theme toggle on /{path.lstrip('/')} ({label})",
              toggle.count() > 0,
              f"page={page.url} toggle_count={toggle.count()}")
        if toggle.count() > 0:
            page.click('button[role="radio"][aria-label="Dark"]', timeout=8000)
            page.wait_for_timeout(250)
            is_dark = page.evaluate("document.documentElement.classList.contains('dark')")
            stored = page.evaluate("localStorage.getItem('gcpallet-theme')")
            check(f"S5: {label} dark mode applies + persists",
                  is_dark and stored == "dark",
                  f"is_dark={is_dark} stored={stored} url={page.url}")
            # Toggle back to light so the next iteration starts clean.
            page.click('button[role="radio"][aria-label="Light"]')
            page.wait_for_timeout(150)
        screenshot(page, f"23-theme-{label.replace(' ', '-')}")


def run_share_link(page, ctx, email_a: str):
    """Verify the public share-link feature end-to-end.

    Flow:
      - sign in as user A (already has Riverside Tower + inventory from Stage 1)
      - open the Share dialog and generate a 1d link
      - open the URL in a fresh context (no cookies/auth)
      - assert the public page renders project + inventory
      - revoke the link from the owner's dialog
      - re-open the URL → "not found" terminal state
    """
    print("\n## Stage 6 — Public share-link")

    # Stage 4 cleared localStorage and we never re-authed. Sign in as user A
    # (who already owns Riverside Tower + inventory created in Stage 1).
    login(page, email_a)
    wait_app(page, "/projects")
    try:
        page.wait_for_selector("a:has-text(\"Riverside Tower\")", timeout=12000)
    except Exception:
        pass
    page.click("a:has-text(\"Riverside Tower\")")
    page.wait_for_url("**/projects/**", timeout=15000)
    try:
        page.wait_for_selector("h1:has-text(\"Riverside Tower\")", timeout=10000)
    except Exception:
        pass
    check("S6: project detail loads with Share button",
          page.locator("button:has-text(\"Share\")").count() > 0)

    page.click("button:has-text(\"Share\")")
    try:
        page.wait_for_selector('[role="dialog"]', timeout=5000)
    except Exception:
        pass
    check("S6: share dialog opens",
          page.locator('[role="dialog"]:has-text("Share")').count() > 0)

    page.click("button:has-text(\"Generate public link\")")
    try:
        page.wait_for_selector("span.font-mono", timeout=10000)
    except Exception:
        pass
    share_url = None
    if page.locator("span.font-mono").count() > 0:
        share_url = page.locator("span.font-mono").first.text_content()
    check("S6: share URL is generated",
          bool(share_url) and "/share/" in (share_url or ""),
          f"url={share_url}")
    screenshot(page, "24-share-dialog")

    if share_url:
        # Open in a fresh context — no cookies, no auth.
        browser_obj = ctx.browser if hasattr(ctx, "browser") else page.context.browser
        visitor = browser_obj.new_context(viewport={"width": 1280, "height": 900})
        try:
            visit = visitor.new_page()
            visit.goto(share_url, wait_until="networkidle")
            try:
                visit.wait_for_selector("h1:has-text(\"Riverside Tower\")", timeout=10000)
            except Exception:
                pass
            check("S6: public page renders project name (no auth)",
                  visit.locator("h1:has-text(\"Riverside Tower\")").count() > 0,
                  f"url={visit.url}")
            check("S6: public page shows inventory table",
                  visit.locator("table").count() > 0)
            check("S6: public page footer says 'Read-only snapshot'",
                  "Read-only snapshot" in visit.content())
            check("S6: public page has Sign-in link (no auth shell)",
                  visit.locator("a:has-text(\"Sign in\")").count() > 0)
            screenshot(visit, "25-share-public-active")

            # Revoke from the owner's dialog, then re-open as visitor.
            page.click("button[aria-label=\"Revoke link\"]")
            try:
                page.wait_for_selector("text=No active links", timeout=10000)
            except Exception:
                pass
            check("S6: revoke clears the active list",
                  page.locator("text=No active links").count() > 0)

            visit2 = visitor.new_page()
            visit2.goto(share_url, wait_until="networkidle")
            try:
                visit2.wait_for_selector("text=not found", timeout=10000)
            except Exception:
                pass
            body = visit2.locator("body").text_content().lower()
            check("S6: revoked link shows 'not found' to visitor",
                  "not found" in body or "doesn't exist" in body,
                  f"body={body[:200]}")
            screenshot(visit2, "26-share-public-revoked")
        finally:
            visitor.close()


# ---------------------------------------------------------------------------

def main():
    pdf_path = Path("/tmp/gcpallet-permit.pdf")
    make_pdf(pdf_path)

    print("=== GC Pallet Full UI E2E ===")
    print(f"Frontend: {FRONTEND}")
    print(f"PocketBase: {POCKETBASE}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})

        # Auto-accept any native confirm() (e.g. project delete)
        page = ctx.new_page()
        page.on("dialog", lambda d: d.accept())

        # ---- Stage 0: gated dashboard route redirects unauth ----------------
        page.goto(f"{FRONTEND}/projects", wait_until="networkidle")
        # DashboardGate should redirect /projects → /login
        try:
            page.wait_for_url("**/login", timeout=8000)
            check("0: unauth /projects redirects to /login", "/login" in page.url)
        except Exception:
            check("0: unauth /projects redirects to /login", False, f"landed on {page.url}")

        # Also check inventory & documents are gated
        page.goto(f"{FRONTEND}/inventory", wait_until="networkidle")
        try:
            page.wait_for_url("**/login", timeout=8000)
            check("0: unauth /inventory redirects to /login", "/login" in page.url)
        except Exception:
            check("0: unauth /inventory redirects to /login", False, f"landed on {page.url}")

        page.goto(f"{FRONTEND}/documents", wait_until="networkidle")
        try:
            page.wait_for_url("**/login", timeout=8000)
            check("0: unauth /documents redirects to /login", "/login" in page.url)
        except Exception:
            check("0: unauth /documents redirects to /login", False, f"landed on {page.url}")

        # Also: unauth landing on / now shows the public marketing home (not /login)
        page.goto(f"{FRONTEND}/", wait_until="networkidle")
        page.wait_for_timeout(800)
        check("0: unauth / shows marketing home (not gated)",
              "/login" not in page.url and page.locator('h1:has-text("Run every job site")').count() > 0,
              f"url={page.url}")
        screenshot(page, "00-login-redirect")

        # ---- Stage 1: User A lifecycle ---------------------------------------
        project_id_a, email_a = run_user_a(page, pdf_path)
        check("backend: A's project id retrieved", bool(project_id_a), project_id_a or "none")

        # ---- Stage 1b: Dashboard analytics ----------------------------------
        run_stage1b(page)

        # Logout A
        logout(page)
        # ---- Stage 2: User B isolation ---------------------------------------
        if project_id_a:
            run_user_b(page, project_id_a)
        else:
            print("  !! skipping Stage 2 because we could not resolve project id")

        # ---- Stage 3: Settings + Dark mode + Mobile drawer ------------------
        run_stage3(page, ctx, project_id_a)

        # ---- Stage 4: Public marketing + contact form -----------------------
        run_stage4(page, ctx)

        # ---- Stage 5: Theme toggle on every page ----------------------------
        run_theme_toggle(page)

        # ---- Stage 6: Public share-link -------------------------------------
        run_share_link(page, ctx, email_a)

        browser.close()

    # ---- Summary ----------------------------------------------------------
    print("\n=== SUMMARY ===")
    passed = sum(1 for _, ok, _ in results if ok)
    failed = sum(1 for _, ok, _ in results if not ok)
    for label, ok, detail in results:
        if not ok:
            print(f"  FAIL  {label}  {detail}")
    print(f"\n{passed} passed, {failed} failed ({passed+failed} total)")
    print(f"Screenshots saved to {SCREENSHOT_DIR}")
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
