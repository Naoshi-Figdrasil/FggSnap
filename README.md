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

## Run with Docker

Start the API and dashboard:

```bash
docker compose up --build
```

- Dashboard: `http://localhost:5173`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

The link data is stored in the `links_data` Docker volume. Stop the services
with `docker compose down`; use `docker compose down -v` only if you also want
to delete the stored links.

The API currently uses its JSON repository, not PostgreSQL. If you need a
PostgreSQL container for development, start the optional service with:

```bash
docker compose --profile database up --build
```

This creates a separate `fggsnap` database and does not connect to or replace
an existing PostgreSQL container.

If port 3000 is already in use, choose another host port:

```bash
API_PORT=3001 BASE_URL=http://localhost:3001 \
VITE_API_URL=http://localhost:3001 docker compose up --build
```

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
