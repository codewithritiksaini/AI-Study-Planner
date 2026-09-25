# AI Study Planner 🎓

> **A Production-Ready, Adaptive Academic Study Planning & Smart Recommendation Platform for B.Tech CSE Students**  
> *Combining deterministic constraint-satisfaction scheduling with boundary-isolated AI coaching.*

[![Node.js Version](https://img.shields.io/badge/node-v20%2B-blue.svg)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/react-v19-61dafb.svg)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791.svg)](https://www.postgresql.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20RLS-3ecf8e.svg)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Gemini%202.5-Flash-orange.svg)](https://ai.google.dev)
[![Theme Mandate](https://img.shields.io/badge/Theme-Strict%20Light%20Only-brightgreen.svg)]()
[![Build Status](https://img.shields.io/badge/Phase%2012-Production%20Verified%20100%25-success.svg)]()

---

## 📌 The Problem & Our Solution

Traditional calendar applications create **fragile, static timetables**. When a student inevitably misses a study session or gets stuck on a difficult topic, static schedules break down, leading to guilt, cognitive overload, and plan abandonment.

**AI Study Planner** solves this by operating as a **closed-loop adaptive system**:
1. **Mathematical Determinism for Time & Capacity:** Pure interval subtraction arithmetic ($Free = Availability \setminus (Blocked \cup Locked)$) in Node.js and PostgreSQL guarantees **zero slot overlaps, zero arithmetic hallucinations, and zero capacity violations**.
2. **Boundary-Isolated AI for Qualitative Coaching:** Google Gemini 2.5 Flash operates strictly as an isolated advisory layer with read-only access to academic telemetry and **zero write access to the timetable database**.
3. **Targeted Adaptive Rescheduling:** When a student misses a planned session, the engine finds the nearest open capacity window in future days **without triggering a chaotic, disruptive whole-calendar reshuffle**.
4. **Hardware-Enforced Multi-Tenancy:** Multi-tenant Row Level Security (RLS) policies in PostgreSQL isolate student records at the database level.
5. **Strict Light Theme Design System:** Built exclusively with a modern, high-contrast light theme palette (`bg-slate-50`, `bg-white`, `border-slate-200`, `text-slate-900`) adhering to WCAG 2.1 AA accessibility standards.

---

## 🏗️ High-Level System Architecture

```text
React 19 Frontend (Strict Light Theme + Accessible Modals + Shimmer Skeletons)
    ↓ (Bearer JWT via Axios Interceptor)
Hardened API Gateway (Helmet + Express Rate Limiters + Centralized JSON Logger)
    ↓
Deterministic Domain Engines (Node.js & Express)
    ├── Academic Analytics Engine (Mastery Index, Velocity, Streak Tracking)
    ├── Phase 10 Recommendation Engine (Multi-Factor Scoring: Urgency + Weakness + DAG Depth)
    └── Phase 11 Interval Scheduler (Interval Subtraction Arithmetic: Avail \ (Blocked ∪ Locked))
    ↓                                  ↓
PostgreSQL 15 (Supabase)          Isolated AI Advisory Layer
  - 12 Compound B-Tree Indexes      - Google Gemini 2.5 Flash
  - Row Level Security (RLS)        - 15s AbortController Timeout
  - Relational Curriculum DAG       - Exponential Backoff Transient Retries
                                    - Zod Output Validation & Heuristic Fallback
```

---

## 🚀 Key Features by Phase

- **Phases 0–4: Foundational Core & Multi-Tenant Data**
  - Supabase Auth integration, JWT verification, and student profile management.
  - Relational schema for subjects, syllabus topics, and Directed Acyclic Graph (DAG) prerequisites.
- **Phases 5–7: Smart Availability & Study Focus**
  - Interactive Focus Mode stopwatch with active recall logging and difficulty feedback.
  - Student availability windows and custom blackout periods (extracurriculars, hackathons).
- **Phases 8–9: Adaptive Recalibration & Analytics**
  - Academic telemetry tracking student velocity, topic mastery percentages, and streak counts.
- **Phase 10: Personalized Recommendations & Smart Actions**
  - Heuristic scoring formula ranking weak topics based on exam countdowns, DAG depth, and quiz scores.
  - Actionable recommendation cards with one-click study session creation.
- **Phase 11: Intelligent Scheduling Horizon Engine**
  - Mathematical interval subtraction arithmetic eliminating all schedule overlaps.
  - Non-destructive 7-day schedule preview (`/api/planner/preview`) before persistent commit.
  - User-controlled session locks preventing automated relocation of fixed study blocks.
  - Targeted non-cascading rescheduling for missed study sessions.
- **Phase 12: Production Readiness, Security & Interview Demo**
  - API Gateway hardening: Helmet security headers, dual rate limiting, and structured `AppError` taxonomy.
  - Database optimization: 12 compound B-tree performance indexes and EXPLAIN query plan verification.
  - AI Safety: 15-second AbortController timeouts, transient retry engine, and deterministic fallbacks.
  - UX Polish: Global Toast notifications, reusable shimmering skeleton loaders, and keyboard accessibility.
  - Realistic Seed Data: Deterministic B.Tech CSE student persona generator (`student@gmail.com`).
  - Interactive Capstone Dashboard (`/interview-demo`): Live 6-step simulation workbench and real-time HTTP payload auditing console.

---

## 💻 Tech Stack

| Layer | Technology | Key Responsibility |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons | Responsive SPA, interactive weekly timetable, strict light UI |
| **Backend** | Node.js (v20+), Express.js | REST API, deterministic scheduling arithmetic, rate limiting |
| **Database** | PostgreSQL 15+ (Supabase) | Multi-tenant RLS, 12 compound B-tree indexes, relational DAG |
| **Authentication** | Supabase Auth + JWT | Stateless Bearer token verification, multi-tenant context |
| **Artificial Intelligence** | Google Gemini 2.5 Flash | Qualitative advisory, topic study guides, deterministic fallback |
| **Validation & Logging** | Zod, Winston-style JSON Logger | Strict environment and schema validation, credential masking |

---

## 🛠️ Quick Start & Local Setup

### 1. Prerequisites
- Node.js v20+ and npm v10+
- Active Supabase project or local PostgreSQL instance
- Google Gemini API key

### 2. Configure Environment Variables
Copy and configure the environment files:
```bash
# Server Environment
cp server/.env.example server/.env

# Client Environment
cp client/.env.example client/.env
```

### 3. Run Database Migrations
Deploy the schema, RLS policies, and Phase 12 compound indexes:
```bash
supabase db push
```

### 4. Seed Deterministic Demo Data
Populate realistic B.Tech CSE student data (4 subjects, 16 topics with DAG prerequisites, study history, recommendations):
```bash
cd server
npm run seed:demo
```
*Seeded Student Account:* `student@gmail.com` / `Student@123`

### 5. Launch Development Servers
```bash
# Terminal 1: Backend Server (Port 5000)
cd server && npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client && npm run dev
```

Visit `http://localhost:5173` to explore the app!

---

## 🧪 Production Verification Test Suites

Execute all automated verification suites in `server/`:

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

### Client Production Compilation:
```bash
cd client
npm run build
# Compiles Vite production bundle cleanly with zero warnings or errors
```

---

## 🎯 Interactive Interview Presentation Dashboard

Access the dedicated capstone presentation console at `http://localhost:5173/interview-demo` (or click **Interview Demo** in the sidebar):

1. **System Health Probes:** Real-time database pool latency and gateway uptime.
2. **Architecture Blueprint:** Layered visualization explaining why deterministic Node.js handles schedules and Gemini handles advisory coaching.
3. **Live 6-Step Simulation Workbench:**
   - *Step 1:* Ingest & inspect Phase 10 AI Recommendations.
   - *Step 2:* Calculate non-destructive 7-day schedule preview.
   - *Step 3:* Persist previewed slots to active timetable.
   - *Step 4:* Simulate missed session & observe targeted adaptive rescheduling.
   - *Step 5:* Toggle session hard locks (tamper protection).
   - *Step 6:* Query isolated Gemini AI coaching.
4. **Live API Telemetry & Audit Stream:** Real-time stream of HTTP requests with an interactive JSON response payload inspector.

---

## 📚 Complete Documentation Suite

Detailed technical guides are available in the [docs/](file:///home/ritiksaini/Desktop/localhost/own/ai-study-planner/docs) directory:
- [System Architecture Blueprint](file:///home/ritiksaini/Desktop/localhost/own/ai-study-planner/docs/ARCHITECTURE.md)
- [REST API Specification](file:///home/ritiksaini/Desktop/localhost/own/ai-study-planner/docs/API.md)
- [Database Schema & Indexes](file:///home/ritiksaini/Desktop/localhost/own/ai-study-planner/docs/DATABASE.md)
- [AI Integration & Safety](file:///home/ritiksaini/Desktop/localhost/own/ai-study-planner/docs/AI.md)
- [Mathematical Scheduler & Rescheduler](file:///home/ritiksaini/Desktop/localhost/own/ai-study-planner/docs/SCHEDULER.md)
- [Developer Setup & Testing Guide](file:///home/ritiksaini/Desktop/localhost/own/ai-study-planner/docs/SETUP.md)

---

## 📄 License
This project is licensed under the MIT License.
