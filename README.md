# PDFTrackr

Secure PDF Sharing & Analytics SaaS platform that lets users upload PDFs, generate secure smart links, track who views them, and monitor usage with full analytics.

## Features

- 📄 **Secure PDF Upload & Sharing** - Upload PDFs and create smart share links with customizable options
- 📊 **Advanced Analytics** - Track viewer identity, view time per page, scroll depth, and referrer data
- 🔐 **Access Controls** - Email gating, download restrictions, expiration settings, and auto-watermarking
- 📈 **User Dashboard** - Manage files, view analytics, and monitor storage quotas
- 💰 **Multiple Plans** - Free, Pro, and Team tiers with different storage and file limits
- 📟 **Monitoring** - Prometheus metrics and Grafana dashboards for operational insights

## Tech Stack

- **Frontend**: Next.js (React) + TailwindCSS
- **Backend**: Node.js (Express) + PostgreSQL + Redis
- **Auth**: Clerk (email-based login)
- **Storage**: DigitalOcean Spaces (S3-compatible)
- **Monitoring**: Prometheus + Grafana
- **Deployment**: DigitalOcean Droplet + Docker Compose

## Project Structure

```
pdftrackr/
├── frontend/          # Next.js React application
├── backend/           # Express.js API server
├── docker/           # Docker configuration
├── monitoring/       # Prometheus & Grafana configs
└── docs/             # Documentation
```

## Quick Start

1. **Development Setup**
   ```bash
   docker-compose up -d
   ```

2. **Production Deployment**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

## Storage Quotas

| Plan | Storage | File Limit | Max File Size |
|------|---------|------------|---------------|
| Free | 100 MB  | 10 files   | 10 MB         |
| Pro  | 2 GB    | 100 files  | 25 MB         |
| Team | 10 GB   | unlimited  | 50 MB         |

## License

MIT License - see LICENSE file for details.