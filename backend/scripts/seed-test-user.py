"""Create persistent test accounts with seed data and print credentials.

Re-running refreshes the seed data for each account. Two users are
provisioned: a primary "Demo" account and a secondary "Crew" account
that's useful for testing multi-tenant isolation.
"""
import json
import os
import random
import time
import urllib.error
import urllib.request

PB = os.environ.get("POCKETBASE_URL", "http://127.0.0.1:8090")

ACCOUNTS = [
    {
        "email": "demo@gcpallet.local",
        "password": "DemoBuilder2026!",
        "name": "Demo Foreman",
        "projects": [
            ("Riverside Tower",      "active",     125000, "2025-01-10", "2026-12-20"),
            ("Oakridge Renovation",  "active",      64000, "2025-05-01", "2026-09-15"),
            ("Pinewood Addition",    "planning",    32000, "2026-08-01", "2027-02-28"),
            ("Mountainview Office",  "completed",  180000, "2024-03-15", "2025-12-01"),
            ("Maple Street Demo",    "on_hold",     22000, "2025-09-15", "2026-06-30"),
        ],
        "inventory": [
            ("2x4 Lumber",      120, 7.50,  "warehouse"),
            ("Drywall 4x8",      44, 12.00, "job_site"),
            ("Concrete Mix",     18, 96.00, "job_site"),
            ("Copper Pipe",      30, 18.50, "in_transit"),
            ("3in Shingles",     60, 28.00, "warehouse"),
            ("Plywood 4x8",      96, 38.00, "warehouse"),
            ("Screws #8",       500, 0.10,  "job_site"),
        ],
    },
    {
        "email": "crew@gcpallet.local",
        "password": "CrewLead2026!",
        "name": "Sasha Crew Lead",
        "projects": [
            ("Harborline Lofts",       "active",     88000, "2025-03-22", "2026-11-10"),
            ("Brookside ADU",          "active",     41000, "2025-08-14", "2026-08-30"),
            ("Cedar Park Pavilion",    "planning",   28000, "2026-02-01", "2026-10-15"),
            ("Sunset Roof Replacement","completed",  19500, "2024-11-04", "2025-04-30"),
        ],
        "inventory": [
            ("Rebar #4",          80,  9.50, "warehouse"),
            ("Roofing Felt",      24, 38.00, "warehouse"),
            ("Hardiplank Siding", 60, 22.40, "in_transit"),
            ("Pressure-Treated 2x6", 90, 12.10, "job_site"),
            ("Insulation R-19",   32, 58.00, "job_site"),
        ],
    },
    {
        "email": "pm@gcpallet.local",
        "password": "ProjectMgr2026!",
        "name": "Jordan Project Manager",
        "projects": [
            ("Westview Townhomes",   "active",     420000, "2025-02-15", "2027-08-30"),
            ("Lakeside Clinic",      "planning",   295000, "2026-09-01", "2028-02-28"),
            ("Highland Renovation",  "on_hold",     72000, "2025-06-10", "2026-12-15"),
        ],
        "inventory": [],
    },
]


def req(path, body=None, token=None, method="GET"):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(PB + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            if not raw:
                return {}
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return {"_error": e.code, "_body": json.loads(raw) if raw else {}}
        except json.JSONDecodeError:
            return {"_error": e.code, "_body": raw.decode()[:300]}


def seed_account(account):
    email = account["email"]
    password = account["password"]
    name = account["name"]

    # 1. Sign up (4xx means the user already exists — fall through to sign-in)
    create = req(
        "/api/collections/users/records",
        {"email": email, "password": password, "passwordConfirm": password, "name": name},
        method="POST",
    )
    if create.get("_error") and create.get("_error") != 400:
        raise SystemExit(f"Failed to create user {email}: {create}")

    auth = req(
        "/api/collections/users/auth-with-password",
        {"identity": email, "password": password},
        method="POST",
    )
    if auth.get("_error"):
        raise SystemExit(f"Failed to authenticate {email}: {auth}")

    token = auth["token"]
    user_id = auth["record"]["id"]
    print(f"  + signed in as {email} (id={user_id})")

    # 2. Reset & seed projects
    for p in req("/api/collections/projects/records", token=token).get("items", []):
        req(f"/api/collections/projects/records/{p['id']}", token=token, method="DELETE")
    created_projects = []
    for n, status, budget, sd, ed in account.get("projects", []):
        r = req(
            "/api/collections/projects/records",
            {
                "name": n,
                "status": status,
                "budget": budget,
                "start_date": sd,
                "end_date": ed,
                "user": user_id,
            },
            token=token,
            method="POST",
        )
        if r.get("_error"):
            print(f"  ! could not create project {n}: {r}")
        else:
            created_projects.append((n, r["id"]))

    # 3. Reset & seed inventory
    for i in req("/api/collections/inventory/records", token=token).get("items", []):
        req(f"/api/collections/inventory/records/{i['id']}", token=token, method="DELETE")
    pid_first = created_projects[0][1] if created_projects else None
    inv_count = 0
    for item, qty, cost, loc in account.get("inventory", []):
        r = req(
            "/api/collections/inventory/records",
            {
                "item_name": item,
                "quantity": qty,
                "cost_per_unit": cost,
                "location": loc,
                "unit": "pieces",
                "project": pid_first,
                "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "user": user_id,
            },
            token=token,
            method="POST",
        )
        if r.get("_error"):
            print(f"  ! could not create inventory {item}: {r}")
        else:
            inv_count += 1

    return {
        "email": email,
        "password": password,
        "name": name,
        "projects": len(created_projects),
        "inventory": inv_count,
    }


print(f"Seeding {len(ACCOUNTS)} accounts against {PB}\n")
results = [seed_account(a) for a in ACCOUNTS]

print()
print("==========================================================")
print("  TEST CREDENTIALS")
print("==========================================================")
for r in results:
    print(f"  Email:    {r['email']}")
    print(f"  Password: {r['password']}")
    print(f"  Name:     {r['name']}")
    print(f"  Seeded:   {r['projects']} projects, {r['inventory']} inventory items")
    print("  -----------------------------------------------")
print("==========================================================")
print()
print("  Open: http://127.0.0.1:3000/login")
print("  After sign-in you'll land on /dashboard with the new analytics widgets.")
