# GC Pallet SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready inventory and document management SaaS MVP for General Contractors using PocketBase + Next.js 14 + TypeScript + Tailwind + shadcn/ui.

**Architecture:** Monorepo with two top-level directories: `backend/` (PocketBase standalone binary + schema migration scripts) and `frontend/` (Next.js 14 App Router). PocketBase handles auth, file storage, SQLite DB, and realtime. Frontend uses route groups `(auth)` and `(dashboard)` for layout scoping. shadcn/ui components manually installed (avoid interactive init). SWR for data fetching and caching on the client.

**Tech Stack:**
- Backend: PocketBase v0.22+ (Go binary), JS hooks via pb_hooks
- Frontend: Next.js 14 App Router, TypeScript (strict), Tailwind v3, shadcn/ui, SWR, Zod, Lucide React, pocketbase JS SDK, react-hook-form
- Tooling: pnpm (workspace-less), ESLint, TypeScript

---

## File Structure

```
gcpallet/
├── README.md
├── .gitignore
├── backend/
│   ├── pocketbase                           # binary (downloaded, gitignored alternative committed URL)
│   ├── pb_data/                             # PB runtime data (gitignored)
│   ├── pb_migrations/
│   │   ├── 1700000000_init_users.js         # extends users collection
│   │   ├── 1700000001_init_projects.js
│   │   ├── 1700000002_init_documents.js
│   │   └── 1700000003_init_inventory.js
│   └── scripts/
│       └── download-pocketbase.sh
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── components.json                      # shadcn config
    ├── .env.local.example
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                         # marketing/redirect
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── (dashboard)/
    │       ├── layout.tsx                   # sidebar + topbar
    │       ├── page.tsx                     # main dashboard
    │       ├── projects/
    │       │   ├── page.tsx                 # list
    │       │   ├── new/page.tsx
    │       │   └── [id]/page.tsx            # detail
    │       ├── documents/page.tsx
    │       └── inventory/page.tsx
    ├── components/
    │   ├── ui/                              # shadcn primitives
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── select.tsx
    │   │   ├── table.tsx
    │   │   ├── badge.tsx
    │   │   ├── toast.tsx + toaster.tsx + use-toast.ts
    │   │   ├── dropdown-menu.tsx
    │   │   └── form.tsx
    │   ├── dashboard/
    │   │   ├── stats-cards.tsx
    │   │   ├── project-status-chart.tsx
    │   │   └── recent-activity.tsx
    │   ├── projects/
    │   │   ├── project-card.tsx
    │   │   ├── project-form.tsx
    │   │   └── project-actions.tsx
    │   ├── documents/
    │   │   ├── document-list.tsx
    │   │   ├── upload-modal.tsx
    │   │   └── document-row.tsx
    │   ├── inventory/
    │   │   ├── inventory-table.tsx
    │   │   ├── inventory-form.tsx
    │   │   └── inventory-row.tsx
    │   ├── layout/
    │   │   ├── sidebar.tsx
    │   │   ├── topbar.tsx
    │   │   └── user-menu.tsx
    │   └── providers.tsx                    # SWR + Toast providers
    ├── lib/
    │   ├── pocketbase.ts                    # client + auth helpers
    │   ├── utils.ts                         # cn() helper
    │   ├── schemas.ts                       # Zod schemas
    │   └── format.ts                        # currency/date helpers
    └── hooks/
        ├── useAuth.ts
        ├── useProjects.ts
        ├── useDocuments.ts
        └── useInventory.ts
```

---

## Phase 0: Repository Bootstrap

### Task 1: Initialize monorepo + .gitignore

**Files:**
- Create: `/workspace/.gitignore`
- Create: `/workspace/README.md`

- [ ] **Step 1: Create README**

Create `/workspace/README.md` with:

```markdown
# GC Pallet

Inventory & document management for general contractors.

## Stack
- Backend: PocketBase (SQLite, Auth, Files, Realtime) — see `backend/`
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui — see `frontend/`

## Quick start

```bash
# Backend (PocketBase on :8090)
cd backend && ./pocketbase serve

# Frontend (Next.js on :3000)
cd frontend && pnpm install && pnpm dev
```

Configure `frontend/.env.local` from `.env.local.example`:

```
NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
```

## Collections
users (extended), projects, documents, inventory — all scoped via `@request.auth.id == user`.
```

- [ ] **Step 2: Create .gitignore**

Create `/workspace/.gitignore`:

```gitignore
# Node
node_modules/
.next/
out/
dist/
build/

# Env
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
pnpm-debug.log*
*.log

# PocketBase runtime data
backend/pb_data/
backend/pocketbase

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
```

- [ ] **Step 3: Initialize git and make initial commit**

Run:
```bash
cd /workspace && git init && git add . && git commit -m "chore: bootstrap monorepo with README and gitignore"
```
Expected: Commit created; `git log --oneline` shows one entry.

---

## Phase 1: PocketBase Backend

### Task 2: Download PocketBase binary

**Files:**
- Create: `backend/scripts/download-pocketbase.sh`
- Create: `backend/.gitkeep`

- [ ] **Step 1: Create directory + script**

Create `/workspace/backend/scripts/download-pocketbase.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
VERSION="0.22.21"
OUT="$(dirname "$0")/../pocketbase"
URL="https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_linux_amd64.zip"
TMP="$(mktemp -d)"
curl -L "$URL" -o "$TMP/pb.zip"
unzip -o "$TMP/pb.zip" -d "$(dirname "$OUT")"
chmod +x "$OUT"
rm -rf "$TMP"
echo "PocketBase ${VERSION} installed at $OUT"
```

- [ ] **Step 2: Create stub `.gitkeep` in `backend/`**

Create `/workspace/backend/.gitkeep` (empty file).

- [ ] **Step 3: Run the download**

Run:
```bash
chmod +x /workspace/backend/scripts/download-pocketbase.sh && /workspace/backend/scripts/download-pocketbase.sh
```
Expected: prints `PocketBase 0.22.21 installed at /workspace/backend/pocketbase`.

- [ ] **Step 4: Verify by serving**

Run (blocking=false for 2s test, then stop):
```bash
cd /workspace/backend && timeout 2 ./pocketbase --help || true
```
Expected: usage text appears, exits cleanly.

- [ ] **Step 5: Commit**

```bash
cd /workspace && git add backend && git commit -m "chore(backend): add pocketbase download script and binary"
```

---

### Task 3: Create `users` collection migration

**Files:**
- Create: `backend/pb_migrations/1700000000_init_users.js`

