"""Capture full-page screenshots of every public marketing route, in light + dark mode."""
import os, time
from pathlib import Path
from playwright.sync_api import sync_playwright

FRONTEND = os.environ.get("FRONTEND_URL", "http://127.0.0.1:3000")
OUT = Path("/tmp/gcpallet-marketing")
OUT.mkdir(parents=True, exist_ok=True)

ROUTES = [
    ("home", "/"),
    ("pricing", "/pricing"),
    ("features", "/features"),
    ("about", "/about"),
    ("contact", "/contact"),
    ("privacy", "/legal/privacy"),
    ("terms", "/legal/terms"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(f"{FRONTEND}/login", wait_until="networkidle")
    page.evaluate("() => { try { window.localStorage.clear(); } catch(e) {} }")

    for theme in ("light", "dark"):
        page.goto(f"{FRONTEND}/", wait_until="networkidle")
        if theme == "dark":
            page.click('button[role="radio"][aria-label="Dark"]')
            page.wait_for_timeout(400)
        for slug, path in ROUTES:
            page.goto(f"{FRONTEND}{path}", wait_until="networkidle")
            page.wait_for_timeout(800)
            out = OUT / f"{slug}-{theme}.png"
            page.screenshot(path=str(out), full_page=True)
            print(f"  {out}  ({out.stat().st_size//1024} KB)")
    browser.close()
print(f"\nSaved to {OUT}")
