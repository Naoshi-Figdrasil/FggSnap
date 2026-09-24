# API Reference

Base URL: `https://api.snaplink.io`  
Version: `v1`  
Auth: Bearer JWT (except `/auth/*` and `/:alias`)

## Authentication

### POST /auth/register

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "user": { "id": "usr_abc", "email": "user@example.com" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### POST /auth/login

**Request:**
```json
{ "email": "user@example.com", "password": "SecurePass123!" }
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### POST /auth/refresh

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response:** `200 OK` — new token pair

---

## Links

### POST /links

Create a short link.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "url": "https://example.com/long-url",
  "customAlias": "my-link",         // optional
  "expiresAt": "2026-12-31T23:59:59Z", // optional
  "password": "secret123"           // optional
}
```

**Response:** `201 Created`
```json
{
  "id": "lnk_2xY8zK9p",
  "alias": "my-link",
  "shortUrl": "https://snpl.io/my-link",
  "originalUrl": "https://example.com/long-url",
  "createdAt": "2026-01-15T10:30:00Z",
  "expiresAt": "2026-12-31T23:59:59Z",
  "hasPassword": false,
  "clicks": 0
}
```

### GET /links

List current user's links (paginated).

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sort` (`createdAt`, `clicks`)

**Response:** `200 OK`
```json
{
  "data": [ /* array of links */ ],
  "meta": { "page": 1, "limit": 20, "total": 47 }
}
```

### GET /links/:id

**Response:** `200 OK` — link details

### PATCH /links/:id

**Request:**
```json
{ "url": "https://new-destination.com" }
```

### DELETE /links/:id

**Response:** `204 No Content`

### GET /links/:id/qr

**Response:** `200 OK` — `image/png` QR code (512x512)

---

## Analytics

### GET /analytics/:linkId/summary

**Query Parameters:**
- `from` (ISO date)
- `to` (ISO date)

**Response:** `200 OK`
```json
{
  "totalClicks": 15420,
  "uniqueVisitors": 8734,
  "topCountry": "ID",
  "avgClicksPerDay": 514
}
```

### GET /analytics/:linkId/timeseries

**Response:**
```json
{
  "data": [
    { "date": "2026-01-01", "clicks": 320 },
    { "date": "2026-01-02", "clicks": 412 }
  ]
}
```

### GET /analytics/:linkId/geo

**Response:**
```json
{
  "data": [
    { "country": "ID", "clicks": 5000 },
    { "country": "US", "clicks": 3200 }
  ]
}
```

### GET /analytics/:linkId/export

Returns a signed S3 URL (valid 15 min) to download CSV.

```json
{ "downloadUrl": "https://s3.amazonaws.com/..." }
```

---

## Redirect

### GET /:alias

Public endpoint. Returns `302 Redirect` or:
- `404` if not found
- `410` if expired
- `401` if password-protected (renders HTML form)

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "url", "message": "must be a valid URL" }
  ],
  "requestId": "abc-123"
}
```

| Status | Meaning |
|---|---|
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing/invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 409 | Conflict — alias already taken |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint | Limit |
|---|---|
| `/auth/*` | 10 req/min per IP |
| `/links` | 100 req/min per user |
| `/:alias` | 1,000 req/min per IP |
| `/analytics/*` | 60 req/min per user |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705312800
```