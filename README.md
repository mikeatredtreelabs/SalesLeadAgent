# LeadAgent — AI Sales Intelligence

An agentic lead research and outreach tool for AI consultants. Finds, researches, scores, and helps you close leads using Claude AI agents.

## Features

- **5 AI agents**: Research, Score, Opportunities, Outreach, Call Prep
- **Apollo.io integration**: Discover leads by industry and company size
- **PWA**: Install on your phone as a native app
- **Full pipeline**: New → Researching → Qualified → Outreach Ready → Won

## Stack

- **Next.js 14** (App Router)
- **PostgreSQL** via Prisma
- **NextAuth.js** (credentials)
- **Anthropic Claude** (claude-sonnet-4-6)
- **Tailwind CSS**

## Setup

### 1. Clone and install

```bash
git clone https://github.com/mikeatreelabs/leadagent.git
cd leadagent
npm install
```

### 2. Set up environment

```bash
cp .env.local.example .env.local
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ANTHROPIC_API_KEY
```

**Database**: Use [Neon](https://neon.tech) for free Postgres — works perfectly with Vercel.

**NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`

### 3. Push schema and seed

```bash
npx prisma db push
npm run seed
# Creates: admin@leadagent.io / changeme123
```

### 4. Run

```bash
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

```bash
# One command
npx vercel --prod
```

Set all env vars in Vercel dashboard under Settings → Environment Variables.

## PWA Install

1. Open the deployed URL in Safari (iOS) or Chrome (Android)
2. Tap Share → Add to Home Screen (iOS) or Install App (Android)
3. LeadAgent appears as a native app icon

## Apollo.io (Lead Discovery)

1. Sign up at [apollo.io](https://apollo.io) — free tier available
2. Get your API key from Settings → Integrations → API
3. Add `APOLLO_API_KEY=your-key` to `.env.local`
4. Use the Discover page to search by industry and size

## Agent pipeline

```
Add Lead → Research → Score → Opportunities → Outreach → Call Prep
```

Each step button-triggered. Each result stored in the database. Every action logged in the activity feed.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✓ | Random secret for JWT signing |
| `NEXTAUTH_URL` | ✓ | Your app URL (http://localhost:3000 locally) |
| `ANTHROPIC_API_KEY` | ✓ | From console.anthropic.com |
| `APOLLO_API_KEY` | optional | For lead discovery |

## Push to GitHub

The repo is already initialized with git history. Just run:

```bash
# 1. Create the repo at github.com/new
#    Name: leadagent | Private or Public | NO readme, NO .gitignore

# 2. Add remote and push
git remote add origin https://github.com/mikeatreelabs/leadagent.git
git push -u origin main
```

That's it. Vercel will auto-detect the Next.js app on first deploy.
