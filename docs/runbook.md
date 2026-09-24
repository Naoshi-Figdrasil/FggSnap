# Operations Runbook

## On-Call Quick Reference

| Symptom | Likely Cause | First Action |
|---|---|---|
| API 5xx spike | Lambda error | Check CloudWatch Logs, Sentry |
| Redirect slow (>500ms) | Redis down / DynamoDB throttle | Check ElastiCache metrics |
| Analytics delayed | SQS backlog | Scale Lambda consumers |
| Login fails for all | RDS connection pool exhausted | Check RDS Proxy metrics |
| High cost alert | Runaway traffic / abuse | Check WAF logs, enable rate limit |

## Dashboards

- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#dashboards:name=snaplink-prod
- **Grafana**: https://grafana.snaplink.io
- **Sentry**: https://sentry.io/organizations/snaplink

## Common Tasks

### Roll Back a Deployment

```bash
# List recent versions
aws lambda list-versions-by-function --function-name snaplink-api-prod

# Point alias to previous version
aws lambda update-alias \
  --function-name snaplink-api-prod \
  --name live \
  --function-version 42
```

### Drain a Poison SQS Message

```bash
aws sqs receive-message --queue-url $DLQ_URL --max-number-of-messages 10
aws sqs delete-message --queue-url $DLQ_URL --receipt-handle "..."
```

### Scale Up RDS

Modify instance class in CDK, then:
```bash
pnpm --filter infra deploy:database
```

### Rotate Secrets

```bash
aws secretsmanager rotate-secret --secret-id snaplink/prod/jwt
# Lambda picks up new secret within 5 min (cache TTL)
```

## Incident Severity Levels

| Level | Definition | Response Time |
|---|---|---|
| SEV1 | Total outage | 15 min |
| SEV2 | Degraded (e.g., analytics delayed) | 1 hour |
| SEV3 | Minor (single user issue) | Next business day |

## Post-Mortem Template

See [`docs/postmortem-template.md`](postmortem-template.md).