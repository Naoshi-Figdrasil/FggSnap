# 🔗 Snaplink

> A production-grade, serverless URL shortener with real-time analytics, built with NestJS, React, and AWS.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/snaplink/actions)
[![Coverage](https://img.shields.io/badge/coverage-87%25-green)](https://github.com/yourusername/snaplink)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20.x-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)

**Live Demo:** [https://snaplink.yourdomain.com](https://snaplink.yourdomain.com)  
**API Docs:** [https://api.snaplink.yourdomain.com/docs](https://api.snaplink.yourdomain.com/docs)  
**Demo Video:** [Watch on Loom](https://loom.com/your-demo)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Monitoring & Observability](#-monitoring--observability)
- [Performance](#-performance)
- [Design Decisions](#-design-decisions)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Snaplink** is a serverless URL shortener designed to demonstrate production-grade backend engineering practices: scalability, observability, security, and cost efficiency. It handles high-throughput redirects with sub-100ms p99 latency, tracks click analytics in real-time, and is deployed entirely on AWS serverless infrastructure.

### Why I Built This

Most URL shorteners are simple CRUD apps. Snaplink was built to showcase:

- **Serverless architecture** at scale (Lambda + API Gateway + DynamoDB)
- **Production observability** (CloudWatch, Grafana, Sentry, structured logging)
- **Infrastructure as Code** (AWS CDK in TypeScript)
- **Real-world concerns** — rate limiting, caching, idempotency, and multi-region readiness

---

## ✨ Features

### Core
- 🔗 **Short link creation** with auto-generated or custom aliases
- ⚡ **Fast redirects** — p99 latency under 100ms globally
- 🔐 **JWT authentication** with refresh token rotation
- 📱 **QR code generation** for every link
- ⏰ **Link expiration** and password protection
- 🌐 **Custom domains** for premium users

### Analytics
- 📊 **Real-time click tracking** (timestamp, IP, user-agent, referrer, geo)
- 📈 **Interactive dashboard** — daily clicks, top referrers, device breakdown, country heatmap
- 📤 **CSV/PDF export** of analytics data
- 🔔 **Webhook notifications** on click events

### Developer Experience
- 🔑 **API keys** for programmatic access
- 📚 **OpenAPI 3.0 specification** with Swagger UI
- 🧪 **Comprehensive tests** — unit, integration, and load tests
- 🐳 **Docker Compose** for one-command local dev
- 🤖 **CI/CD with GitHub Actions**

### Production-Grade
- 🛡️ **Rate limiting** per user and per API key (sliding window with Redis)
- 🚨 **Alerting** to Slack on error-rate spikes
- 📉 **Distributed tracing** with AWS X-Ray
- 🔒 **Security**: Helmet, CORS, input validation, secret rotation via AWS Secrets Manager
- 💰 **Cost-optimized** — runs within AWS Free Tier for demo traffic

---

## 🏗️ Architecture

### High-Level Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────┐         ┌──────────────────┐
│   CloudFront CDN    │────────▶│  S3 (React App)  │
└──────────┬──────────┘         └──────────────────┘
           │
           │ /api/*
           ▼
┌─────────────────────┐
│    API Gateway      │
│  (Throttling + WAF) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│   Lambda: NestJS API        │
│  (Auth, Links, Analytics)   │
└──┬────────────┬────────────┬┘
   │            │            │
   ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌─────────┐
│DynamoDB│  │  RDS   │  │  Redis  │
│ (links)│  │(users) │  │(cache)  │
└────────┘  └────────┘  └─────────┘
   │
   │ stream
   ▼
┌─────────────────────┐
│   SQS Queue         │
└──────────┬──────────┘
           ▼
┌─────────────────────────────┐
│  Lambda: Analytics Worker   │
└──────────────┬──────────────┘
               │
               ▼
       ┌───────────────┐      ┌──────────────┐
       │  S3 (events)  │─────▶│  CloudWatch  │
       └───────────────┘      │   + Sentry   │
                              └──────┬───────┘
                                     ▼
                              ┌──────────────┐
                              │   Grafana    │
                              │  Dashboard   │
                              └──────────────┘
```

### Data Flow — Redirect Request

1. User hits `https://snpl.io/abc123`
2. CloudFront → API Gateway → Lambda (Redirect Handler)
3. Lambda checks **Redis cache** first (hot links)
4. Cache miss → fetch from **DynamoDB**
5. Emit click event to **SQS** asynchronously
6. Return `302 Redirect` with original URL
7. Analytics Worker consumes SQS, enriches with geo data, persists to S3

Full architecture details: [`docs/architecture.md`](docs/architecture.md)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Recharts | Dashboard UI |
| **Backend** | NestJS 10, TypeScript, Express adapter | REST API |
| **Runtime** | AWS Lambda (Node.js 20.x) | Serverless compute |
| **API Layer** | AWS API Gateway (HTTP API) | Routing, throttling |
| **Databases** | DynamoDB (links), PostgreSQL 15 (users, billing) | Polyglot persistence |
| **Cache** | ElastiCache Redis / Upstash | Hot data, rate limiting |
| **Queue** | AWS SQS + DLQ | Async analytics |
| **Storage** | AWS S3 | Exports, event archive |
| **Auth** | JWT + refresh tokens, bcrypt | Security |
| **Monitoring** | CloudWatch, X-Ray, Grafana, Sentry | Observability |
| **IaC** | AWS CDK (TypeScript) | Infrastructure |
| **CI/CD** | GitHub Actions | Automation |
| **Testing** | Jest, Supertest, k6 | Unit / Integration / Load |
| **Container** | Docker, Docker Compose | Local dev |
| **Code Quality** | ESLint, Prettier, Husky, Commitlint | Consistency |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **pnpm** ≥ 9.x (`npm i -g pnpm`)
- **Docker** & **Docker Compose**
- **AWS CLI** v2 (configured with `aws configure`)
- **AWS CDK** (`npm i -g aws-cdk`)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/yourusername/snaplink.git
cd snaplink

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start local stack (Postgres + Redis + LocalStack)
docker-compose up -d

# 5. Run database migrations
pnpm --filter api migration:run

# 6. Start API (http://localhost:3000)
pnpm --filter api dev

# 7. Start dashboard (http://localhost:5173)
pnpm --filter dashboard dev
```

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests (requires local stack)
pnpm test:e2e

# Load test (requires k6 installed)
k6 run tests/load/redirect.js
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | API port | `3000` |
| `JWT_SECRET` | JWT signing key | `super-secret` |
| `DATABASE_URL` | PostgreSQL connection | `postgres://...` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `AWS_REGION` | AWS region | `ap-southeast-1` |
| `DYNAMODB_TABLE` | Links table | `snaplink-links-dev` |
| `SQS_QUEUE_URL` | Analytics queue | `https://sqs...` |
| `SENTRY_DSN` | Error tracking | `https://...` |

---

## 📁 Project Structure

```
snaplink/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── links/
│   │   │   │   ├── analytics/
│   │   │   │   ├── users/
│   │   │   │   └── billing/
│   │   │   ├── common/         # Guards, filters, interceptors
│   │   │   ├── config/
│   │   │   ├── infrastructure/ # DB, cache, queue clients
│   │   │   └── main.ts
│   │   └── test/
│   ├── dashboard/              # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── App.tsx
│   │   └── public/
│   └── analytics-worker/       # Lambda consumer
│       └── src/
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── shared-utils/           # Common utilities
│   └── config/                 # ESLint, TS configs
├── infra/
│   └── cdk/                    # AWS CDK stacks
│       ├── lib/
│       │   ├── api-stack.ts
│       │   ├── database-stack.ts
│       │   ├── analytics-stack.ts
│       │   └── monitoring-stack.ts
│       └── bin/
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── decisions/
│   │   ├── 001-serverless-over-containers.md
│   │   ├── 002-dynamodb-for-links.md
│   │   └── 003-redis-for-rate-limiting.md
│   └── runbook.md
├── tests/
│   ├── load/
│   │   └── redirect.js
│   └── e2e/
├── .github/workflows/
│   ├── ci.yml
│   ├── deploy-api.yml
│   └── deploy-dashboard.yml
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 📚 API Documentation

Full OpenAPI spec available at [`docs/api.md`](docs/api.md) or `/docs` endpoint (Swagger UI).

### Quick Reference

#### Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

#### Links

```http
POST   /links               # Create short link
GET    /links               # List user's links
GET    /links/:id           # Get link details
PATCH  /links/:id           # Update link
DELETE /links/:id           # Delete link
GET    /links/:id/qr        # Generate QR code
```

#### Analytics

```http
GET /analytics/:linkId/summary      # Total clicks, unique visitors
GET /analytics/:linkId/timeseries   # Clicks over time
GET /analytics/:linkId/geo          # Top countries
GET /analytics/:linkId/referrers    # Top referrers
GET /analytics/:linkId/export       # CSV export (signed S3 URL)
```

#### Redirect

```http
GET /:alias                 # Public redirect endpoint
```

#### Example: Create Link

**Request:**
```bash
curl -X POST https://api.snaplink.io/links \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very/long/url",
    "customAlias": "my-link",
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

**Response:**
```json
{
  "id": "lnk_2xY8zK9p",
  "shortUrl": "https://snpl.io/my-link",
  "originalUrl": "https://example.com/very/long/url",
  "createdAt": "2026-01-15T10:30:00Z",
  "expiresAt": "2026-12-31T23:59:59Z",
  "clicks": 0
}
```

---

## 🚢 Deployment

### Prerequisites

```bash
# Bootstrap CDK (once per account/region)
cd infra/cdk
cdk bootstrap aws://ACCOUNT_ID/ap-southeast-1
```

### Deploy All Stacks

```bash
pnpm --filter infra deploy:all
```

### Deploy Individual Stack

```bash
pnpm --filter infra deploy:api
pnpm --filter infra deploy:dashboard
```

### CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Runs lint + type-check + tests on every PR
2. Deploys to `staging` on merge to `develop`
3. Deploys to `production` on merge to `main` (requires manual approval)

See [`.github/workflows/`](.github/workflows/) for details.

---

## 📊 Monitoring & Observability

### CloudWatch Dashboards

Automated dashboard deployed via CDK tracks:
- Lambda invocations, errors, duration (p50/p95/p99)
- API Gateway 4xx/5xx rates
- DynamoDB read/write capacity
- SQS queue depth & DLQ messages

### Alarms

Slack alerts trigger when:
- Lambda error rate > 1% for 5 minutes
- API Gateway 5xx > 10 in 5 minutes
- DLQ message count > 0
- DynamoDB throttling events > 0

### Structured Logging

All logs use **pino** with JSON format:
```json
{
  "level": 30,
  "time": 1705312200000,
  "requestId": "abc-123",
  "userId": "usr_xyz",
  "msg": "Link created",
  "linkId": "lnk_2xY8zK9p",
  "durationMs": 42
}
```

Query with CloudWatch Logs Insights:
```sql
fields @timestamp, msg, durationMs
| filter msg = "Link created" and durationMs > 100
| sort @timestamp desc
| limit 20
```

### Error Tracking

Sentry integrated on both backend and frontend with source maps for accurate stack traces.

---

## ⚡ Performance

### Load Test Results

Conducted with **k6** on AWS Lambda (ap-southeast-1):

| Metric | Result |
|---|---|
| **Throughput** | 5,200 req/s (sustained) |
| **p50 latency** | 24ms |
| **p95 latency** | 68ms |
| **p99 latency** | 94ms |
| **Error rate** | 0.02% |
| **Cold start** | 210ms (Node.js 20, 1024MB) |

Test script: [`tests/load/redirect.js`](tests/load/redirect.js)

### Optimizations Applied

- **Redis caching** reduced DynamoDB reads by 94%
- **Lambda SnapStart** for Java-based workers (future)
- **CloudFront caching** for static assets and hot redirects
- **DynamoDB on-demand** for unpredictable traffic
- **Payload compression** with gzip

---

## 🧠 Design Decisions

Architecture Decision Records (ADRs) live in [`docs/decisions/`](docs/decisions/). Highlights:

### Why Serverless over Containers?
- **Cost**: near-zero cost at demo traffic; scales to millions of requests
- **Ops**: no servers to patch, auto-scaling built-in
- **Trade-off**: cold starts (~200ms), vendor lock-in (mitigated with hexagonal architecture)

### Why DynamoDB for Links?
- **Access pattern**: predictable `getItem` by alias — perfect fit
- **Scale**: single-digit millisecond latency at any scale
- **Cost**: on-demand pricing fits bursty traffic
- **Trade-off**: no complex queries — handled by separate analytics store

### Why Redis for Rate Limiting?
- **Atomic operations**: `INCR` + `EXPIRE` in Lua script
- **Sliding window** algorithm prevents burst abuse
- **Trade-off**: extra infra cost, mitigated by Upstash serverless Redis

Full ADRs: [`docs/decisions/`](docs/decisions/)

---

## 🗺️ Roadmap

### Q2 2026
- [ ] Multi-region deployment (Lambda@Edge)
- [ ] A/B testing for link destinations
- [ ] Bulk link import via CSV

### Q3 2026
- [ ] React Native mobile app
- [ ] Team workspaces with RBAC
- [ ] Stripe billing integration for premium tier

### Q4 2026
- [ ] Machine learning for spam/malware detection
- [ ] Webhook retry with exponential backoff
- [ ] Public API marketplace listing

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# Fork, then:
git checkout -b feature/amazing-feature
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

Commit convention: [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [linkedin.com/in/yourusername](https://linkedin.com/in/yourusername)
- Blog: [yourblog.com](https://yourblog.com)

---

## 🙏 Acknowledgments

- Inspired by [Bitly](https://bitly.com), [Dub.co](https://dub.co), and [TinyURL](https://tinyurl.com)
- Icons by [Lucide](https://lucide.dev)
- Built with ❤️ and lots of ☕

---

⭐ **If you find this project useful, please consider giving it a star!**