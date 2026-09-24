# ADR 001: Use Serverless over Containers

**Status:** Accepted  
**Date:** 2026-01-10  
**Deciders:** Your Name

## Context

Snaplink needs to handle unpredictable traffic — viral links can generate 100,000 req/s in minutes, while idle periods see <1 req/s. Traditional containers (ECS/EKS) require pre-provisioned capacity, which is expensive during idle periods and slow to scale during spikes (3–5 minutes to add nodes).

## Decision

Use **AWS Lambda** + **API Gateway** for all backend compute.

## Rationale

| Criterion | Lambda | ECS/EKS |
|---|---|---|
| Cold start | ~200ms | N/A (always warm) |
| Scale-up time | ~1s | 3–5 min |
| Cost at idle | $0 | ~$50/mo minimum |
| Cost at 1M req/mo | ~$5 | ~$40 |
| Ops overhead | Minimal | Moderate |
| Max concurrency | 1,000 (default) | Depends on cluster |

For Snaplink's workload, Lambda wins on **cost** and **elasticity** — the two most critical factors.

## Consequences

### Positive
- Zero cost when idle
- Instant scale to thousands of concurrent requests
- No server patching or AMI management
- Pay-per-invocation pricing aligns cost with usage

### Negative
- **Cold starts** add ~200ms latency on first request
- **Vendor lock-in** to AWS (mitigated with hexagonal architecture — business logic is framework-agnostic)
- **15-minute execution limit** (irrelevant for our use case)
- **Debugging** is harder without a persistent environment

### Mitigations
- Use **Provisioned Concurrency** for the redirect handler (hot path)
- Abstract AWS SDK behind repository interfaces
- LocalStack for local development
- Structured logging + X-Ray for distributed tracing

## Alternatives Considered

1. **ECS Fargate** — rejected due to cost at idle
2. **App Runner** — considered, but Lambda has better pricing for bursty traffic
3. **Cloudflare Workers** — rejected due to Node.js compatibility limitations