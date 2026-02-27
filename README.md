# 🚀 Monitoring Platform (SaaS)

> A high-performance, production-grade monitoring engine for HTTP services. Inspired by industry leaders like **Datadog** and **UptimeRobot**.

[Live Demo](https://monitoring-v2.vercel.app) | [Backend API](https://monitoring-platform-production.up.railway.app/health)

---

![Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

| Service | Status |
|--------|--------|
| API CI | ![API Tests](https://github.com/Aliromia21/monitoring-platform/actions/workflows/api-ci.yml/badge.svg) |
| Coverage | [![codecov](https://codecov.io/gh/Aliromia21/monitoring-platform/branch/main/graph/badge.svg?token=b313f617-c805-46be-b3ee-7455221a7183)](https://codecov.io/gh/Aliromia21/monitoring-platform) |

---

## Why this project exists:
This repo simulates a lean version of real-world monitoring platforms. 
The goal is to demonstrate distributed design, incident detection, 
and observability concepts end to end.

---

## System Architecture & Deployment

This project is a modern **Monorepo** designed for scalability and high availability. It is currently deployed across a multi-cloud environment:

* **Frontend:** Hosted on **Vercel** (Global Edge Network).
* **Backend:** Containerized API and Background Engine running on **Railway**.
* **Database:** Managed **MongoDB Atlas** Cluster (Time-series optimization).



---

## Features

### Core Infrastructure
- **Secure Auth:** JWT-based authentication with stateless session management.
- **Strict Multi-tenancy:** Ownership enforcement at the database level to prevent data leakage.
- **Health Check Engine:** A decoupled, non-blocking background worker that executes periodic HTTP probes.

### Observability & Metrics
- **Performance Tracking:** Real-time response time (Latency) and availability metrics.
- **Historical Analysis:** Time-series check-run storage for long-term reliability reporting.
- **Visual Analytics:** Interactive latency and uptime charts using **Recharts**.

### Smart Alerting Logic
- **Consecutive Failure Thresholds:** Intelligent DOWN alerts to avoid false positives.
- **State Machine Alerting:** - `DOWN` alert triggered only after $N$ consecutive failures.
  - `RECOVERY` alert triggered only if a previous `DOWN` state was active.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Query, Recharts |
| **Backend** | Node.js, TypeScript, Express.js |
| **Database** | MongoDB (Mongoose) |
| **DevOps** | Docker, Docker Compose, GitHub Actions (CI/CD) |
| **Deployment** | Vercel, Railway, MongoDB Atlas |

---

## 📂 Project Structure

```text
apps/
├── api/             # Node.js TypeScript Service
│   ├── engine/      # Heart of the platform: The Monitoring Worker
│   ├── modules/     # Domain-driven modules (Auth, Monitors, Alerts)
│   └── tests/       # 94% Coverage Integration Tests
└── web/             # React Dashboard
    ├── ui/          # Reusable Tailwind Components
    └── hooks/       # Custom React Query hooks for data fetching


```

## Getting Started

### Prerequisites
Node.js ≥ 20
Docker Desktop

---

### 1️⃣ Rapid Start with Docker

From the repository root:

```bash
docker compose up --build
```
### 2️⃣ Development Mode (Monorepo))
```
# Install root dependencies
npm install

# Run Backend
cd apps/api && npm run dev

# Run Frontend
cd apps/web && npm run dev
```

## Testing & Reliability

The system is built with a Test-First mindset. The API layer maintains ~94% line coverage.

Integration Tests: Using Jest and In-memory MongoDB.

Rule Engine: Alerting logic is unit-tested with deterministic failure scenarios.

CI/CD: Automated testing pipelines via GitHub Actions.

---

## Author

Ali Romia - Software Engineer

- GitHub: https://github.com/Aliromia21 
- LinkedIn: https://www.linkedin.com/in/aliromia/

## License :

MIT License © Ali Romia 2026