- [ ] **Step 1: Write migration**

Create `/workspace/backend/pb_migrations/1700000000_init_users.js`:

```javascript
/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.add(new TextField({ name: "company_name" }));
  collection.fields.add(new TextField({ name: "phone" }));
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeByName("company_name");
  collection.fields.removeByName("phone");
  app.save(collection);
});
```

- [ ] **Step 2: Apply migration by serving PB**

Run (background):
```bash
cd /workspace/backend && ./pocketbase serve --http=127.0.0.1:8090
```
Wait until log shows "Server started", then kill.

Expected output (verify with `cat /workspace/backend/pb_data/data.db` later — present): schema recorded.

- [ ] **Step 3: Confirm migrations applied**

After server starts and stops, run:
```bash
ls /workspace/backend/pb_migrations/ && ls /workspace/backend/pb_data/
```
Expected: migration file present; `pb_data/` shows `data.db` and `auxiliary.db`.

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add backend/pb_migrations && git commit -m "feat(backend): extend users with company_name and phone"
```

---

### Task 4: Create `projects` collection migration

**Files:**
- Create: `backend/pb_migrations/1700000001_init_projects.js`

- [ ] **Step 1: Write migration**

Create `/workspace/backend/pb_migrations/1700000001_init_projects.js`:

```javascript
/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  const collection = new Collection({
    name: "projects",
    type: "base",
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
  });

  collection.fields.add(new TextField({ name: "name", required: true }));
  collection.fields.add(new TextField({ name: "address" }));
  collection.fields.add(new NumberField({ name: "budget" }));
  collection.fields.add(new DateField({ name: "start_date" }));
  collection.fields.add(new DateField({ name: "end_date" }));
  collection.fields.add(new SelectField({
    name: "status",
    required: true,
    values: ["planning", "active", "completed", "on_hold"],
    maxSelect: 1,
  }));
  collection.fields.add(new RelationField({
    name: "user",
    required: true,
    collectionId: users.id,
    maxSelect: 1,
  }));

  app.save(collection);
}, (app) => {
  app.deleteCollectionByNameOrId("projects");
});
```

- [ ] **Step 2: Apply migration**

Run PB in background to apply, then stop:
```bash
cd /workspace/backend && (./pocketbase serve --http=127.0.0.1:8090 &) ; sleep 3 ; pkill -f pocketbase || true
```
Expected: no errors in stderr; `pb_migrations/` shows the new file timestamp updated.

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add backend/pb_migrations && git commit -m "feat(backend): add projects collection with per-user scoping"
```

---

### Task 5: Create `documents` collection migration

**Files:**
- Create: `backend/pb_migrations/1700000002_init_documents.js`

- [ ] **Step 1: Write migration**

Create `/workspace/backend/pb_migrations/1700000002_init_documents.js`:

```javascript
/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const projects = app.findCollectionByNameOrId("projects");

  const collection = new Collection({
    name: "documents",
    type: "base",
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
  });

  collection.fields.add(new TextField({ name: "name", required: true }));
  collection.fields.add(new FileField({
    name: "file",
    required: true,
    maxSelect: 1,
    maxSize: 50 * 1024 * 1024,
    mimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"],
  }));
  collection.fields.add(new SelectField({
    name: "category",
    required: true,
    values: ["contract", "permit", "invoice", "receipt", "photo", "other"],
    maxSelect: 1,
  }));
  collection.fields.add(new RelationField({
    name: "project",
    required: true,
    collectionId: projects.id,
    maxSelect: 1,
    cascadeDelete: true,
  }));
  collection.fields.add(new DateField({ name: "uploaded_at", required: true }));
  collection.fields.add(new RelationField({
    name: "user",
    required: true,
    collectionId: users.id,
    maxSelect: 1,
  }));

  app.save(collection);
}, (app) => {
  app.deleteCollectionByNameOrId("documents");
});
```

- [ ] **Step 2: Apply migration**

```bash
cd /workspace/backend && (./pocketbase serve --http=127.0.0.1:8090 &) ; sleep 3 ; pkill -f pocketbase || true
```
Expected: no errors; migration file timestamp updated.

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add backend/pb_migrations && git commit -m "feat(backend): add documents collection with file field and per-user rules"
```

---

### Task 6: Create `inventory` collection migration

**Files:**
- Create: `backend/pb_migrations/1700000003_init_inventory.js`

- [ ] **Step 1: Write migration**

Create `/workspace/backend/pb_migrations/1700000003_init_inventory.js`:

```javascript
/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const projects = app.findCollectionByNameOrId("projects");

  const collection = new Collection({
    name: "inventory",
    type: "base",
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
  });

  collection.fields.add(new TextField({ name: "item_name", required: true }));
  collection.fields.add(new NumberField({ name: "quantity", required: true, min: 0 }));
  collection.fields.add(new SelectField({
    name: "unit",
    required: true,
    values: ["pieces", "lbs", "kg", "sqft", "sqm"],
    maxSelect: 1,
  }));
  collection.fields.add(new SelectField({
    name: "location",
    required: true,
    values: ["warehouse", "job_site", "in_transit"],
    maxSelect: 1,
  }));
  collection.fields.add(new NumberField({ name: "cost_per_unit", min: 0 }));
  collection.fields.add(new RelationField({
    name: "project",
    required: true,
    collectionId: projects.id,
    maxSelect: 1,
    cascadeDelete: true,
  }));
  collection.fields.add(new DateField({ name: "last_updated", required: true }));
  collection.fields.add(new RelationField({
    name: "user",
    required: true,
    collectionId: users.id,
    maxSelect: 1,
  }));

  app.save(collection);
}, (app) => {
  app.deleteCollectionByNameOrId("inventory");
});
```

- [ ] **Step 2: Apply migration**

```bash
cd /workspace/backend && (./pocketbase serve --http=127.0.0.1:8090 &) ; sleep 3 ; pkill -f pocketbase || true
```
Expected: schema applied.

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add backend/pb_migrations && git commit -m "feat(backend): add inventory collection"
```

---

### Task 7: Create PocketBase admin via API (optional bootstrap)

**Files:**
- Modify (created): `backend/seed-admin.js` — manual one-off

- [ ] **Step 1: Document admin creation in README**

Append to `/workspace/README.md`:

