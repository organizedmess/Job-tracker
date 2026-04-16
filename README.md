# Job Application Tracker

A full-stack web application to track, manage, and analyse job applications — with JWT authentication, a live dashboard with charts, status timelines, paginated application cards, CSV export, interview reminders via email, Redis-cached stats, per-IP rate limiting, and structured JSON logging.

---

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Application Form
![Application Form](screenshots/application-form.png)

### Applications List
![Applications List](screenshots/applications-list.png)

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Go 1.25 |
| HTTP Framework | [Gin](https://github.com/gin-gonic/gin) v1.10 |
| ORM | [GORM](https://gorm.io) v1.25 |
| Database | PostgreSQL (via `gorm.io/driver/postgres` + `pgx/v5`) |
| Authentication | [golang-jwt/jwt v5](https://github.com/golang-jwt/jwt) + [bcrypt](https://pkg.go.dev/golang.org/x/crypto/bcrypt) |
| Email | [SendGrid Go SDK](https://github.com/sendgrid/sendgrid-go) v3 |
| Redis Caching | [go-redis/v9](https://github.com/redis/go-redis) v9.18 |
| Rate Limiting | [golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate) |
| Structured Logging | [rs/zerolog](https://github.com/rs/zerolog) v1.35 |
| CORS | [gin-contrib/cors](https://github.com/gin-contrib/cors) |
| Env Config | [joho/godotenv](https://github.com/joho/godotenv) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Angular 17.3 |
| Language | TypeScript 5.4 |
| UI Components | Angular Material 17.3 |
| Charts | [Chart.js](https://www.chartjs.org) 4.4 |
| Reactive State | RxJS 7.8 |
| Motivational Quotes | [inspirational-quotes](https://www.npmjs.com/package/inspirational-quotes) npm package |

### Infrastructure
| Layer | Technology |
|---|---|
| Database | PostgreSQL |
| Cache | Redis |
| Containerisation | Docker Compose (optional) |

---

## Features

- **JWT Authentication** — Register and login; all application routes are protected via Bearer token middleware
- **Full CRUD** — Create, read, update, and delete job applications
- **Pagination** — `GET /api/applications` accepts `page` and `limit` query params; response includes `meta.total`, `meta.total_pages`
- **Search, Filter & Sort** — Filter by status, search company/role, sort by applied date or company, ascending or descending
- **Status Timeline** — Every status change is recorded; viewable in a slide-out drawer per application
- **Dashboard Charts** — Pie chart (applications by status) and weekly line chart (applications per week) using Chart.js
- **Stats Endpoint** — Total applied, in-interview count, offers, rejections, rejection rate
- **Redis Caching** — `GET /api/stats` is cached for 5 minutes per user; cache is invalidated on any create / update / delete; app works fully if Redis is unavailable
- **Rate Limiting** — 10 requests per second per IP; excess requests return `429 Too Many Requests`; IP entries are cleaned up automatically every 5 minutes
- **Structured JSON Logging** — Every HTTP request is logged (method, path, status, latency ms, IP, user_id) using zerolog; no passwords or tokens are ever logged
- **Email Reminders** — SendGrid integration sends interview reminder emails (configurable via env)
- **CSV Export** — Download all applications as a CSV file
- **Dark Mode** — Full dark-mode support including charts, Material components, and custom status chips
- **Motivational Quotes** — Randomised quotes on the Add Application page with a "New Quote" button

---

## Project Structure

```
job-tracker/
├── backend/
│   ├── config/
│   │   ├── db.go              # PostgreSQL connection (env-based)
│   │   └── redis.go           # Redis connection (graceful fallback if unavailable)
│   ├── handlers/
│   │   ├── application.go     # CRUD handlers + pagination + cache invalidation
│   │   ├── auth.go            # Register / Login
│   │   └── stats.go           # Stats with Redis caching
│   ├── middleware/
│   │   ├── auth.go            # JWT validation middleware
│   │   ├── logger.go          # Structured JSON request logging (zerolog)
│   │   └── rate_limiter.go    # Per-IP rate limiting (x/time/rate)
│   ├── models/
│   │   ├── application.go     # Application model
│   │   ├── status_history.go  # StatusHistory model
│   │   └── user.go            # User model
│   ├── routes/
│   │   └── routes.go          # Route registration + middleware order
│   ├── services/
│   │   └── email.go           # SendGrid email + reminder scheduler
│   ├── main.go                # Entry point: DB, Redis, zerolog, Gin, CORS
│   ├── go.mod
│   └── .env                   # Environment variables (not committed)
└── frontend/
    └── src/app/
        ├── components/
        │   ├── dashboard/         # Stats cards + Chart.js charts
        │   ├── application-list/  # Paginated cards + search/filter/sort + timeline drawer
        │   ├── application-form/  # Create form + motivational quote panel
        │   └── layout/            # Sidenav + toolbar + dark mode toggle
        └── services/
            └── api.service.ts     # HTTP calls to backend
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user, returns JWT |
| `POST` | `/api/auth/login` | No | Login, returns JWT |
| `GET` | `/api/stats` | Yes | Dashboard stats (Redis cached, 5 min TTL) |
| `POST` | `/api/applications` | Yes | Create a new application |
| `GET` | `/api/applications` | Yes | List applications — supports `page`, `limit`, `status`, `search`, `sort_by`, `order` |
| `GET` | `/api/applications/export` | Yes | Download all applications as CSV |
| `GET` | `/api/applications/:id/history` | Yes | Status change timeline for an application |
| `PUT` | `/api/applications/:id` | Yes | Update an existing application |
| `DELETE` | `/api/applications/:id` | Yes | Delete an application |

### Pagination response shape (`GET /api/applications`)

```json
{
  "data": [ ...applications ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
```

### Stats response shape (`GET /api/stats`)

```json
{
  "total_applied": 5,
  "in_interview": 0,
  "offers": 2,
  "rejections": 2,
  "rejection_rate": 40.0
}
```

---

## Environment Variables

Create `backend/.env` before running:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=job_tracker
DB_SSLMODE=disable
DB_URL=                         # Optional: full connection string overrides above

# Server
PORT=8080
JWT_SECRET=your_strong_secret_here

# Redis (optional — app works without it, stats just won't be cached)
REDIS_URL=redis://localhost:6379

# SendGrid (optional — required only for email reminders)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
```

---

## Getting Started

### Prerequisites

- Go 1.22+
- Node.js 18+
- PostgreSQL running locally
- Redis running locally *(optional — app works without it)*

### Backend

```bash
cd backend
cp .env.example .env      # fill in your values
go mod tidy
go run main.go
# API available at http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm start
# App available at http://localhost:4200
```

---

## Backend Highlights

### Redis Caching (`config/redis.go`)

The `GET /api/stats` endpoint is cached per-user in Redis with a 5-minute TTL. On every create, update, or delete the cache key `stats:{user_id}` is invalidated so the next request returns fresh data. If Redis is unreachable at startup, `ConnectRedis()` returns `nil` and all caching is silently skipped — the app continues to work normally.

### Rate Limiting (`middleware/rate_limiter.go`)

Uses `golang.org/x/time/rate` to enforce **10 requests per second per IP** with a burst of 10. Each IP gets its own `rate.Limiter` stored in a mutex-protected map. A background goroutine cleans up IP entries that have been idle for more than 10 minutes (runs every 5 minutes) to prevent unbounded memory growth. Exceeded requests receive `HTTP 429`.

### Structured Logging (`middleware/logger.go`)

Every HTTP request is logged as a JSON line via `rs/zerolog`:

```json
{
  "time": "2026-04-16T10:30:00Z",
  "method": "POST",
  "path": "/api/applications",
  "status": 201,
  "latency_ms": 12,
  "ip": "127.0.0.1",
  "user_id": 3
}
```

Additional log points: application created (info), user logged in (info), DB query failure (error), cache miss (warning). Passwords and JWT tokens are never logged.

### JWT Authentication (`middleware/auth.go`)

All `/api/*` routes except `/auth/register` and `/auth/login` require a `Authorization: Bearer <token>` header. The middleware validates the token signature (HMAC-SHA256), checks expiry, and injects `user_id` and `email` into the Gin context for downstream handlers.

### Pagination (`handlers/application.go`)

`GET /api/applications` accepts `page` (default `1`) and `limit` (default `10`, max `100`). A separate `COUNT` query runs against the filtered result set so `meta.total` is accurate even when filters are applied.

---

## Notes

- All protected routes require `Authorization: Bearer <token>` header
- Salary range is free-text (stored and displayed as entered)
- Interview date must be today or in the future
- Status values: `applied`, `interview`, `offer`, `rejected`
- Priority values: `low`, `medium`, `high`

- Interview reminder scheduler runs every 24 hours and sends emails for next-day interviews when SendGrid env vars are configured.
