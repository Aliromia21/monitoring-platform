# Monitoring Platform (SaaS)

Production-style monitoring platform for HTTP services, inspired by systems like Datadog and UptimeRobot.

The project focuses on observability, reliability, background processing, and testability, and is designed to demonstrate real-world backend and platform engineering skills.

---

##  Features

### Core
- User authentication (JWT)
- Monitor CRUD (HTTP endpoints)
- Ownership & authorization enforcement

### Monitoring Engine
- Background scheduler
- Periodic HTTP checks
- Response time & availability tracking
- Time-series metrics storage

### Alerting
- DOWN alerts after consecutive failures
- RECOVERY alerts on service restoration
- Guaranteed:
  - No duplicate DOWN alerts
  - RECOVERY only after confirmed DOWN

### APIs
- Monitors list & details
- Check history (`/monitors/:id/checks`)
- Alerts (`/alerts`)
- Monitor summary (`/monitors/:id/summary`)

### Testing
- Unit tests for alerting rules
- Integration tests for APIs
- In-memory database for deterministic tests

---

## Architecture Overview

  apps/api
  
  ├── src
  
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
  


- **API Server**: Node.js + Express
- **Database**: MongoDB (time-series style collections)
- **Background Workers**: In-process scheduler with concurrency control

---

## Tech Stack

**Backend**
- Node.js + TypeScript
- Express
- MongoDB + Mongoose
- JWT Authentication

**Testing**
- Jest
- Supertest

**Infrastructure**
- Docker (MongoDB)
- GitHub (CI-ready)

---

## 🚀 Getting Started

### 1️⃣ Prerequisites
- Node.js ≥ 18
- Docker

---

### 2️⃣ Start MongoDB
```bash
docker run -d --name monitoring-mongo -p 27017:27017 mongo:6
```

### 3️⃣ Setup environment
Create .env inside apps/api:
```bash
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/monitoring_platform_dev
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*

```

### 4️⃣ Install dependencies & run:
```bash
cd apps/api
npm install
npm run dev
```
API will be available at:
```bash
http://localhost:4000
```
### 5️⃣ Run tests
```bash
npm test
```

## Example APIs :
Create Monitor : 
POST /monitors
```bash
Authorization: Bearer <token>
```
Monitor Checks History
```bash
GET /monitors/:id/checks
```
Alerts
GET /alerts

Monitor Summary
```bash
GET /monitors/:id/summary?windowHours=24
```

## Design Decisions

- Alerting logic extracted into pure functions for testability

- Background engine decoupled from request lifecycle

- Ownership enforced at query level (no data leaks)

- Deterministic tests (no reliance on timers or schedulers)

## Roadmap

- Frontend dashboard (React)

- Real-time updates (WebSockets)

- Alert delivery channels (email, webhooks)

- Docker Compose (API + Mongo)

