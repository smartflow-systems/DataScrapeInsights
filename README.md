# DataScrapeInsights

**AI-Powered Web Scraping & Data Analysis Platform** by SmartFlow Systems

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Transform unstructured web data into actionable insights with AI-powered scraping, natural language SQL queries, and advanced analytics.

---

## Overview

DataScrapeInsights is a comprehensive data extraction and analysis platform that combines web scraping capabilities with AI-powered natural language processing. Convert plain English questions into SQL queries, scrape websites with intelligent extraction, and analyze social media sentiment - all through an intuitive dashboard.

### Key Features

- **Natural Language to SQL** - Ask questions in plain English, get SQL queries instantly
- **Web Scraping Engine** - Extract data from any website with configurable scrapers
- **AI-Powered Analysis** - OpenAI integration for intelligent data processing
- **Social Media Analytics** - Sentiment analysis and engagement tracking
- **Real-Time Dashboard** - Live stats, visualizations, and activity feeds
- **Query History** - Save, manage, and replay your data queries
- **Export Capabilities** - Download data in multiple formats (CSV, JSON, Excel)
- **Smart Caching** - Memoized results for faster repeated queries

---

## Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** - Lightning-fast build tool
- **TanStack Query** - Powerful data fetching
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualizations
- **Lucide Icons** - Beautiful icon system

### Backend
- **Node.js** + Express
- **TypeScript** - Type-safe server code
- **Drizzle ORM** - SQL database toolkit
- **OpenAI API** - GPT-4 powered AI features
- **WebSocket (ws)** - Real-time updates
- **Helmet** - Security hardening
- **Express Rate Limit** - API throttling

### Database
- **PostgreSQL** (via Neon serverless)
- **Drizzle ORM** for migrations and queries
- **Session storage** with connect-pg-simple

### Security & Performance
- **Helmet** - HTTP headers security
- **Rate Limiting** - 100 requests per 15 minutes
- **CORS** - Configured cross-origin policies
- **Session Management** - Secure express-session
- **Memoization** - Cached computation results

---

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)
- OpenAI API key

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/smartflow-systems/DataScrapeInsights.git
cd DataScrapeInsights
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/datascrape"

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Session & Security
SESSION_SECRET=your-random-session-secret-here

# Rate Limiting
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=100
```

4. **Initialize the database**
```bash
npm run db:push
```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:5000` 🎉

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `5000` | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for AI features |
| `SESSION_SECRET` | Yes | - | Secret for session encryption |
| `API_RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `API_RATE_LIMIT_MAX` | No | `100` | Max requests per window |

---

## Features Deep Dive

### 1. Natural Language to SQL

Convert plain English questions into executable SQL queries:

**Example:**
```
User: "Show me all users who signed up in the last 30 days"
AI: SELECT * FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
```

**API Endpoint:**
```typescript
POST /api/nl-to-sql
{
  "naturalLanguageQuery": "Show me total revenue by month"
}
```

### 2. Web Scraping Engine

Configure and run web scrapers with custom selectors:

**Features:**
- CSS selector-based extraction
- JavaScript rendering support
- Rate limiting and retry logic
- Data normalization
- Export to multiple formats

**API Endpoint:**
```typescript
POST /api/scrapers
{
  "name": "Product Scraper",
  "url": "https://example.com/products",
  "selectors": {
    "title": ".product-title",
    "price": ".product-price"
  }
}
```

### 3. Social Media Analytics

Analyze sentiment and engagement from social media data:

**Capabilities:**
- Sentiment analysis (positive/negative/neutral)
- Engagement rate calculation
- Trend detection
- Influencer identification

**API Endpoint:**
```typescript
POST /api/social-media/analyze
{
  "platform": "twitter",
  "query": "#AI"
}
```

### 4. Real-Time Dashboard

Monitor your data operations in real-time:

- **Active Scrapers** - Running scraper jobs
- **Query History** - Recent SQL queries
- **Data Exports** - Download status
- **Activity Feed** - Latest system events

---

## API Reference

### Dashboard Stats
```http
GET /api/stats
```
Returns:
```json
{
  "totalScrapers": 15,
  "totalQueries": 142,
  "totalExports": 23,
  "recentActivity": [...]
}
```

### Natural Language to SQL
```http
POST /api/nl-to-sql
Content-Type: application/json

