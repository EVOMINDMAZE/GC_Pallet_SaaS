"""Debug login attempt in a real headless browser."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = browser.new_context()
    page = ctx.new_page()

    console_log = []
    page.on("console", lambda msg: console_log.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda exc: console_log.append(f"[pageerror] {exc}"))

    api_log = []
    def on_response(resp):
        if "8090" in resp.url:
            api_log.append(f"{resp.request.method} {resp.url} -> {resp.status}")
    page.on("response", on_response)

    page.goto("http://127.0.0.1:3000/login", wait_until="networkidle")
    print("At:", page.url)
    page.fill('input[name="email"]', "demo@gcpallet.test")
    page.fill('input[name="password"]', "demo1234")
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)

    print("After submit URL:", page.url)
    body_text = page.locator("body").inner_text()
    print("Body excerpt (first 400):", body_text[:400].replace("\n", " | "))

    print("\n--- Console (last 30) ---")
    for c in console_log[-30:]:
        print(c)

    print("\n--- API log ---")
    for a in api_log:
        print(a)

    page.screenshot(path="/tmp/login-debug.png", full_page=True)
    print("\nScreenshot: /tmp/login-debug.png")

    browser.close()
