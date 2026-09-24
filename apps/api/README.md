# FggSnap API

NestJS API for creating, listing, deleting, and redirecting short links.

## Run locally

From the repository root:

```bash
pnpm install
cp .env.example .env
pnpm --filter api start:dev
```

The API listens on `http://localhost:3000` by default.

## Endpoints

- `GET /health` - service health check
- `POST /links` - create a short link
- `GET /links` - list links
- `GET /links/:id` - get one link
- `DELETE /links/:id` - delete a link
- `GET /:alias` - redirect to the original URL and increment clicks

The default repository stores data in `./data/links.json`. Set
`LINKS_DATA_FILE` to change the location. This file is intentionally ignored
by Git and should be stored on a persistent volume in production.

## Validation

```bash
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api build
```
