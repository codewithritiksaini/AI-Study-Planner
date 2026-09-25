# AI Study Planner 🎓

> **A Production-Ready, Adaptive Academic Study Planning & Smart Recommendation Platform for B.Tech CSE Students**  
> *Combining deterministic constraint-satisfaction scheduling with boundary-isolated Google Gemini AI coaching.*

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-blue.svg?logo=node.js)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/React-v19-61dafb.svg?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF.svg?logo=vite)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791.svg?logo=postgresql)](https://www.postgresql.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20RLS-3ecf8e.svg?logo=supabase)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.5%20Flash%20Lite-orange.svg?logo=google-gemini)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![Theme Mandate](https://img.shields.io/badge/Theme-Strict%20Light%20Only-brightgreen.svg)](#design-mandate)
[![Test Coverage](https://img.shields.io/badge/Test%20Suite-100%25%20Verified-success.svg)](#-automated-testing--verification)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Table of Contents

- [The Problem & Our Solution](#-the-problem--our-solution)
- [System Architecture](#-system-architecture)
- [Core Features & Modules](#-core-features--modules)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Setup Guide](#-step-by-step-setup-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Setup Supabase Project (Database & Auth)](#2-setup-supabase-project-database--auth)
  - [3. Setup Google Gemini API Key](#3-setup-google-gemini-api-key)
  - [4. Environment Variables Configuration](#4-environment-variables-configuration)
  - [5. Install Dependencies](#5-install-dependencies)
  - [6. Run Database Migrations](#6-run-database-migrations)
  - [7. Seed Demo Student Curriculum](#7-seed-demo-student-curriculum-optional)
  - [8. Start Development Servers](#8-start-development-servers)
- [Automated Testing & Verification](#-automated-testing--verification)
- [Project Directory Structure](#-project-directory-structure)
- [Design Mandate](#-design-mandate-strict-light-theme)
- [Interview & Capstone Demo Dashboard](#-interactive-interview-demo-dashboard)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 The Problem & Our Solution

### The Dilemma with Traditional Schedulers
Traditional calendar and study apps create **fragile, static timetables**. When a student inevitably misses a study session, falls behind, or gets stuck on difficult coursework:
- Static schedules break down immediately.
- Whole-calendar reshuffling causes panic, cognitive overload, and plan abandonment.
- General-purpose LLMs hallucinate impossible schedules (e.g., booking 26 hours in a single day, overlapping exams, or ignoring prerequisite course dependencies).

### The AI Study Planner Solution
**AI Study Planner** solves this by operating as a **closed-loop adaptive system**:

```text
Student Velocity & Quizzes ──► Deterministic Math Engine ──► Conflict-Free Timetable
                                      ▲
                                      │ (Read-Only Academic Context)
                             Isolated Gemini AI Coach
                       (Pedagogical Explanations & Advice)
```

1. **Mathematical Determinism for Time & Capacity:** Pure interval subtraction arithmetic ($Free = Availability \setminus (Blocked \cup Locked)$) in Node.js and PostgreSQL guarantees **zero slot overlaps, zero arithmetic hallucinations, and zero capacity violations**.
2. **Boundary-Isolated AI for Qualitative Coaching:** Google Gemini 3.5 Flash Lite operates strictly as an isolated advisory layer with read-only access to academic telemetry and **zero write access to the timetable database**.
3. **Targeted Adaptive Rescheduling:** When a student misses a planned session, the engine finds the nearest open capacity window in future days **without triggering a chaotic, disruptive whole-calendar reshuffle**.
4. **Hardware-Enforced Multi-Tenancy:** Multi-tenant Row Level Security (RLS) policies in PostgreSQL isolate student records at the database level.
5. **Interactive Concept Quizzing:** Syllabus-aligned conceptual MCQs generated via AI in ~2 seconds, graded deterministically on the server with zero answer key leakage.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 Frontend SPA (Vite + CSS)                   │
│   Strict Light Theme • Accessible Modals • Shimmer Skeletons • Recharts│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Bearer JWT (Axios Interceptor)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Hardened Express API Gateway                          │
│   Helmet Headers • Dual Rate Limiters • Centralized Error Taxonomy     │
└─────────────────┬───────────────────────────────────┬──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│    Deterministic Domain Engines   │ │     Isolated AI Advisory Layer   │
│ • Interval Scheduler (Slot Math)  │ │ • Google Gemini 3.5 Flash Lite   │
│ • Adaptive Capacity Engine        │ │ • 15s Request Timeout Race       │
│ • Multi-Factor Priority Scorer    │ │ • Transient Retry Policy         │
│ • Deterministic Quiz Evaluator    │ │ • Strict Zod Schema Validation   │
│ • Academic Analytics & Streaks    │ │ • Safe Fallback Generation       │
└─────────────────┬─────────────────┘ └───────────────────┬──────────────┘
                  │                                       │ Read-Only
                  ▼                                       ▼ Telemetry
┌────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL 15+ (Supabase)                         │
│ • 12 Compound B-Tree Performance Indexes                               │
│ • Multi-Tenant Row Level Security (RLS) on all 16 tables               │
│ • Relational Course DAG (Prerequisites, Topics, Subjects)              │
│ • Deterministic Study Sessions, Plans & Quizzes                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Core Features & Modules

### 📅 1. Mathematical Interval Scheduler
- **Zero-Overlap Guarantee:** Computes schedulable study blocks by subtracting blocked windows and locked sessions from student availability.
- **Adaptive Capacity Budgeting:** Evaluates historical student session velocity (e.g. 50-minute actual average vs 90-minute declared goal) to eliminate burnout.
- **Session Hard-Locks:** Pin critical study sessions to fixed time slots; the automatic recalculation engine preserves locked slots without alteration.
- **Targeted Missed-Session Recovery:** Re-allocates missed sessions into future open slots without disturbing the rest of the student's week.

### 🧠 2. AI Quiz Generator & Assessment Mastery
- **Fast Conceptual Generation:** Generates multi-question syllabus-tailored MCQs via `gemini-3.5-flash-lite` in ~2 seconds.
- **Zero Answer Leakage:** Answer keys and explanations remain strictly on the backend until student finalizes submission.
- **Deterministic Server-Side Scoring:** Instant evaluation calculating points, percentages, correct/incorrect counters, and topic mastery classifications (`STRONG`, `AVERAGE`, `NEEDS_PRACTICE`, `WEAK`).
- **On-Demand AI Tutor Explanations:** Deep conceptual breakdowns of both correct and distractor choices.

### 📊 3. Academic Analytics & Velocity Insights
- **Dual Hour Tracking:** Clearly separates active study days from calendar days for realistic daily averages.
- **Streak & Consistency Math:** Timezone-aware streak counter with yesterday-fallback tolerance.
- **Score Trajectories:** Trend classification (`IMPROVING`, `DECLINING`, `STABLE`) powering interactive Recharts score charts.
- **Automated Insights Engine:** Deterministic rule-based observations highlighting upcoming exam risks, topic velocity, and weak subject concentrations.

### 🎯 4. Smart Action Recommendations
- **Multi-Factor Priority Scoring:** Weighted formula integrating exam proximity, current completion percentage, quiz accuracy, topic difficulty, and DAG prerequisite depth.
- **One-Click Actionability:** Instant actions to "Start Quiz" or "Start Study Session" for the highest-yield tasks.

### 🛡️ 5. Security & Multi-Tenant Isolation
- **Row Level Security (RLS):** Every table enforces strict `auth.uid() = user_id` isolation in PostgreSQL.
- **Production Hardening:** Helmet HTTP security headers, CORS origin whitelisting, IP rate limiting, and sensitive credential redacting logger.

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, Recharts | Fast, modern Single-Page Application (SPA) |
| **Backend** | Node.js (v20+), Express.js | High-throughput REST API & deterministic engines |
| **Database** | PostgreSQL 15+ (Hosted on Supabase) | Relational storage, RLS policies, 12 compound indexes |
| **Authentication** | Supabase Auth (GoTrue) + Stateless JWT | Secure user sign-up, sign-in, and session management |
| **AI Layer** | `@google/genai` (Google Gemini 3.5 Flash Lite) | Qualitative study coaching, quiz questions, explanations |
| **Validation** | Zod | Runtime schema validation for API inputs and AI payloads |
| **Testing** | Node.js native test runner & assertion modules | Comprehensive verification suites with zero external mocks |

---

## 📋 Prerequisites

Before setting up the project locally, ensure you have:
1. **Node.js**: `v20.x` or higher installed ([Download Node.js](https://nodejs.org)).
2. **Git**: Installed on your system ([Download Git](https://git-scm.com)).
3. **Supabase Account**: A free account on [supabase.com](https://supabase.com).
4. **Google AI Studio Account**: A free account to get a Gemini API Key on [aistudio.google.com](https://aistudio.google.com).

---

## 🛠️ Step-by-Step Setup Guide

### 1. Clone Repository

```bash
git clone https://github.com/your-username/ai-study-planner.git
cd ai-study-planner
```

---

### 2. Setup Supabase Project (Database & Auth)

1. Log in to [Supabase](https://supabase.com) and click **"New Project"**.
2. Set your **Project Name** (e.g. `ai-study-planner`), choose a strong database password, and pick the closest region.
3. Once your project is provisioned, gather your project credentials:
   - Go to **Project Settings** (gear icon) ──► **API**.
   - Note the **Project URL** (`https://<project-ref>.supabase.co`).
   - Note the **`anon` `public` Key**.
   - Note the **`service_role` `secret` Key** (keep this secret!).
   - Go to **Project Settings** ──► **Database** ──► **Connection string** ──► **URI**.
   - Copy the URI and replace `[YOUR-PASSWORD]` with your database password (e.g. `postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres`).

---

### 3. Setup Google Gemini API Key

1. Navigate to [Google AI Studio](https://aistudio.google.com).
2. Sign in with your Google account.
3. Click the **"Get API key"** button on the left navigation panel.
4. Click **"Create API key"** and choose or create a Google Cloud project.
5. Copy the generated API key (it begins with `AIza...`).

> **💡 Recommended Model:** The project is configured with `gemini-3.5-flash-lite` by default. It generates complete conceptual quizzes and explanations in **~1.5 to 2.0 seconds** on the free tier!

---

### 4. Environment Variables Configuration

The project consists of two environments: `server` and `client`.

#### A. Backend Configuration (`server/.env`)
Create `server/.env` by copying the example:

```bash
cp server/.env.example server/.env
```

Fill in your credentials in `server/.env`:

```env
# Server Port & Runtime Environment
PORT=5000
NODE_ENV=development

# Allowed CORS Origin (Frontend SPA URL)
CLIENT_URL=http://localhost:5173

# Supabase Platform Credentials (From Step 2)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
DATABASE_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres

# Google Gemini API Key & Model (From Step 3)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

#### B. Frontend Configuration (`client/.env`)
Create `client/.env` by copying the example:

```bash
cp client/.env.example client/.env
```

Fill in the public values in `client/.env`:

```env
# Backend REST API Base URL
VITE_API_URL=http://localhost:5000/api

# Supabase Platform Public Credentials (From Step 2)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
```

> **⚠️ Security Note:** Never put your `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` into `client/.env`. The client bundle only exposes `VITE_` variables to the browser.

---

### 5. Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to root directory
cd ..
```

---

### 6. Run Database Migrations

Deploy all relational tables, constraints, compound indexes, and Row Level Security (RLS) policies:

```bash
cd server
npm run migrate
```

This script connects directly via `DATABASE_URL` and executes all migrations in `supabase/migrations/` sequentially:
- `01_base_schema.sql`: Core tables (`profiles`, `subjects`, `topics`, `study_plans`, `study_sessions`).
- `02_quiz_schema.sql`: Assessment tables (`quizzes`, `quiz_questions`, `quiz_attempts`, `topic_performance`).
- `03_recommendations_schema.sql`: Recommendations & feedback tracking tables.
- `04_scheduler_schema.sql`: Availability windows, blocked periods, prerequisite DAG, plan generations.
- `05_compound_indexes.sql`: 12 high-performance compound B-Tree indexes.

---

### 7. Seed Demo Student Curriculum (Optional)

To immediately test the application with a realistic B.Tech CSE student profile (Data Structures, Operating Systems, Computer Networks, DBMS with syllabus topics, prerequisites, and past study logs):

```bash
cd server
npm run seed:demo
```

**Seeded Credentials:**
- **Email:** `student@gmail.com`
- **Password:** `Student@123`

*(You can also sign up with any new account through the UI register page).*

---

### 8. Start Development Servers

Open two terminal windows:

#### Terminal 1: Backend Server (Port 5000)
```bash
cd server
npm run dev
```

#### Terminal 2: Frontend Client (Port 5173)
```bash
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**! 🎉

---

## 🧪 Automated Testing & Verification

The project includes automated verification test suites covering security, mathematical schedulers, AI fallbacks, and database query performance.

Run test suites from the `server/` directory:

```bash
cd server

# 1. Multi-Tenant Row Level Security (RLS) Isolation
npm run test:rls

# 2. Rule-Based Planner & Capacity Constraints
npm run test:planner

# 3. Quiz Generation, Anti-Leakage & Server Scoring
npm run test:quiz

# 4. Adaptive Timetable & Workload Budgeting
npm run test:adaptive

# 5. Analytics Engine, Streaks & Metric Calculations
npm run test:analytics

# 6. Recommendation Candidate Generation & Priority Scoring
npm run test:rec

# 7. Slot Arithmetic & Conflict-Free Scheduling Horizon
npm run test:sched

# 8. Production Security, Helmet Headers & Health Probes
npm run test:prod:security

# 9. 12 Compound Indexes & Query Execution Plans
npm run test:db:opt

# 10. AI Prompt Sanitization & Resilience Fallbacks
npm run test:ai:safety
```

### Production Client Build Check
```bash
cd client
npm run build
```
*Builds production Vite bundle cleanly with zero warnings or errors.*

---

## 📁 Project Directory Structure

```text
ai-study-planner/
├── client/                               # Frontend React 19 Application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                   # Reusable UI (Button, Card, Badge, Modal, Toast)
│   │   │   ├── layout/                   # Sidebar, AppLayout, Navbar
│   │   │   ├── quiz/                     # QuizTakingCard, QuizLoadingCard, QuizResultCard
│   │   │   ├── study/                    # Focus stopwatch, session logger
│   │   │   ├── planner/                  # Timetable grid, weekly scheduler, day view
│   │   │   ├── analytics/                # Recharts charts, metric cards, insights panel
│   │   │   └── recommendations/          # Prioritized smart action cards
│   │   ├── pages/                        # Dashboard, Quiz, Timetable, Analytics, AIAssistant
│   │   ├── services/                     # Axios API clients (auth, quizzes, subjects, planner)
│   │   └── index.css                     # Tailwind CSS v4 styling & animations
│   └── package.json
│
├── server/                               # Backend Node.js & Express Application
│   ├── src/
│   │   ├── ai/prompts/                   # Boundary-enforced Gemini prompt templates
│   │   ├── config/                       # db.js, env.validator.js, ai.config.js
│   │   ├── controllers/                  # Express route controllers
│   │   ├── middleware/                   # JWT auth, rate limiting, error handler
│   │   ├── routes/                       # Express router definitions
│   │   ├── scripts/                      # Automated test suites, demo seeder, migrations
│   │   ├── services/
│   │   │   ├── ai/                       # gemini-client.js (15s timeout, transient retries)
│   │   │   ├── analytics/                # Statistical metrics & insight rules
│   │   │   ├── planner/                  # Interval subtraction scheduler & capacity math
│   │   │   ├── recommendations/          # Multi-factor candidate generator & ranking
│   │   │   └── quiz/                     # Deterministic evaluation & answer key encryption
│   │   └── server.js                     # Express app entrypoint & graceful shutdown
│   └── package.json
│
├── supabase/
│   └── migrations/                       # Sequential SQL migration files
├── docs/                                 # Architectural blueprints & API specifications
└── README.md                             # You are here!
```

---

## 🎨 Design Mandate: Strict Light Theme

The application adheres to a **Strict Light Theme Mandate**:
- **Backgrounds:** `bg-slate-50` and `bg-white` exclusively.
- **Surfaces & Cards:** `bg-white` with crisp `border-slate-200` borders and subtle elevation.
- **Typography:** High-contrast neutral slates (`text-slate-900`, `text-slate-700`, `text-slate-500`).
- **Accent Elements:** Accessible, vibrant accents (`indigo-600`, `emerald-600`, `violet-600`).
- **Dark Mode:** Strictly prohibited by design guidelines for maximum academic focus and daylight legibility.

---

## 🎯 Interactive Interview Demo Dashboard

The repository includes a dedicated interactive presentation console accessible at:

```text
http://localhost:5173/interview-demo
```

### What it Demonstrates:
1. **Live System Health:** Real-time database pool ping latency and gateway uptime.
2. **Architecture Blueprint:** Visual breakdown explaining why deterministic Node.js handles schedules and Gemini handles advisory coaching.
3. **Live 6-Step Simulation Workbench:**
   - *Step 1:* Ingest & inspect Phase 10 Smart Recommendations.
   - *Step 2:* Calculate non-destructive 7-day schedule preview.
   - *Step 3:* Persist previewed slots to active timetable.
   - *Step 4:* Simulate missed session & observe targeted adaptive rescheduling.
   - *Step 5:* Toggle session hard locks (tamper protection).
   - *Step 6:* Query isolated Gemini AI coaching.
4. **Live API Telemetry Stream:** Real-time HTTP request log with interactive JSON payload inspector.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👏 Acknowledgments

- [Google DeepMind Gemini API](https://ai.google.dev/) for qualitative pedagogical intelligence.
- [Supabase](https://supabase.com/) for PostgreSQL hosting, Auth, and Row Level Security.
- [Lucide Icons](https://lucide.dev/) for crisp, clean UI icons.
- [Tailwind CSS](https://tailwindcss.com/) for modern styling.
