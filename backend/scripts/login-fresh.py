"""Verify the proxy fix works from a totally fresh browser context (no cache)."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    # Fresh context — no cookies, no cache
    ctx = browser.new_context()
    page = ctx.new_page()

    api_log = []
    def on_request(req):
        if "/api/" in req.url:
            api_log.append(f"REQ  {req.method} {req.url}")
    def on_response(resp):
        if "/api/" in resp.url:
            api_log.append(f"RES  {resp.status} {resp.url}")
    page.on("request", on_request)
    page.on("response", on_response)

    page.goto("http://127.0.0.1:3000/login", wait_until="networkidle")
    page.fill('input[name="email"]', "demo@gcpallet.test")
    page.fill('input[name="password"]', "demo1234")
    page.click('button[type="submit"]')
    page.wait_for_timeout(2000)

    print("URL after login:", page.url)

    print("\n--- API log ---")
    for a in api_log:
        print(a)

    browser.close()
