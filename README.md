# Monitoring Platform (SaaS)

Production-style monitoring platform for HTTP services, inspired by systems like **Datadog**, **New Relic**, and **UptimeRobot**.

This project demonstrates how to design and implement a **real-world monitoring system** with background workers, alerting semantics, historical metrics, and a modern dashboard — focusing on **observability, reliability, and testability**.

![Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

| Service | Status |
|--------|--------|
| API CI | ![API Tests](https://github.com/Aliromia21/monitoring-platform/actions/workflows/api-ci.yml/badge.svg) |
| Coverage | [![codecov](https://codecov.io/gh/Aliromia21/monitoring-platform/branch/main/graph/badge.svg?token=b313f617-c805-46be-b3ee-7455221a7183)](https://codecov.io/gh/Aliromia21/monitoring-platform) |



## Why this project exists:
This repo simulates a lean version of real-world monitoring platforms. 
The goal is to demonstrate distributed design, incident detection, 
and observability concepts end to end.


---

## Features

### Core
- JWT-based authentication
- Monitor CRUD with strict ownership enforcement
- Secure, multi-user architecture

### Monitoring Engine
- Background scheduler (async, non-blocking)
- Periodic HTTP health checks
- Response time & availability tracking
- Time-series check run storage

### Alerting
- DOWN alerts after consecutive failures
- RECOVERY alerts only after confirmed DOWN
- Guaranteed semantics:
  - No duplicate DOWN alerts
  - RECOVERY only after an actual outage

### APIs
- Monitors list & details
- Check history  
  `GET /monitors/:id/checks`
- Alerts  
  `GET /alerts`
- Summary statistics  
  `GET /monitors/:id/summary?windowHours=24`

### Dashboard (Frontend)
- Authentication flow (login / register)
- Protected routes
- Monitors overview
- Monitor details:
  - Uptime summary
  - Latency & availability charts
  - Check history table
- Alerts page with polling and filtering

---

## Architecture Overview

apps/

├── api

│ ├── modules

│ │ ├── auth

│ │ ├── monitors

│ │ ├── checkruns

│ │ └── alerts

│ ├── engine

│ │ ├── monitoringEngine.ts

│ │ ├── httpCheck.ts

│ │ └── alertRules.ts

│ ├── middleware

│ └── config

│
└── web

├── pages

├── ui

└── api


-----

## Tech Stack

**Backend**
- Node.js + TypeScript
- Express
- MongoDB (time-series style collections)
- Background monitoring engine (in-process workers)

**Frontend**
- React + Vite
- Tailwind CSS
- React Query
- Recharts

**Infrastructure**
- Docker & Docker Compose
- MongoDB container
- CI-ready setup

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- Docker Desktop (or Docker Engine)

---

### 1️⃣ Run Backend (API + MongoDB)

From the repository root:

```bash
docker compose up --build
```
Backend API:
```
http://localhost:4000
```
Health check:
```
GET http://localhost:4000/health
```

### 2️⃣ Run Frontend (Dashboard)
In a new terminal:
```
cd apps/web
npm install
npm run dev
```
Frontend 
```
http://localhost:5173
```

---

## Example Test Monitors

Useful endpoints to demonstrate alerting and recovery:

stable uptime	https://www.google.com

Real API	https://api.github.com

Status failure	https://httpstat.us/500

Timeout	https://httpstat.us/200?sleep=10000

Guaranteed DOWN	http://127.0.0.1:1

---

## Design Decisions

Alerting logic extracted into pure functions for deterministic testing

Monitoring engine decoupled from request lifecycle

Ownership enforced at query level (no cross-user data leakage)

Time-series data modeled explicitly (check runs)

Dockerized backend for reproducible execution

---

## Testing Strategy

Unit tests for alerting rules

Integration tests for API endpoints

In-memory MongoDB for deterministic tests

Frontend tested via component & query-level testing

## Testing & Coverage

The backend API is covered by Jest integration tests (supertest + in-memory MongoDB).

Currently, the **API layer** has ~94% line coverage.  
For practicality, the coverage report explicitly **excludes**:

- `src/engine/` – the long-running monitoring engine
- `src/config/` – environment/config wiring

These folders are more infrastructure/long-running process code and would require a different testing strategy .
For this project, the focus is on:

- HTTP endpoints behavior (auth, monitors, alerts, check runs)
- Validation and error handling
- Ownership/authorization rules


## License :

MIT License © Ali Romia

## Author

Ali Romia

Software Engineer  

- GitHub: https://github.com/Aliromia21 
- LinkedIn: https://www.linkedin.com/in/aliromia/





