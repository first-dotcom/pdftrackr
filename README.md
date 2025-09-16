# PDFTrackr

Secure PDF sharing and analytics. Upload PDFs, create secure share links, and measure engagement with page-level insights.

## Features

- 📄 **PDF upload**: Authenticated users can upload PDF files; MIME-type and content are validated. Plan-based file size checks are enforced.
- 🔗 **Share links**: Create unique share links per file with options:
  - Password protection
  - Email gating (capture viewer email/name)
  - Download enable/disable
  - Watermark flag
  - Expiration date and optional max views
- 👀 **Secure viewing**: Clients obtain a signed view URL for PDFs after access validation; supports session-based permissions.
- 📈 **Analytics (per file and share)**:
  - Sessions with total duration and uniqueness
  - Page views with per-page average duration
  - Views over time, devices, countries, referers
  - Recent views, top files, and dashboard summaries
- 🧭 **Individual sessions**: Filter sessions by email, device, country, and date range; includes averaged page metrics.
- 📊 **Public stats**: Aggregated public metrics endpoint for total documents, views, and average session duration.
- 🗂️ **User dashboard APIs**: List files with share links and view counts; update titles/descriptions and flags; delete files (with storage cleanup) and quota updates.
- 🔐 **Auth & profiles**: Clerk-based auth; get/update user profile, plan quotas surfaced via profile endpoint.
- ⚖️ **Plans & quotas**: `free`, `starter`, `pro`, `business` with centralized quotas and file-size limits shared across backend and frontend.
- 🛡️ **Security & rate limits**: Helmet CSP, CSRF (selective), per-route rate limits, IP hashing for privacy, strict CORS.
- 🧹 **Jobs**: Data retention cleanup and session cleanup scheduled at startup.
- 🗣️ **Feedback**: Authenticated users can submit feedback with server-side rate limiting and history.
- 🧑‍⚖️ **GDPR data rights**: Endpoints for access, deletion, rectification, and portability of user data.
- 📊 **Prometheus metrics**: Metrics middleware is present; Grafana configs included under `monitoring/`. The scrape endpoint can be enabled as needed.
- 🛠️ **Admin APIs**: Aggregate stats (users, files, views, storage), users list with view counts, waitlist and feedback overviews.

## Tech Stack

- **Frontend**: Next.js (React) + TailwindCSS
- **Backend**: Node.js (Express) + PostgreSQL + Redis
- **Auth**: Clerk
- **Storage**: S3-compatible (DigitalOcean Spaces)
- **Monitoring**: Prometheus + Grafana
- **Deployment**: Docker Compose

## Project Structure

```
pdftrackr/
├── frontend/          # Next.js app (dashboard, viewer, marketing pages)
├── backend/           # Express API (files, share, analytics, users, admin)
├── monitoring/        # Prometheus & Grafana configs
├── nginx/             # Nginx config (production)
└── shared/            # Shared types (plans/quotas)
```

## Quick Start

1. Create required env vars and run services
   ```bash
   # Create backend/.env and set CLERK + S3 creds (see Configuration)
   docker-compose up -d
   ```

2. Access services
   - Backend API: http://localhost:3001
   - Frontend: http://localhost:3000

## Production URL

Live deployment: [pdftrackr.com](https://pdftrackr.com/)

## Configuration (required)

- Backend env (see `backend/src/config.ts`):
  - `CLERK_SECRET_KEY`
  - `DATABASE_URL`, `REDIS_URL`
  - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
  - `APP_URL` (e.g. http://localhost:3000)

## Plans and Quotas

Current enforced limits come from `shared/types/plans.ts`:

| Plan | Storage | File Count | Max File Size | Share Links |
|------|---------|------------|---------------|-------------|
| free | 500MB   | 25         | 50MB          | 25          |
| starter | 2GB  | 100        | 125MB         | 100         |
| pro | 10GB     | 500        | 250MB         | unlimited   |
| business | 50GB | unlimited  | 500MB         | unlimited   |

Analytics retention is 30 days across plans. Some paid-plan extras are flagged in code (e.g., export analytics, bulk ops, API access) but may be UI-limited.

## License

MIT License - see LICENSE.