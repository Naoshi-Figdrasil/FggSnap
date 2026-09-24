# Architecture

## System Overview

Snaplink is a serverless, event-driven URL shortener. It prioritizes:
1. **Low-latency redirects** — p99 under 100ms globally
2. **Horizontal scalability** — handles 100x traffic spikes without ops intervention
3. **Cost efficiency** — pay-per-use model
4. **Observability** — every request traceable end-to-end

## Component Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   CloudFront CDN    │
└──────────┬──────────┘
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌────────┐    ┌──────────────┐
│S3 React│    │ API Gateway  │
└────────┘    └──────┬───────┘
                     │
                     ▼
              ┌───────────────┐
              │Lambda: NestJS │
              └───┬───┬───┬───┘
                  │   │   │
        ┌─────────┘   │   └─────────┐
        ▼             ▼             ▼
   ┌────────┐   ┌─────────┐   ┌────────┐
   │DynamoDB│   │ RDS PG  │   │ Redis  │
   └───┬────┘   └─────────┘   └────────┘
       │
       │ DynamoDB Streams
       ▼
   ┌────────┐
   │  SQS   │
   └───┬────┘
       │
       ▼
   ┌────────────────────┐
   │Lambda: Analytics   │
   └────┬───────────┬───┘
        │           │
        ▼           ▼
     ┌──────┐   ┌──────────┐
     │  S3  │   │CloudWatch│
     └──────┘   └──────────┘
```

## Component Responsibilities

### CloudFront
- Global edge caching for static assets and hot redirects
- TLS termination
- WAF integration for DDoS protection

### API Gateway (HTTP API)
- Request routing
- JWT authorizer
- Throttling (10,000 req/s burst, 5,000 steady)
- Access logging to CloudWatch

### Lambda: API (NestJS)
- Auth (register, login, refresh)
- Link CRUD
- Analytics queries
- Emits events to SQS

### Lambda: Analytics Worker
- Consumes SQS messages
- Enriches with geo IP data
- Persists to S3 as Parquet
- Updates aggregated metrics in DynamoDB

### DynamoDB (Links)
- Table: `snaplink-links-{env}`
- PK: `alias` (String)
- Attributes: `originalUrl`, `userId`, `createdAt`, `expiresAt`, `clicks`
- GSI: `userId-createdAt-index` for listing user links
- Streams enabled → SQS

### RDS PostgreSQL (Users, Billing)
- Users, sessions, API keys, subscriptions
- ACID guarantees for billing operations
- Connection pooling via RDS Proxy

### Redis (Cache + Rate Limit)
- Hot link cache (TTL 1h, LRU eviction)
- Rate limiting (sliding window counter)
- Session store for JWT blacklist

## Data Flow

### 1. Create Link
```
Client → API Gateway → Lambda → Validate → DynamoDB PutItem
                                          ↓
                                     Return 201
```

### 2. Redirect
```
Client → CloudFront → API Gateway → Lambda
                                       ↓
                                   Redis GET (hit?)
                                   ├─ yes → 302 (5ms)
                                   └─ no  → DynamoDB GetItem → cache → 302 (25ms)
                                       ↓
                                   SQS SendMessage (async)
```

### 3. Analytics Processing
```
SQS → Lambda Worker → GeoIP lookup → Aggregate → S3 (Parquet)
                                              → DynamoDB (daily counters)
```

## Scaling Characteristics

| Component | Scaling Model | Limit |
|---|---|---|
| CloudFront | Automatic | Unlimited |
| API Gateway | Automatic | 10k req/s (soft) |
| Lambda | Automatic | 1,000 concurrent (default) |
| DynamoDB | On-demand | Unlimited |
| RDS PostgreSQL | Vertical + read replicas | 5,000 conn (via Proxy) |
| Redis | Vertical | 100k ops/s |

## Failure Modes & Mitigations

| Failure | Impact | Mitigation |
|---|---|---|
| DynamoDB throttle | Slow redirects | On-demand mode + Redis cache |
| Lambda cold start | +200ms latency | Provisioned concurrency for hot paths |
| SQS backlog | Delayed analytics | Auto-scale Lambda consumers |
| RDS down | Login fails | Multi-AZ + automated failover |
| Redis down | Rate limit bypass | Fail-open with circuit breaker |

## Security

- **Auth**: JWT (RS256), 15-min access token, 7-day refresh token
- **Rate Limiting**: 100 req/min per user, 1,000 req/min per API key
- **Input Validation**: `class-validator` on all DTOs
- **Secrets**: AWS Secrets Manager with automatic rotation
- **Network**: RDS in private subnet, VPC endpoints for AWS services
- **WAF**: OWASP Top 10 ruleset enabled
- **Encryption**: TLS 1.3 in transit, AES-256 at rest