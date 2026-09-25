# AI Study Planner — Local Setup & Verification Guide

> **Phase 12 Production Setup Documentation**  
> *Everything required to install, configure, seed, run, and verify the AI Study Planner platform from scratch.*

---

## 1. Prerequisites

Ensure your development environment meets the following specifications:
- **Node.js:** v20.x or higher (`node -v`)
- **Package Manager:** npm v10.x or higher (`npm -v`)
- **Database:** Supabase project or local PostgreSQL 15+ instance with `pgcrypto` / `uuid-ossp`
- **Google Gemini API Key:** An active key for Gemini 2.5 Flash

---

## 2. Environment Configuration

### 2.1 Server Environment (`server/.env`)
Create or verify `server/.env`:
```env
PORT=5000
NODE_ENV=development

# PostgreSQL Connection
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Supabase Admin & Auth
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret for Session Verification
JWT_SECRET=your-secure-jwt-secret-string-here

# Google Gemini API
GEMINI_API_KEY=AIzaSy...
```

### 2.2 Client Environment (`client/.env`)
Create or verify `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Database Migration

The relational database schemas, foreign keys, RLS policies, and compound performance indexes are located in `supabase/migrations/`.

To apply all migrations using the Supabase CLI:
```bash
supabase db push
```

Or apply directly via `psql`:
```bash
psql $DATABASE_URL -f supabase/migrations/20260925000008_optimize_indexes_phase12.sql
```

---

## 4. Realistic Demo Data Seeding

We provide a deterministic seed script that populates realistic B.Tech Computer Science student data:

```bash
cd server
npm run seed:demo
```

### Seeded Student Persona:
- **Email:** `student@gmail.com`
- **Password:** `Student@123`
- **UUID:** `c969e36f-5861-4909-aabb-892d7f049cd6`
- **Curriculum:** 4 Core Subjects (*Operating Systems*, *DBMS*, *Computer Networks*, *Data Structures & Algorithms*).
- **Workload:** 16 Topics with varying mastery ($25\%$ to $92\%$), difficulties, and DAG prerequisites.
- **Calendar:** Full Mon–Sun availability windows, 3 blackout periods, active Phase 10 recommendations, and 7-day study plans.

---

## 5. Running the Application

### 5.1 Start Backend Server
```bash
cd server
npm run dev
# Server listens on http://localhost:5000
# Liveness probe: http://localhost:5000/health
# Readiness probe: http://localhost:5000/health/ready
```

### 5.2 Start Frontend Client
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

Navigate to `http://localhost:5173/login`, sign in with `student@gmail.com` / `Student@123`, and explore the dashboard or head directly to the **Interview Presentation Dashboard** at `http://localhost:5173/interview-demo`.

---

## 6. Production Verification Suite

The repository includes automated test suites covering security, database indexing, AI safety, deterministic scheduling, and the complete user lifecycle:

```bash
cd server

# 1. API Security, Rate Limiting & Health Probes (Phase 12 Task 1)
npm run test:prod:security

# 2. Database Compound Indexing & Multi-Tenant IDOR Isolation (Phase 12 Task 2)
npm run test:db:opt

# 3. AI Safety, Abort Timeouts & Fallback Resilience (Phase 12 Task 3)
npm run test:ai:safety

# 4. Deterministic Scheduling Interval Arithmetic (Phase 11)
npm run test:sched

# 5. Full End-to-End User Lifecycle Integration Test (Phase 12 Task 5)
npm run test:e2e:journey
```

### Frontend Production Build Test:
```bash
cd client
npm run build
# Compiles Vite production bundle into client/dist/ with zero errors
```
