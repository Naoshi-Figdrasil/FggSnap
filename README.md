# FggSnap

FggSnap is a small URL shortener with a NestJS API and React dashboard.

## Run locally

```bash
pnpm install
cp .env.example .env
cp apps/dashboard/.env.example apps/dashboard/.env
pnpm dev
```

- Dashboard: `http://localhost:5173`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

The API persists links to `./data/links.json` by default. Configure
`LINKS_DATA_FILE` for a different persistent location.

## Verify

```bash
pnpm build
pnpm test
pnpm --filter api test:e2e
pnpm lint
```

## Production note

The JSON repository is suitable for a single API instance and a modest MVP.
Use a database repository before running multiple API instances or requiring
high write throughput.