```markdown
## First-time PocketBase setup

1. `cd backend && ./pocketbase serve --http=127.0.0.1:8090`
2. Visit `http://127.0.0.1:8090/_/` and create the first superuser.
3. Stop the server (Ctrl-C). Restart it to apply the migrations.
```

- [ ] **Step 2: Commit**

```bash
cd /workspace && git add backend/seed-admin.js README.md && git commit -m "docs: document admin bootstrap flow"
```

---

## Phase 2: Next.js Frontend Bootstrap

### Task 8: Scaffold Next.js 14 project

**Files:**
- Create: `frontend/` (entire project)

- [ ] **Step 1: Create `frontend/package.json`**

Create `/workspace/frontend/package.json`:

```json
{
  "name": "gc-pallet-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "pocketbase": "0.21.2",
    "swr": "2.2.5",
    "zod": "3.23.8",
    "react-hook-form": "7.52.1",
    "@hookform/resolvers": "3.9.0",
    "lucide-react": "0.427.0",
    "class-variance-authority": "0.7.0",
    "clsx": "2.1.1",
    "tailwind-merge": "2.4.0",
    "tailwindcss-animate": "1.0.7",
    "@radix-ui/react-dialog": "1.1.1",
    "@radix-ui/react-dropdown-menu": "2.1.1",
    "@radix-ui/react-label": "2.1.0",
    "@radix-ui/react-select": "2.1.1",
    "@radix-ui/react-slot": "1.1.0",
    "@radix-ui/react-toast": "1.2.1"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "@types/node": "20.14.13",
    "tailwindcss": "3.4.7",
    "postcss": "8.4.40",
    "autoprefixer": "10.4.19",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5"
  }
}
```

- [ ] **Step 2: Create `frontend/tsconfig.json`**

Create `/workspace/frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `frontend/next.config.mjs`**

Create `/workspace/frontend/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "55mb" } },
};
export default nextConfig;
```

- [ ] **Step 4: Create Tailwind + PostCSS configs**

Create `/workspace/frontend/postcss.config.mjs`:

```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

Create `/workspace/frontend/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [ ] **Step 5: Create `.env.local.example` and `next-env.d.ts`**

Create `/workspace/frontend/.env.local.example`:

```
NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
```

Create `/workspace/frontend/next-env.d.ts`:

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 6: Install dependencies**

Run:
```bash
cd /workspace/frontend && (test -d node_modules || pnpm install)
```
Expected: `node_modules/` created. (Network may fall back to npm; if pnpm absent, use `npm install`.)

- [ ] **Step 7: Commit**

```bash
cd /workspace && git add frontend && git commit -m "chore(frontend): scaffold next.js 14 with tailwind and radix deps"
```

---

### Task 9: Add shadcn/ui primitives manually

**Files:**
- Create: `frontend/components.json`
- Create: `frontend/lib/utils.ts`
- Create: 11 primitive files under `frontend/components/ui/`

- [ ] **Step 1: `components.json`**

Create `/workspace/frontend/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 2: `lib/utils.ts`**

Create `/workspace/frontend/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Create primitives (each is a single, faithful shadcn port)**

Create `/workspace/frontend/components/ui/button.tsx`:

```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

Create `/workspace/frontend/components/ui/input.tsx`:

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";
export { Input };
```

Create `/workspace/frontend/components/ui/label.tsx`:

```typescript
"use client";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
));
Label.displayName = "Label";
export { Label };
```

Create `/workspace/frontend/components/ui/card.tsx`:

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";
export { Card, CardHeader, CardTitle, CardContent };
```

Create `/workspace/frontend/components/ui/badge.tsx`:

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
```

Create `/workspace/frontend/components/ui/dialog.tsx`:

```typescript
"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
));
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle };
```

Create `/workspace/frontend/components/ui/select.tsx`:

```typescript
"use client";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild><ChevronDown className="h-4 w-4 opacity-50" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md", className)}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator><Check className="h-4 w-4" /></SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
```

Create `/workspace/frontend/components/ui/dropdown-menu.tsx`:

```typescript
"use client";
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent", className)} {...props} />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
```

Create `/workspace/frontend/components/ui/toast.tsx` + `toaster.tsx` + `use-toast.ts`:

`toast.tsx`:
```typescript
"use client";
import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
));
Toast.displayName = "Toast";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>((props, ref) => <ToastPrimitives.Title ref={ref} className="text-sm font-semibold" {...props} />);
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>((props, ref) => <ToastPrimitives.Description ref={ref} className="text-sm opacity-90" {...props} />);
ToastDescription.displayName = "ToastDescription";

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>((props, ref) => (
  <ToastPrimitives.Close ref={ref} className="absolute right-1 top-1 rounded-md p-1" toast-close="" {...props}>
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = "ToastClose";

export { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose };
```

`toaster.tsx`:
```typescript
"use client";
import * as React from "react";
import { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose } from "./toast";

type ToastItem = { id: string; title?: string; description?: string; variant?: "default" | "destructive" };

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastItem;
      setItems((prev) => [...prev, { ...detail, id: detail.id ?? crypto.randomUUID() }]);
    };
    window.addEventListener("gcp:toast", handler);
    return () => window.removeEventListener("gcp:toast", handler);
  }, []);

  return (
    <ToastProvider duration={4000}>
      {items.map((t) => (
        <Toast key={t.id} variant={t.variant} onOpenChange={(open) => { if (!open) setItems((p) => p.filter((x) => x.id !== t.id)); }}>
          <div className="grid gap-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </ToastProvider>
  );
}
```

`use-toast.ts`:
```typescript
"use client";
export function toast(opts: { title?: string; description?: string; variant?: "default" | "destructive" }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("gcp:toast", { detail: { ...opts, id: crypto.randomUUID() } }));
}
```

Create `/workspace/frontend/components/ui/table.tsx`:

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50", className)} {...props} />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th ref={ref} className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground", className)} {...props} />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
```

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): add shadcn/ui primitives (button, input, card, dialog, select, etc.)"
```

---

### Task 10: Global styles, root layout, providers, PocketBase client

**Files:**
- Create: `frontend/app/globals.css`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/components/providers.tsx`
- Create: `frontend/lib/pocketbase.ts`

- [ ] **Step 1: `globals.css`**

Create `/workspace/frontend/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;
    --primary: 24 95% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 24 95% 53%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 47.4% 11.2%;
    --foreground: 210 40% 98%;
    --card: 222.2 47.4% 11.2%;
    --card-foreground: 210 40% 98%;
    --primary: 24 95% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 24 95% 53%;
  }
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 2: `lib/pocketbase.ts`**

Create `/workspace/frontend/lib/pocketbase.ts`:

