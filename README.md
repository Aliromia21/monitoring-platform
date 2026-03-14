# Monitoring Platform (SaaS)

> A high-performance, production-grade monitoring engine for HTTP services. Inspired by industry leaders like **Datadog** and **UptimeRobot**.

[Live Demo](https://monitoring-v2.vercel.app) | [Backend API](https://monitoring-platform-production.up.railway.app/health)

---

| Service | Status |
|--------|--------|
| API CI | ![API Tests](https://github.com/Aliromia21/monitoring-platform/actions/workflows/api-ci.yml/badge.svg) |
| Coverage | [![codecov](https://codecov.io/gh/Aliromia21/monitoring-platform/branch/main/graph/badge.svg?token=b313f617-c805-46be-b3ee-7455221a7183)](https://codecov.io/gh/Aliromia21/monitoring-platform) |

---

## Why this project exists

This project simulates a lean version of real-world monitoring platforms like Datadog and UptimeRobot. The goal is to demonstrate distributed systems design, incident detection, and observability concepts end to end.

---

## System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Monitoring     │     │   BullMQ Queue  │     │  Worker Service │
│  Engine         │────▶│   (Redis)       │────▶│  (Consumer)     │
│  (Producer)     │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                              ┌───────────────────────────┤
                              │                           │
                    ┌─────────▼──────┐         ┌─────────▼──────┐
                    │   MongoDB      │         │  Notification  │
                    │   Atlas        │         │  Service       │
                    │  (CheckRuns,   │         │  (Resend)      │
                    │   Alerts)      │         │                │
                    └────────────────┘         └────────────────┘
```

**Deployment:**
- **Frontend:** Vercel (Global Edge Network)
- **Backend API:** Railway
- **Worker:** Railway (independent service)
- **Database:** MongoDB Atlas
- **Queue:** Redis on Railway

---

## Features

### Core Infrastructure
- **Secure Auth:** JWT-based authentication with stateless session management
- **Strict Multi-tenancy:** Ownership enforcement at the database level — no data leakage between users
- **Health Check Engine:** Decoupled background producer that schedules periodic HTTP probes

### Distributed Queue Architecture
- **Producer/Consumer Pattern:** Engine enqueues jobs into BullMQ — completely decoupled from execution
- **Job Persistence:** Jobs survive server restarts — Redis guarantees no check is lost
- **Retry Logic:** Automatic exponential backoff (3 attempts) on transient failures
- **Dead Letter Queue:** Jobs that exhaust all retries move to a separate queue — zero silent failures
- **Horizontal Scaling:** Multiple Worker instances process jobs concurrently with zero duplication — guaranteed by Redis atomic locking

### Observability & Metrics
- **Performance Tracking:** Real-time response time and availability metrics per monitor
- **Historical Analysis:** Time-series check-run storage for long-term reliability reporting
- **P95 Response Time:** 95th percentile response time calculated via MongoDB aggregation pipeline
- **Dashboard Summary:** Account-level overview — total monitors, uptime %, alerts today
- **Queue Stats API:** Live visibility into waiting, active, completed, and failed job counts
- **Visual Analytics:** Interactive latency and uptime charts using Recharts

### Smart Alerting
- **Consecutive Failure Thresholds:** DOWN alerts only after N consecutive failures — no false positives
- **State Machine Logic:**
  - `DOWN` — triggered after N consecutive failures
  - `RECOVERY` — triggered only if a previous DOWN was active
  - `SYSTEM_ERROR` — triggered when a job exhausts all retry attempts
- **Email Notifications:** Automatic email on DOWN and RECOVERY events via Resend

### API Security
- **Rate Limiting:** Global 100 req/15min + stricter 10 req/15min on auth endpoints
- **Helmet:** Secure HTTP headers on all responses
- **CORS:** Configurable origin whitelist

### Caching Layer
- **Redis Cache:** Monitor list and single monitor responses cached with 30s TTL
- **Cache Invalidation:** Automatic invalidation on create, update, and delete
- **Cache-aside Pattern:** Check Redis first, fall back to MongoDB on miss

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, React Query, Recharts |
| Backend | Node.js, TypeScript, Express.js |
| Queue | BullMQ, Redis |
| Cache | Redis (IORedis) |
| Database | MongoDB (Mongoose) |
| Email | Resend |
| DevOps | Docker, Docker Compose, GitHub Actions |
| Deployment | Vercel, Railway, MongoDB Atlas |

---

## Project Structure
```
apps/
├── api/                      # Node.js TypeScript Service
│   ├── engine/               # Monitoring Engine — Producer
│   ├── queue/                # BullMQ Queue definition and helpers
│   ├── worker/               # BullMQ Worker — Consumer + Dead Letter Queue
│   ├── notifications/        # Email notification service (Resend)
│   ├── config/               # Redis, Cache, DB, Env configuration
│   ├── middleware/           # Auth, Rate Limiting, Error handling
│   ├── modules/              # Domain-driven modules
│   │   ├── auth/             # JWT authentication
│   │   ├── monitors/         # Monitor CRUD + caching
│   │   ├── alerts/           # Alert management
│   │   ├── checkruns/        # Check history + summary stats
│   │   └── dashboard/        # Aggregated dashboard metrics
│   └── __tests__/            # 31 integration tests
└── web/                      # React Dashboard
    ├── ui/                   # Reusable Tailwind Components
    └── hooks/                # Custom React Query hooks
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- Docker Desktop

### 1️⃣ Quick Start with Docker
```bash
# Clone the repo
git clone https://github.com/Aliromia21/monitoring-platform.git
cd monitoring-platform

# Create production env file
cp apps/api/.env.example apps/api/.env.production
# Edit .env.production with your secrets

# Start everything
docker compose up --build
```

This starts MongoDB, Redis, Redis Commander, API, and Worker — all connected and healthy.

### 2️⃣ Development Mode
```bash
# Install root dependencies
npm install

# Terminal 1 — API + Engine
cd apps/api && npm run dev

# Terminal 2 — Worker (optional, for horizontal scaling)
cd apps/api && npm run dev:worker

# Frontend
cd apps/web && npm run dev
```

### Environment Variables
```dotenv
NODE_ENV=development
PORT=3001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
RESEND_API_KEY=your_resend_api_key
SMTP_FROM=Monitoring Platform <onboarding@resend.dev>
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Authenticate user |
| GET | `/monitors` | List all monitors (cached) |
| POST | `/monitors` | Create monitor |
| GET | `/monitors/:id` | Get monitor (cached) |
| PUT | `/monitors/:id` | Update monitor |
| DELETE | `/monitors/:id` | Delete monitor |
| GET | `/monitors/:id/checks` | Check run history |
| GET | `/monitors/:id/summary` | Monitor stats + P95 |
| GET | `/alerts` | List alerts |
| GET | `/dashboard/summary` | Account overview |
| GET | `/queue/stats` | Queue health |
| GET | `/health` | API health check |

---

## Testing & Reliability

The system is built with a test-first mindset.

- **31 integration tests** — all passing on every push
- **Worker Tests:** Dependency injection pattern — no real HTTP requests
- **Queue Tests:** Real Redis integration — tests actual job enqueueing
- **Alert Rule Tests:** Deterministic unit tests for all state machine transitions
- **CI/CD:** GitHub Actions runs full test suite on every push to main
- **Coverage:** Tracked via Codecov on every PR

---

## Author

Ali Romia — Software Engineer

- GitHub: [github.com/Aliromia21](https://github.com/Aliromia21)
- LinkedIn: [linkedin.com/in/aliromia](https://www.linkedin.com/in/aliromia/)

---

## License

MIT License © Ali Romia 2026