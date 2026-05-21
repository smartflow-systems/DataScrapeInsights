# DataScrapeInsights (DataFlow)

> A data analytics platform for product managers — scrape the web, analyse social media sentiment, and query your data using plain English.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-FFD700?style=for-the-badge&logo=replit&logoColor=black)](https://datascrapeinsights.replit.app)
[![SmartFlow Systems](https://img.shields.io/badge/SmartFlow-Systems-0a0a0a?style=for-the-badge)](https://github.com/smartflow-systems)

---

## What It Does

DataFlow gives product managers and data teams a single dashboard to collect, query, and export data without needing an engineer. You can set up automated web scrapers to pull data from any site, run social media sentiment analysis across platforms, and ask questions in plain English — the app translates them into SQL and runs them against your database instantly. Results can be exported in multiple formats for reporting and presentations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Runtime | Node.js 18+ |
| Framework | Express.js (backend) + Vite (frontend) |
| Frontend | React, Shadcn/ui, Radix UI, Tailwind CSS, TanStack Query, Wouter |
| Database / Storage | PostgreSQL via Neon (serverless) — Drizzle ORM |
| Key packages | OpenAI (NL-to-SQL + sentiment), Zod, React Hook Form, express-rate-limit, express-session |

---

## How to Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/smartflow-systems/DataScrapeInsights.git
cd DataScrapeInsights

# 2. Install dependencies
npm install

# 3. Copy the environment variables file and fill in your values
cp .env.example .env

# 4. Push the database schema
npm run migrate

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:5000`.

---

## Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `OPENAI_API_KEY` | Yes | OpenAI key — powers NL-to-SQL translation and sentiment analysis | `sk-proj-abc123` |
| `SESSION_SECRET` | Yes | Secret for signing user sessions | `random-session-secret` |
| `PORT` | No | Server port | `5000` |
| `NODE_ENV` | No | Environment (`development` / `production`) | `development` |

---

## API Endpoints

| Method | Route | Auth required | Description |
|---|---|---|---|
| `GET` | `/health` | No | Health check |
| `GET` | `/api/stats` | No | Dashboard summary stats |
| `POST` | `/api/nl-to-sql` | No | Translate a natural language question into SQL and run it |
| `POST` | `/api/queries/:id/execute` | No | Re-execute a saved query |
| `POST` | `/api/queries/:id/explain` | No | Get an AI explanation of a query's results |
| `POST` | `/api/queries/:id/save` | No | Save a query for later use |
| `GET` | `/api/queries` | No | List all saved queries |
| `POST` | `/api/scrapers` | No | Create a new web scraper configuration |
| `GET` | `/api/scrapers` | No | List all scrapers |
| `POST` | `/api/scrapers/test` | No | Test a scraper without saving results |
| `POST` | `/api/scrapers/:id/run` | No | Run a scraper and store results |
| `GET` | `/api/social-media` | No | List collected social media posts |
| `POST` | `/api/social-media/:id/analyze` | No | Run sentiment analysis on a post |
| `POST` | `/api/exports` | No | Create a data export job |
| `GET` | `/api/exports` | No | List all exports |
| `GET` | `/api/activities` | No | Activity log of all user and system actions |

---

## How It Connects to SmartFlow Systems

- **Main hub** — [`smartflow-systems/SmartFlowSite`](https://github.com/smartflow-systems/SmartFlowSite) links to this repo's live demo from the DataFlow Insights product card on the homepage.
- **Design system** — follows the SFS design system (gold `#FFD700` on dark `#0a0a0a`). See [`sfs-claude-skills`](https://github.com/smartflow-systems/sfs-claude-skills) for the full token reference.
- **Stripe** — Not used in this repo.
- **Other integrations** — OpenAI GPT is a core dependency: powers natural language to SQL translation and social media sentiment scoring. Neon serverless PostgreSQL stores scraped data, queries, social media posts, exports, and the activity log.

---

## Live Demo

**[datascrapeinsights.replit.app](https://datascrapeinsights.replit.app)** — Live platform: set up a scraper, run a natural language query, and export results.

---

## Design System

This repo follows the SmartFlow Systems design system.

- Brand colours: Gold `#FFD700` on dark background `#0a0a0a`
- Typography: Inter (headings), system-ui (body)
- Full token reference and component rules: [`sfs-claude-skills/sfs-design-system/SKILL.md`](https://github.com/smartflow-systems/sfs-claude-skills/blob/main/sfs-design-system/SKILL.md)

---

## Contact

| | |
|---|---|
| Sales enquiries | [sales@smartflowsystems.com](mailto:sales@smartflowsystems.com) |
| Book a demo | [calendly.com/boweazy123](https://calendly.com/boweazy123) |

---

## Part of the SmartFlow Systems Suite

SmartFlow Systems builds automation tools for modern businesses — booking, CRM, e-commerce, AI bots, analytics, and more.

| | |
|---|---|
| Website | [smartflowsystems.replit.app](https://smartflowsystems.replit.app) |
| All repos | [github.com/smartflow-systems](https://github.com/smartflow-systems) |

---

*Built by SmartFlow Systems.*