```typescript
"use client";
import PocketBase from "pocketbase";
import { TypedPocketBase } from "./types";

export const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? "http://127.0.0.1:8090";

let _pb: TypedPocketBase | null = null;

export function getPocketBase(): TypedPocketBase {
  if (_pb) return _pb;
  _pb = new PocketBase(PB_URL) as TypedPocketBase;
  if (typeof window !== "undefined") {
    _pb.authStore.loadFromCookie(document.cookie ?? "");
  }
  return _pb;
}
```

- [ ] **Step 3: `lib/types.ts` (PocketBase typed records)**

Create `/workspace/frontend/lib/types.ts`:

```typescript
import type PocketBase from "pocketbase";

export type ProjectStatus = "planning" | "active" | "completed" | "on_hold";
export type DocumentCategory = "contract" | "permit" | "invoice" | "receipt" | "photo" | "other";
export type InventoryUnit = "pieces" | "lbs" | "kg" | "sqft" | "sqm";
export type InventoryLocation = "warehouse" | "job_site" | "in_transit";

export type UsersRecord = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  company_name?: string;
  phone?: string;
};

export type ProjectsRecord = {
  id: string;
  name: string;
  address?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status: ProjectStatus;
  user: string;
  created: string;
  updated: string;
};

export type DocumentsRecord = {
  id: string;
  name: string;
  file: string;
  category: DocumentCategory;
  project: string;
  uploaded_at: string;
  user: string;
  created: string;
  updated: string;
};

export type InventoryRecord = {
  id: string;
  item_name: string;
  quantity: number;
  unit: InventoryUnit;
  location: InventoryLocation;
  cost_per_unit?: number;
  project: string;
  last_updated: string;
  user: string;
  created: string;
  updated: string;
};

export type TypedPocketBase = PocketBase & {
  collection(name: "users"): { ... };
  collection(name: "projects"): { ... };
  collection(name: "documents"): { ... };
  collection(name: "inventory"): { ... };
};
```

- [ ] **Step 4: `components/providers.tsx`**

Create `/workspace/frontend/components/providers.tsx`:

```typescript
"use client";
import * as React from "react";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false }}>
      <Toaster />
      {children}
    </SWRConfig>
  );
}
```

- [ ] **Step 5: `app/layout.tsx`**

Create `/workspace/frontend/app/layout.tsx`:

```typescript
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "GC Pallet",
  description: "Inventory & document management for general contractors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: `app/page.tsx` (marketing/redirect)**

Create `/workspace/frontend/app/page.tsx`:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight">GC Pallet</h1>
      <p className="max-w-md text-muted-foreground">
        Inventory & document management built for independent general contractors.
      </p>
      <div className="flex gap-3">
        <Button asChild><Link href="/login">Sign in</Link></Button>
        <Button asChild variant="outline"><Link href="/register">Create account</Link></Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Build verifies**

Run:
```bash
cd /workspace/frontend && pnpm typecheck
```
Expected: 0 errors. If errors, fix and rerun.

- [ ] **Step 8: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): add root layout, providers, pocketbase client, globals"
```

---

## Phase 3: Auth

### Task 11: `useAuth` hook + auth layout

**Files:**
- Create: `frontend/hooks/useAuth.ts`
- Create: `frontend/app/(auth)/layout.tsx`

- [ ] **Step 1: `useAuth.ts`**

Create `/workspace/frontend/hooks/useAuth.ts`:

```typescript
"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { UsersRecord } from "@/lib/types";

export function useAuth() {
  const pb = getPocketBase();
  const { data, isLoading, mutate } = useSWR<UsersRecord | null>("auth-user", async () => {
    if (!pb.authStore.record) return null;
    try {
      return (await pb.collection("users").getOne(pb.authStore.record.id)) as UsersRecord;
    } catch {
      return null;
    }
  });

  return {
    user: data ?? null,
    isAuthenticated: !!pb.authStore.record,
    isLoading,
    refresh: mutate,
    logout: () => pb.authStore.clear(),
  };
}
```

- [ ] **Step 2: `(auth)/layout.tsx`**

Create `/workspace/frontend/app/(auth)/layout.tsx`:

```typescript
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center">
          <Link href="/" className="text-lg font-semibold">GC Pallet</Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): add useAuth hook and auth layout"
```

---

### Task 12: Register page

**Files:**
- Create: `frontend/app/(auth)/register/page.tsx`

- [ ] **Step 1: Write the page**

Create `/workspace/frontend/app/(auth)/register/page.tsx`:

```typescript
"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const pb = getPocketBase();
      await pb.collection("users").create({
        email: fd.get("email"),
        password: fd.get("password"),
        passwordConfirm: fd.get("password"),
        name: fd.get("name"),
        company_name: fd.get("company_name"),
        phone: fd.get("phone"),
      });
      await pb.collection("users").authWithPassword(
        String(fd.get("email")),
        String(fd.get("password"))
      );
      toast({ title: "Account created", description: "Welcome to GC Pallet." });
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company_name">Company name</Label>
            <Input id="company_name" name="company_name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): add register page"
```

---

### Task 13: Login page

**Files:**
- Create: `frontend/app/(auth)/login/page.tsx`

- [ ] **Step 1: Write the page**

Create `/workspace/frontend/app/(auth)/login/page.tsx`:

```typescript
"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const pb = getPocketBase();
      await pb.collection("users").authWithPassword(
        String(fd.get("email")),
        String(fd.get("password"))
      );
      router.push("/");
      router.refresh();
    } catch {
      toast({ title: "Invalid credentials", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to GC Pallet</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="underline">Create an account</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): add login page"
```

---

## Phase 4: Dashboard Layout & Shell

### Task 14: Dashboard layout with sidebar + topbar

**Files:**
- Create: `frontend/app/(dashboard)/layout.tsx`
- Create: `frontend/components/layout/sidebar.tsx`
- Create: `frontend/components/layout/topbar.tsx`
- Create: `frontend/components/layout/user-menu.tsx`

- [ ] **Step 1: `sidebar.tsx`**

Create `/workspace/frontend/components/layout/sidebar.tsx`:

