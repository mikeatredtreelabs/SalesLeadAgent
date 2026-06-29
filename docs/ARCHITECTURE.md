# SalesLeadAgent — Architecture Overview

## What It Is

SalesLeadAgent is an AI-powered sales intelligence tool built for an AI consulting company. It helps discover, research, score, and manage potential leads using a pipeline of AI agents powered by Anthropic Claude.

The core insight driving the design: **the app is both the sales tool and the demo**. When talking to a prospect, you can open the app live, pull up their company, and walk them through what the AI agents discovered — making the pitch concrete instead of abstract.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components + API routes in one repo. API key never touches the client. |
| Language | TypeScript | Type safety across the full stack |
| Styling | Tailwind CSS | Utility-first, fast to iterate |
| Database | PostgreSQL (Neon) | Structured relational data, JSON columns for AI output arrays |
| ORM | Prisma 5 | Type-safe queries, easy schema migrations with `db push` |
| Auth | NextAuth.js (credentials) | Simple email/password login, JWT sessions |
| AI | Anthropic Claude (`claude-sonnet-4-6`) | Structured JSON output, strong reasoning for business analysis |
| Lead Discovery | Apollo.io API | Company search by industry and employee count |
| Hosting | Vercel (recommended) | Zero-config Next.js deployment, auto-deploys on `git push` |
| Database Hosting | Neon | Serverless Postgres, free tier, works perfectly with Vercel |

---

## Project Structure

```
SalesLeadAgent/
├── app/
│   ├── (app)/                  # Authenticated app shell (sidebar layout)
│   │   ├── layout.tsx          # Sidebar + topbar wrapper
│   │   ├── page.tsx            # Dashboard (/)
│   │   ├── leads/
│   │   │   ├── page.tsx        # Leads list with filter tabs
│   │   │   ├── new/page.tsx    # Add lead form (single + bulk paste)
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Server component — fetches lead data
│   │   │       └── LeadDetailClient.tsx # Client component — agent buttons + tabs
│   │   ├── discover/page.tsx   # Apollo.io lead discovery
│   │   ├── competitors/page.tsx # Competitor finder — enter a website, get competitors with checkbox import
│   │   ├── followups/page.tsx  # Pending follow-up tasks
│   │   └── settings/
│   │       ├── page.tsx        # Settings (server)
│   │       └── ChangePasswordForm.tsx  # Password change (client)
│   ├── login/page.tsx          # Login page (split-panel)
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts      # NextAuth handler
│       │   ├── register/route.ts           # User registration
│       │   └── change-password/route.ts    # Password update
│       ├── leads/
│       │   ├── route.ts                    # GET all leads, POST new lead
│       │   └── [id]/
│       │       ├── route.ts                # GET, PATCH, DELETE single lead
│       │       └── agents/route.ts         # All 5 AI agents (POST with agent name)
│       ├── competitors/route.ts            # AI competitor discovery from a website URL
│       └── discover/route.ts               # Apollo.io search proxy
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar with pipeline indicator
│   ├── StatusBadge.tsx         # Colored status pill component
│   └── ScoreBadge.tsx          # Score pill (green/amber/red)
├── lib/
│   ├── ai.ts                   # Anthropic client + runAgent() helper
│   ├── auth.ts                 # NextAuth config and options
│   ├── prisma.ts               # Prisma client singleton
│   └── cn.ts                   # Tailwind class merge utility
├── prisma/
│   └── schema.prisma           # Full database schema (11 models)
├── scripts/
│   └── seed.js                 # Creates initial admin user
├── docs/
│   └── ARCHITECTURE.md         # This file
├── middleware.ts                # Auth protection for all non-public routes
├── .env                        # Local env vars (never committed)
└── .env.local.example          # Template for env setup
```

---

## Database Schema

11 models covering the full lead lifecycle:

```
User
 └── Lead (many)
      ├── Contact (many)           — people at the company
      ├── CompanyResearch (many)   — versioned research runs
      ├── LeadScore (one)          — latest score with dimension breakdown
      ├── Opportunity (many)       — AI consulting opportunities
      ├── OutreachMessage (many)   — generated message variants
      ├── DiscoveryCallPrep (one)  — call prep sheet
      ├── AgentActivity (many)     — activity log (every agent writes here)
      └── FollowUpTask (many)      — pending follow-up tasks
```