{
  "naturalLanguageQuery": "string"
}
```

### Web Scraper Management
```http
GET    /api/scrapers          # List all scrapers
POST   /api/scrapers          # Create scraper
GET    /api/scrapers/:id      # Get scraper details
PUT    /api/scrapers/:id      # Update scraper
DELETE /api/scrapers/:id      # Delete scraper
POST   /api/scrapers/:id/run  # Run scraper
```

### Query History
```http
GET    /api/queries           # List saved queries
POST   /api/queries           # Save query
GET    /api/queries/:id       # Get query
DELETE /api/queries/:id       # Delete query
POST   /api/queries/:id/execute  # Re-run query
```

### Export Management
```http
GET    /api/exports           # List exports
POST   /api/exports           # Create export
GET    /api/exports/:id       # Download export
DELETE /api/exports/:id       # Delete export
```

---

## Database Schema

### Scrapers Table
```sql
CREATE TABLE scrapers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  selectors JSONB NOT NULL,
  schedule VARCHAR(50),
  status VARCHAR(20),
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Queries Table
```sql
CREATE TABLE queries (
  id UUID PRIMARY KEY,
  natural_language_query TEXT NOT NULL,
  sql_query TEXT NOT NULL,
  results JSONB,
  is_saved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Activities Table
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run check` | Type-check TypeScript |
| `npm run db:push` | Push database schema changes |
| `npm run sync` | Auto-sync with git |

### Project Structure

```
DataScrapeInsights/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.tsx         # Main app component
│   └── index.html
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database layer
│   ├── db.ts               # Database connection
│   ├── services/           # Business logic
│   │   └── openai.ts       # AI integrations
│   └── middleware/         # Express middleware
│       └── security.ts     # Security configs
├── shared/                 # Shared types/schemas
├── .env.example            # Environment template
├── package.json
└── README.md
```

---

## Deployment

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Docker Deployment

*Coming soon - Dockerfile will be added*

### Environment Setup

1. Set `NODE_ENV=production`
2. Use production database URL
3. Configure HTTPS reverse proxy (nginx/Caddy)
4. Set secure `SESSION_SECRET`
5. Enable rate limiting
6. Configure CORS for your domain

---

## Security

### Best Practices Implemented

- ✅ **Helmet** - HTTP security headers
- ✅ **Rate Limiting** - API throttling (100 req/15min)
- ✅ **CORS** - Cross-origin policy enforcement
- ✅ **Session Security** - Encrypted session storage
- ✅ **Input Validation** - Zod schema validation
- ✅ **SQL Injection Prevention** - Parameterized queries via Drizzle ORM
- ✅ **XSS Protection** - React auto-escaping

### Recommendations

- Rotate `SESSION_SECRET` regularly
- Use environment-specific API keys
- Enable HTTPS in production
- Implement authentication for production use
- Monitor rate limit violations
- Regular dependency updates

---

## Roadmap

### Current Version: 1.0.0

### Planned Features

- [ ] **User Authentication** - Multi-user support with role-based access
- [ ] **Scheduled Scrapers** - Cron-based automated scraping
- [ ] **Advanced Exports** - PDF, Excel with charts
- [ ] **Webhook Support** - Real-time data push to external systems
- [ ] **API Documentation** - Interactive Swagger/OpenAPI docs
- [ ] **Data Visualization Builder** - Drag-drop chart creator
- [ ] **Team Collaboration** - Shared queries and scrapers
- [ ] **Docker Support** - Official Docker images
- [ ] **CI/CD Pipeline** - Automated testing and deployment

---

## Known Issues & TODOs

### High Priority
- [ ] Implement actual file generation in background (server/routes.ts:286)
- [ ] Calculate actual changes for scraped URLs (server/storage.ts:94)
- [ ] Add Dockerfile for containerization
- [ ] Add comprehensive test suite

### Medium Priority
- [ ] Add user authentication system
- [ ] Implement WebSocket real-time updates
- [ ] Add export progress tracking
- [ ] Improve error handling and logging

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commits
- Update documentation for new features

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Support

- **Documentation**: [Coming Soon]
- **Issues**: [GitHub Issues](https://github.com/smartflow-systems/DataScrapeInsights/issues)
- **Email**: support@smartflowsystems.com

---

## Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [OpenAI](https://openai.com/)
- UI Components by [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ by SmartFlow Systems**

Part of the SmartFlow Systems ecosystem - Building intelligent automation tools for the modern web.