```typescript
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, FileText, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/inventory", label: "Inventory", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden border-r bg-muted/30 md:block md:w-60">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="text-lg font-semibold">GC Pallet</Link>
      </div>
      <nav className="space-y-1 p-3">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname?.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: `user-menu.tsx`**

Create `/workspace/frontend/components/layout/user-menu.tsx`:

```typescript
"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getPocketBase } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();

  async function logout() {
    const pb = getPocketBase();
    pb.authStore.clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {user?.name ?? user?.email ?? "Account"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 3: `topbar.tsx`**

Create `/workspace/frontend/components/layout/topbar.tsx`:

```typescript
import { UserMenu } from "./user-menu";

export function Topbar({ title }: { title?: string }) {
  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{title ?? "GC Pallet"}</h1>
      <UserMenu />
    </div>
  );
}
```

- [ ] **Step 4: `(dashboard)/layout.tsx`**

Create `/workspace/frontend/app/(dashboard)/layout.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getPocketBase } from "@/lib/pocketbase";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pb = getPocketBase();
  if (!pb.authStore.record) redirect("/login");
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): dashboard layout with sidebar, topbar, user menu"
```

---

## Phase 5: Hooks + Schemas

### Task 15: Data hooks

**Files:**
- Create: `frontend/hooks/useProjects.ts`
- Create: `frontend/hooks/useDocuments.ts`
- Create: `frontend/hooks/useInventory.ts`
- Create: `frontend/lib/schemas.ts`
- Create: `frontend/lib/format.ts`

- [ ] **Step 1: `lib/format.ts`**

Create `/workspace/frontend/lib/format.ts`:

```typescript
export const formatCurrency = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

export const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
```

- [ ] **Step 2: `lib/schemas.ts`**

Create `/workspace/frontend/lib/schemas.ts`:

```typescript
import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(["planning", "active", "completed", "on_hold"]),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const inventorySchema = z.object({
  item_name: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
  unit: z.enum(["pieces", "lbs", "kg", "sqft", "sqm"]),
  location: z.enum(["warehouse", "job_site", "in_transit"]),
  cost_per_unit: z.coerce.number().nonnegative().optional(),
  project: z.string().min(1),
});
export type InventoryInput = z.infer<typeof inventorySchema>;

export const documentSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["contract", "permit", "invoice", "receipt", "photo", "other"]),
  project: z.string().min(1),
  file: z.instanceof(File, { message: "File is required" }),
});
export type DocumentInput = z.infer<typeof documentSchema>;
```

- [ ] **Step 3: `useProjects.ts`**

Create `/workspace/frontend/hooks/useProjects.ts`:

```typescript
"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { ProjectsRecord } from "@/lib/types";

export function useProjects() {
  const pb = getPocketBase();
  return useSWR<ProjectsRecord[]>("projects", async () => {
    return (await pb.collection("projects").getFullList({ sort: "-created" })) as ProjectsRecord[];
  });
}

export function useProject(id?: string) {
  const pb = getPocketBase();
  return useSWR<ProjectsRecord | null>(id ? ["project", id] : null, async () => {
    if (!id) return null;
    return (await pb.collection("projects").getOne(id, { expand: "user" })) as ProjectsRecord;
  });
}
```

- [ ] **Step 4: `useDocuments.ts`**

Create `/workspace/frontend/hooks/useDocuments.ts`:

```typescript
"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { DocumentsRecord } from "@/lib/types";

export function useDocuments(projectId?: string) {
  const pb = getPocketBase();
  return useSWR<DocumentsRecord[]>(
    projectId ? ["documents", projectId] : "documents",
    async () => {
      const filter = projectId ? `project = "${projectId}"` : "";
      return (await pb.collection("documents").getFullList({
        sort: "-uploaded_at",
        filter,
      })) as DocumentsRecord[];
    }
  );
}
```

- [ ] **Step 5: `useInventory.ts`**

Create `/workspace/frontend/hooks/useInventory.ts`:

```typescript
"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { InventoryRecord } from "@/lib/types";

export function useInventory(projectId?: string) {
  const pb = getPocketBase();
  return useSWR<InventoryRecord[]>(
    projectId ? ["inventory", projectId] : "inventory",
    async () => {
      const filter = projectId ? `project = "${projectId}"` : "";
      return (await pb.collection("inventory").getFullList({
        sort: "-last_updated",
        filter,
      })) as InventoryRecord[];
    }
  );
}
```

- [ ] **Step 6: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): add data hooks and zod schemas"
```

---

## Phase 6: Projects Module

### Task 16: Dashboard overview page

**Files:**
- Create: `frontend/app/(dashboard)/page.tsx`
- Create: `frontend/components/dashboard/stats-cards.tsx`
- Create: `frontend/components/dashboard/project-status-chart.tsx`
- Create: `frontend/components/dashboard/recent-activity.tsx`

- [ ] **Step 1: `stats-cards.tsx`**

Create `/workspace/frontend/components/dashboard/stats-cards.tsx`:

```typescript
"use client";
import { FolderKanban, FileText, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";
import { formatCurrency } from "@/lib/format";

export function StatsCards() {
  const { data: projects } = useProjects();
  const { data: documents } = useDocuments();
  const { data: inventory } = useInventory();

  const totalBudget = projects?.reduce((sum, p) => sum + (p.budget ?? 0), 0) ?? 0;

  const cards = [
    { label: "Active Projects", value: projects?.filter((p) => p.status === "active").length ?? 0, icon: FolderKanban },
    { label: "Documents", value: documents?.length ?? 0, icon: FileText },
    { label: "Inventory Items", value: inventory?.length ?? 0, icon: Package },
    { label: "Total Budget", value: formatCurrency(totalBudget), icon: DollarSign },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `project-status-chart.tsx`**

Create `/workspace/frontend/components/dashboard/project-status-chart.tsx`:

```typescript
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/useProjects";
import type { ProjectStatus } from "@/lib/types";

const labels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  on_hold: "On Hold",
};

const variants: Record<ProjectStatus, "default" | "secondary" | "outline" | "destructive"> = {
  planning: "outline",
  active: "default",
  completed: "secondary",
  on_hold: "destructive",
};

export function ProjectStatusChart() {
  const { data: projects } = useProjects();
  const counts = (projects ?? []).reduce<Record<ProjectStatus, number>>(
    (acc, p) => ((acc[p.status] = (acc[p.status] ?? 0) + 1), acc),
    { planning: 0, active: 0, completed: 0, on_hold: 0 }
  );

  return (
    <Card>
      <CardHeader><CardTitle>Project Status</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {(Object.keys(labels) as ProjectStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Badge variant={variants[s]}>{labels[s]}</Badge>
            <span className="text-2xl font-bold">{counts[s]}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: `recent-activity.tsx`**

Create `/workspace/frontend/components/dashboard/recent-activity.tsx`:

```typescript
"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { formatDate, formatCurrency } from "@/lib/format";

export function RecentActivity() {
  const { data: projects } = useProjects();
  const { data: docs } = useDocuments();

  const recentProjects = (projects ?? []).slice(0, 5);
  const recentDocs = (docs ?? []).slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Recent Projects</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentProjects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
          {recentProjects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-accent">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{formatDate(p.start_date as unknown as string)}</div>
              </div>
              <span className="text-sm text-muted-foreground">{formatCurrency(p.budget)}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent Documents</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentDocs.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
          {recentDocs.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.category} · {formatDate(d.uploaded_at as unknown as string)}</div>
              </div>
              <a href={getPocketBase().files.getURL(d, d.file)} target="_blank" rel="noreferrer" className="text-sm underline">Open</a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Local import to keep file self-contained
import { getPocketBase } from "@/lib/pocketbase";
```

- [ ] **Step 4: dashboard `page.tsx`**

Create `/workspace/frontend/app/(dashboard)/page.tsx`:

```typescript
"use client";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      <StatsCards />
      <ProjectStatusChart />
      <RecentActivity />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): dashboard with stats cards, status chart, recent activity"
```

---

### Task 17: Projects list + new project form

**Files:**
- Create: `frontend/app/(dashboard)/projects/page.tsx`
- Create: `frontend/app/(dashboard)/projects/new/page.tsx`
- Create: `frontend/components/projects/project-card.tsx`
- Create: `frontend/components/projects/project-form.tsx`

- [ ] **Step 1: `project-card.tsx`**

Create `/workspace/frontend/components/projects/project-card.tsx`:

```typescript
"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectsRecord } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

const statusVariant: Record<ProjectsRecord["status"], "default" | "secondary" | "outline" | "destructive"> = {
  active: "default", planning: "outline", completed: "secondary", on_hold: "destructive",
};

export function ProjectCard({ project }: { project: ProjectsRecord }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">
          <Link href={`/projects/${project.id}`} className="hover:underline">{project.name}</Link>
        </CardTitle>
        <Badge variant={statusVariant[project.status]}>{project.status.replace("_", " ")}</Badge>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{project.address || "No address"}</p>
        <p>Budget: {formatCurrency(project.budget)}</p>
        <p>{formatDate(project.start_date as unknown as string)} → {formatDate(project.end_date as unknown as string)}</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: `project-form.tsx`**

Create `/workspace/frontend/components/projects/project-form.tsx`:

```typescript
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPocketBase } from "@/lib/pocketbase";
import { projectSchema, type ProjectInput } from "@/lib/schemas";
import { toast } from "@/components/ui/use-toast";
import type { ProjectsRecord, ProjectStatus } from "@/lib/types";

export function ProjectForm({ initial, projectId }: { initial?: ProjectsRecord; projectId?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const parsed = projectSchema.safeParse(Object.fromEntries(fd.entries()));
    if (!parsed.success) {
      toast({ title: "Validation error", description: parsed.error.issues[0]?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    const data: ProjectInput = parsed.data;
    try {
      const pb = getPocketBase();
      const userId = pb.authStore.record?.id;
      if (!userId) throw new Error("Not authenticated");

      if (projectId) {
        await pb.collection("projects").update(projectId, data);
        toast({ title: "Project updated" });
      } else {
        await pb.collection("projects").create({ ...data, user: userId });
        toast({ title: "Project created" });
      }
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Save failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle>{projectId ? "Edit project" : "New project"}</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={initial?.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={initial?.address} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input id="budget" name="budget" type="number" min="0" step="0.01" defaultValue={initial?.budget} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={initial?.status ?? "planning"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["planning", "active", "completed", "on_hold"] as ProjectStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={initial?.start_date} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" name="end_date" type="date" defaultValue={initial?.end_date} />
            </div>
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save project"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: `projects/page.tsx` (list)**

Create `/workspace/frontend/app/(dashboard)/projects/page.tsx`:

```typescript
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/project-card";

export default function ProjectsPage() {
  const { data, isLoading } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
        <Button asChild><Link href="/projects/new">New Project</Link></Button>
      </div>
      {isLoading && <p>Loading…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <p className="text-muted-foreground">No projects yet. Create your first one.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => <ProjectCard key={p.id} project={p} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `projects/new/page.tsx`**

Create `/workspace/frontend/app/(dashboard)/projects/new/page.tsx`:

```typescript
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">New Project</h2>
      <ProjectForm />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): projects list and new project form"
```

---

### Task 18: Project detail page with edit + inventory/docs tabs

**Files:**
- Create: `frontend/app/(dashboard)/projects/[id]/page.tsx`
- Create: `frontend/components/projects/project-actions.tsx`

- [ ] **Step 1: `project-actions.tsx`**

Create `/workspace/frontend/components/projects/project-actions.tsx`:

```typescript
"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/use-toast";

export function ProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this project and its documents/inventory?")) return;
    try {
      const pb = getPocketBase();
      await pb.collection("projects").delete(projectId);
      toast({ title: "Project deleted" });
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Delete failed", variant: "destructive" });
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={onDelete}>
      <Trash2 className="mr-2 h-4 w-4" /> Delete
    </Button>
  );
}
```

- [ ] **Step 2: project detail page**

Create `/workspace/frontend/app/(dashboard)/projects/[id]/page.tsx`:

```typescript
"use client";
import * as React from "react";
import Link from "next/link";
import { useProject } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectActions } from "@/components/projects/project-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { getPocketBase } from "@/lib/pocketbase";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: project, isLoading } = useProject(params.id);
  const { data: docs } = useDocuments(params.id);
  const { data: inventory } = useInventory(params.id);
  const [editing, setEditing] = React.useState(false);

  if (isLoading) return <p>Loading…</p>;
  if (!project) return <p>Not found.</p>;

  if (editing) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Edit {project.name}</h2>
        <ProjectForm initial={project} projectId={project.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground">{project.address}</p>
          <p className="mt-2 text-sm">
            Budget: {formatCurrency(project.budget)} · {formatDate(project.start_date as unknown as string)} – {formatDate(project.end_date as unknown as string)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          <ProjectActions projectId={project.id} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <Button asChild size="sm"><Link href={`/documents?project=${project.id}`}>Upload</Link></Button>
        </CardHeader>
        <CardContent>
          {(docs ?? []).length === 0 && <p className="text-sm text-muted-foreground">No documents.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(docs ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell className="capitalize">{d.category}</TableCell>
                  <TableCell>{formatDate(d.uploaded_at as unknown as string)}</TableCell>
                  <TableCell className="text-right">
                    <a href={getPocketBase().files.getURL(d, d.file)} target="_blank" rel="noreferrer" className="underline">Open</a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory</CardTitle>
          <Button asChild size="sm"><Link href={`/inventory?project=${project.id}`}>Add item</Link></Button>
        </CardHeader>
        <CardContent>
          {(inventory ?? []).length === 0 && <p className="text-sm text-muted-foreground">No inventory.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Cost/unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(inventory ?? []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.item_name}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell className="capitalize">{it.unit}</TableCell>
                  <TableCell className="capitalize">{it.location.replace("_", " ")}</TableCell>
                  <TableCell className="text-right">{formatCurrency(it.cost_per_unit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): project detail with edit, delete, docs and inventory lists"
```

---

## Phase 7: Documents Module

### Task 19: Documents list + upload modal

**Files:**
- Create: `frontend/app/(dashboard)/documents/page.tsx`
- Create: `frontend/components/documents/document-list.tsx`
- Create: `frontend/components/documents/upload-modal.tsx`

- [ ] **Step 1: `upload-modal.tsx`**

Create `/workspace/frontend/components/documents/upload-modal.tsx`:

```typescript
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getPocketBase } from "@/lib/pocketbase";
import { documentSchema } from "@/lib/schemas";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import type { DocumentCategory, ProjectsRecord } from "@/lib/types";

export function UploadModal({ projects }: { projects: ProjectsRecord[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [category, setCategory] = React.useState<DocumentCategory>("contract");
  const [project, setProject] = React.useState<string>(projects[0]?.id ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file") as File | null;
    const parsed = documentSchema.safeParse({
      name: fd.get("name"),
      category,
      project,
      file,
    });
    if (!parsed.success || !file) {
      toast({ title: "Validation error", description: parsed.error?.issues[0]?.message ?? "File required", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    try {
      const pb = getPocketBase();
      const userId = pb.authStore.record?.id;
      if (!userId) throw new Error("Not authenticated");
      const fd2 = new FormData();
      fd2.append("name", parsed.data.name);
      fd2.append("category", parsed.data.category);
      fd2.append("project", parsed.data.project);
      fd2.append("uploaded_at", new Date().toISOString());
      fd2.append("user", userId);
      fd2.append("file", file);
      await pb.collection("documents").create(fd2);
      toast({ title: "Uploaded", description: parsed.data.name });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Upload Document</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="doc-name">Name</Label>
            <Input id="doc-name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc-project">Project</Label>
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["contract", "permit", "invoice", "receipt", "photo", "other"] as DocumentCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc-file">File (PDF or image)</Label>
            <Input id="doc-file" name="file" type="file" accept="application/pdf,image/*" required />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: `document-list.tsx`**

Create `/workspace/frontend/components/documents/document-list.tsx`:

```typescript
"use client";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
import type { DocumentsRecord } from "@/lib/types";

export function DocumentList({ documents }: { documents: DocumentsRecord[] }) {
  const router = useRouter();
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents yet.</p>;
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await getPocketBase().collection("documents").delete(id);
      toast({ title: "Deleted" });
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Delete failed", variant: "destructive" });
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.name}</TableCell>
            <TableCell className="capitalize">{d.category}</TableCell>
            <TableCell>{formatDate(d.uploaded_at as unknown as string)}</TableCell>
            <TableCell className="space-x-2 text-right">
              <a href={getPocketBase().files.getURL(d, d.file)} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">Open</Button>
              </a>
              <Button size="sm" variant="destructive" onClick={() => onDelete(d.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 3: `documents/page.tsx`**

Create `/workspace/frontend/app/(dashboard)/documents/page.tsx`:

```typescript
"use client";
import { useDocuments } from "@/hooks/useDocuments";
import { useProjects } from "@/hooks/useProjects";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { UploadModal } from "@/components/documents/upload-modal";
import { DocumentList } from "@/components/documents/document-list";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function DocumentsPage() {
  const params = useSearchParams();
  const initialProject = params.get("project") ?? "all";
  const [projectFilter, setProjectFilter] = React.useState<string>(initialProject);
  const { data: documents, isLoading } = useDocuments(projectFilter !== "all" ? projectFilter : undefined);
  const { data: projects } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
        <div className="flex gap-2">
          {projects && projects.length > 0 && <UploadModal projects={projects} />}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by project:</span>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <p>Loading…</p> : <DocumentList documents={documents ?? []} />}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): documents list with project filter and upload modal"
```

---

## Phase 8: Inventory Module

### Task 20: Inventory table + form

**Files:**
- Create: `frontend/app/(dashboard)/inventory/page.tsx`
- Create: `frontend/components/inventory/inventory-table.tsx`
- Create: `frontend/components/inventory/inventory-form.tsx`

- [ ] **Step 1: `inventory-form.tsx`**

Create `/workspace/frontend/components/inventory/inventory-form.tsx`:

```typescript
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getPocketBase } from "@/lib/pocketbase";
import { inventorySchema } from "@/lib/schemas";
import { toast } from "@/components/ui/use-toast";
import type { InventoryLocation, InventoryUnit, ProjectsRecord } from "@/lib/types";

export function InventoryForm({ projects, defaultProjectId }: { projects: ProjectsRecord[]; defaultProjectId?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [unit, setUnit] = React.useState<InventoryUnit>("pieces");
  const [location, setLocation] = React.useState<InventoryLocation>("warehouse");
  const [project, setProject] = React.useState<string>(defaultProjectId ?? projects[0]?.id ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const parsed = inventorySchema.safeParse({
      item_name: fd.get("item_name"),
      quantity: fd.get("quantity"),
      unit,
      location,
      cost_per_unit: fd.get("cost_per_unit") || undefined,
      project,
    });
    if (!parsed.success) {
      toast({ title: "Validation error", description: parsed.error.issues[0]?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    try {
      const pb = getPocketBase();
      const userId = pb.authStore.record?.id;
      if (!userId) throw new Error("Not authenticated");
      await pb.collection("inventory").create({
        ...parsed.data,
        last_updated: new Date().toISOString(),
        user: userId,
      });
      toast({ title: "Item added" });
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Save failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="item">Item name</Label>
        <Input id="item" name="item_name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="qty">Quantity</Label>
        <Input id="qty" name="quantity" type="number" min="0" step="0.01" required />
      </div>
      <div className="grid gap-2">
        <Label>Unit</Label>
        <Select value={unit} onValueChange={(v) => setUnit(v as InventoryUnit)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["pieces", "lbs", "kg", "sqft", "sqm"] as InventoryUnit[]).map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Location</Label>
        <Select value={location} onValueChange={(v) => setLocation(v as InventoryLocation)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["warehouse", "job_site", "in_transit"] as InventoryLocation[]).map((l) => (
              <SelectItem key={l} value={l}>{l.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cost">Cost per unit (USD)</Label>
        <Input id="cost" name="cost_per_unit" type="number" min="0" step="0.01" />
      </div>
      <div className="grid gap-2">
        <Label>Project</Label>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Add item"}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: `inventory-table.tsx`**

Create `/workspace/frontend/components/inventory/inventory-table.tsx`:

```typescript
"use client";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InventoryRecord } from "@/lib/types";

export function InventoryTable({ items }: { items: InventoryRecord[] }) {
  const router = useRouter();
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No inventory yet.</p>;
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    try {
      await getPocketBase().collection("inventory").delete(id);
      toast({ title: "Deleted" });
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Delete failed", variant: "destructive" });
    }
  }

  const totalValue = items.reduce((sum, it) => sum + (it.cost_per_unit ?? 0) * it.quantity, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Cost/unit</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => (
          <TableRow key={it.id}>
            <TableCell className="font-medium">{it.item_name}</TableCell>
            <TableCell>{it.quantity}</TableCell>
            <TableCell className="capitalize">{it.unit}</TableCell>
            <TableCell className="capitalize">{it.location.replace("_", " ")}</TableCell>
            <TableCell>{formatCurrency(it.cost_per_unit)}</TableCell>
            <TableCell>{formatDate(it.last_updated as unknown as string)}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="destructive" onClick={() => onDelete(it.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell colSpan={4} className="text-right font-semibold">Total value</TableCell>
          <TableCell colSpan={3} className="font-semibold">{formatCurrency(totalValue)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 3: `inventory/page.tsx`**

Create `/workspace/frontend/app/(dashboard)/inventory/page.tsx`:

```typescript
"use client";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useProjects } from "@/hooks/useProjects";
import { useInventory } from "@/hooks/useInventory";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function InventoryPage() {
  const params = useSearchParams();
  const initial = params.get("project") ?? "all";
  const [filter, setFilter] = React.useState<string>(initial);
  const { data: projects } = useProjects();
  const { data: items, isLoading } = useInventory(filter !== "all" ? filter : undefined);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Project:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {projects && projects.length > 0 && (
        <InventoryForm projects={projects} defaultProjectId={filter !== "all" ? filter : undefined} />
      )}
      {projects && projects.length === 0 && (
        <p className="text-sm text-muted-foreground">Create a project first to add inventory.</p>
      )}

      {isLoading ? <p>Loading…</p> : <InventoryTable items={items ?? []} />}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /workspace && git add frontend && git commit -m "feat(frontend): inventory list, filter, add form, total value"
```

---

## Phase 9: Validation & Quality

### Task 21: Type-check + build verification

**Files:** (none — verification only)

- [ ] **Step 1: Run typecheck**

Run:
```bash
cd /workspace/frontend && pnpm typecheck
```
Expected: 0 errors. Fix any reported errors before continuing.

- [ ] **Step 2: Run production build**

Run:
```bash
cd /workspace/frontend && pnpm build
```
Expected: `Compiled successfully` and route table showing `/login`, `/register`, `/`, `/projects`, `/projects/new`, `/projects/[id]`, `/documents`, `/inventory`.

- [ ] **Step 3: Commit any fixes**

If there were fixes in `frontend/`, commit them with `chore(frontend): fix type/build errors`.

---

### Task 22: End-to-end smoke test (manual)

**Files:** (none — manual verification)

- [ ] **Step 1: Start PocketBase**

```bash
cd /workspace/backend && ./pocketbase serve --http=127.0.0.1:8090 &
```
Expected: serves on `:8090`; superuser creation prompt at `/_/`.

- [ ] **Step 2: Start frontend**

```bash
cd /workspace/frontend && cp .env.local.example .env.local && pnpm dev &
```
Expected: serves on `:3000`.

- [ ] **Step 3: Manual flow (recorded in README)**

Verify and document in `/workspace/README.md` under a "Smoke test" heading:

```markdown
## Smoke test
1. Visit http://localhost:3000 → click "Create account" → sign up.
2. On dashboard, click "New Project", create a project.
3. Click into the project → click "Add item" → add an inventory item.
4. From Documents, click "Upload Document", upload a PDF or image.
5. Sign out via user menu → sign back in.
6. Confirm: only your projects/docs/inventory are visible (create a second user to test isolation).
```

- [ ] **Step 4: Stop both servers**

```bash
pkill -f pocketbase || true ; pkill -f "next dev" || true
```

- [ ] **Step 5: Final commit**

```bash
cd /workspace && git add . && git commit -m "docs: add end-to-end smoke test instructions"
```

---

## Self-Review Notes

**Spec coverage:**
- PocketBase users extension (company_name, phone) → Task 3 ✓
- projects collection with status select, budget, dates, user relation → Task 4 ✓
- documents collection with file field (50MB, PDF/image), category select, project relation → Task 5 ✓
- inventory collection with quantity, unit, location, cost, project relation → Task 6 ✓
- API rules per-user via `@request.auth.id == user` → Tasks 4–6 ✓
- Next.js 14 App Router → Tasks 8, 10 ✓
- Tailwind + shadcn/ui + Lucide → Tasks 9, 10 ✓
- Folder structure per spec → Files section ✓
- Auth pages login/register → Tasks 12, 13 ✓
- Dashboard, projects, documents, inventory pages → Tasks 14, 16, 17, 18, 19, 20 ✓
- Zod validation → Task 15 ✓
- Mobile-first responsive layout (Sidebar becomes hidden < md) → Task 14 ✓

**Placeholders removed:** None.

**Type consistency:** `useProjects/useDocuments/useInventory` keys match between hooks and consumers. Field names in types match migration definitions. `getPocketBase().files.getURL` is the canonical PocketBase JS SDK call. Status enum strings are consistent across schema/form/types.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-29-gc-pallet-saas.md`. Choose:

1. **Subagent-Driven (recommended)** – I dispatch a fresh subagent per task with two-stage review between tasks. Fast iteration, high quality.
2. **Inline Execution** – I execute tasks in this session with checkpoints for your review.

Which approach?