**Key design decisions:**

- **CompanyResearch is versioned** — each Research run creates a new record. You can see how a lead's profile evolved as you added more information.
- **JSON columns for arrays** — `painPoints`, `questions`, `objections` are stored as JSON. Simple for V1, can be normalized into child tables later if filtering/analytics are needed.
- **`sentAt` on OutreachMessage** — messages are never auto-sent. The field only gets populated when you manually mark a message as sent, keeping a human in the loop.
- **`updatedAt` on Lead** — auto-updated by Prisma on every change, drives the "recently updated" sort on the leads list.

---

## AI Agent Pipeline

All agents live in a single API route: `POST /api/leads/[id]/agents`

The request body specifies which agent to run:
```json
{ "agent": "research", "input": "optional pasted text" }
```

### The 5 Agents

```
Add Lead → Research → Score → Opportunities → Outreach → Call Prep
```

Each agent is button-triggered in V1 (intentional — gives you control during demos).

| Agent | Input | Output | Token Budget | Writes To |
|---|---|---|---|---|
| **Research** | Pasted website/LinkedIn text + company metadata | Summary, pain points, tech maturity, consulting angle, confidence % | 1,200 | `CompanyResearch` |
| **Score** | Research summary + pain points | Score 0–100 across 9 dimensions with explanation | 900 | `LeadScore`, `Lead.score` |
| **Opportunities** | Research summary + pain points | 4 specific AI consulting opportunities with value estimates | 2,000 | `Opportunity` |
| **Outreach** | Research summary + top pain point + contact info | 3 message variants: short email, LinkedIn, executive | 1,500 | `OutreachMessage` |
| **Call Prep** | Research summary + pain points | Opening, 5 questions, 3 objections + responses, demo idea, next step | 1,800 | `DiscoveryCallPrep` |

Every agent also writes to `AgentActivity` after completing — this builds the activity log visible on the Lead Detail page.

### Why Per-Agent Token Budgets?

Each agent gets only the context it needs — not the full lead object. This prevents two failure modes:
1. **Truncated JSON** — Claude hitting the token limit mid-response produces unparseable output
2. **Context bloat** — passing the full research object to the Outreach agent wastes tokens on irrelevant data

### AI Prompt Guardrails

All agent prompts enforce:
- Return **only valid JSON** — no markdown, no preamble
- **Distinguish known facts from inferences** — the Research agent explicitly notes assumptions
- **No hallucinated web browsing** — the app works from pasted input, not pretended scraping
- **Concise strings** — each agent caps field lengths to stay within the token budget

---

## Scoring Dimensions

The Score agent evaluates leads across 9 weighted dimensions, calibrated to the consultant's background (C#, Azure, SQL Server, Business Central, logistics/trade/distribution):

| Dimension | Max Points | What it looks for |
|---|---|---|
| Industry fit | 20 | Logistics, trade, distribution, import/export, manufacturing |
| Manual process signals | 20 | Spreadsheets, PDFs, email workflows, no automation mentioned |
| Document heaviness | 15 | Invoices, customs docs, contracts, reports |
| Budget potential | 10 | Revenue signals, B2B, growth indicators |
| Background relevance | 10 | Match to ERP, Business Central, Azure, C# ecosystem |
| Urgency signals | 10 | Pain explicitly mentioned, growth pressure, compliance needs |
| Company size fit | 10 | 10–500 employees is the ideal target |
| Strategic value | 5 | Reference potential, expansion opportunity, visibility |
| **Total** | **100** | |

---

## Authentication Flow

```
Request → middleware.ts → checks JWT token
  ├── No token → redirect to /login
  └── Has token → allow through to (app) routes

/login → NextAuth credentials provider
  → bcrypt.compare(password, hashedPassword)
  → JWT issued, stored in httpOnly cookie
  → redirect to /
```

Public routes (excluded from middleware): `/login`, `/api/auth/*`

---

## Lead Detail Page Architecture

The Lead Detail page is the most important page — it's what you show prospects in a demo. It's split into two layers:

```
app/(app)/leads/[id]/page.tsx          ← Server Component
  - Fetches full lead from DB (all relations)
  - Passes serialized JSON to client component

app/(app)/leads/[id]/LeadDetailClient.tsx  ← Client Component
  - Owns all UI state (active tab, loading states, error messages)
  - Calls /api/leads/[id]/agents on agent button clicks
  - Re-fetches lead from API after each agent completes to show fresh data
  - Renders 5 tabs: Overview, Opportunities, Outreach, Call Prep, Activity
```

This server/client split is intentional:
- Initial page load is fast (server-rendered, no client JS needed for first paint)
- Agent interactions are fully interactive without a full page reload

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string (from Neon) |
| `NEXTAUTH_SECRET` | ✓ | Random secret for JWT signing — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | ✓ | App URL — `http://localhost:3000` locally, your Vercel URL in production |
| `ANTHROPIC_API_KEY` | ✓ | From console.anthropic.com — powers all 5 agents |
| `APOLLO_API_KEY` | optional | From apollo.io — enables the Discover page lead search |

---

## Deployment (Vercel)

```bash
npx vercel --prod
```

Vercel auto-detects Next.js. Set the 4 required env vars in the Vercel dashboard under **Settings → Environment Variables**. Every `git push` to `main` triggers an automatic redeploy.

**Database:** Neon's serverless Postgres works without any connection pooling configuration on Vercel. The free tier handles the traffic volume of a personal sales tool comfortably.

---

## What's Coming (V2 Roadmap)

- **Auto-pipeline** — run all agents automatically when a lead is added (background job queue via Inngest or BullMQ)
- **Live web research** — agents browse the company's website instead of requiring pasted input
- **Apollo auto-import** — bulk import discovered companies and kick off research pipeline automatically  
- **Email integration** — send outreach directly from the app (with human approval step)
- **Kanban pipeline view** — drag-and-drop lead status board
- **Multi-user / team** — share leads and pipeline across a small team

---

## White-Label / Multi-Tenant System

The app is built for white-labeling from the ground up. Each tenant gets their own branding — name, colors, logo — with zero code changes required.

### How it works

Tenant config lives in `config/tenant.ts`. The active tenant is controlled by the `NEXT_PUBLIC_TENANT` environment variable. Set it in `.env` and redeploy.

```bash
# .env
NEXT_PUBLIC_TENANT="redtreeai"   # Red Tree AI (red/black)
NEXT_PUBLIC_TENANT="default"     # SalesLeadAgent (blue)
```

### Adding a new tenant

Add a new entry to the `tenants` object in `config/tenant.ts`:

```ts
acmecorp: {
  name: 'Acme Corp AI',
  shortName: 'Acme',
  tagline: 'AI-powered sales',
  logoText: 'AC',
  colors: {
    primary: '#7c3aed',          // violet-600
    primaryHover: '#6d28d9',     // violet-700
    primaryLight: '#f5f3ff',     // violet-50
    primaryLightText: '#5b21b6', // violet-800
    accent: '#0ea5e9',
    sidebar: '#ffffff',
    sidebarBorder: '#e2e8f0',
  },
  seedEmail: 'admin@acmecorp.com',
},
```

Then deploy with `NEXT_PUBLIC_TENANT=acmecorp`.

### Current tenants

| Key | Name | Colors | Sidebar |
|---|---|---|---|
| `redtreeai` | Red Tree AI | Red + Black | Dark black sidebar |
| `default` | SalesLeadAgent | Blue | White sidebar |

### Tenant config fields

| Field | Description |
|---|---|
| `name` | Full company name (shown in sidebar, page title) |
| `shortName` | Short version |
| `tagline` | Subtitle under logo |
| `logoText` | 2-letter monogram shown in logo square |
| `colors.primary` | Main brand color — buttons, active nav, links |
| `colors.primaryHover` | Hover state for buttons |
| `colors.primaryLight` | Light tint for badges and highlights |
| `colors.primaryLightText` | Text color on light backgrounds |
| `colors.accent` | Secondary accent color |
| `colors.sidebar` | Sidebar background (use dark hex for dark sidebar) |
| `colors.sidebarBorder` | Sidebar border and dividers |
