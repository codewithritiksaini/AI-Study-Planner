# AI Study Planner 🎓

> **An AI-Powered Adaptive Study Planning Web Application for B.Tech CSE Students**

---

## 📌 Project Overview

Traditional study planners and calendar applications create static, rigid timetables. When a student inevitably misses a study session or encounters a conceptually difficult topic, static schedules break down, leading to frustration and plan abandonment.

**AI Study Planner** solves this by operating as an **intelligent, closed-loop adaptive system**:
* **Deterministic Engine (Node.js & PostgreSQL):** Governs time tracking, session stopwatches, daily study hour capacity constraints ($H_{daily}$), objective quiz scoring, and multi-factor mathematical priority calculations.
* **Artificial Intelligence Layer (Google Gemini API):** Operates strictly server-side for natural language study-log parsing, dynamic conceptual quiz generation, contextual topic tutoring, and weekly academic mentor summaries.
* **Adaptive Replanning:** Rather than leaving missed or incomplete tasks behind, the system dynamically reacts to real study behavior (missed sessions, partial study duration, low quiz scores) and automatically recalibrates upcoming schedules.

---

## 🚀 Technology Stack

| Layer | Technology | Key Architectural Responsibility |
|---|---|---|
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons | Responsive SPA, Focus Mode stopwatch, interactive calendar views |
| **Backend** | Node.js (v20+), Express.js (REST Architecture) | Layered architecture (Controllers, Domain Services, Middlewares) |
| **Database & Auth** | Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security) | Relational integrity, hardware-enforced RLS multi-tenancy, JWT verification |
| **Artificial Intelligence** | Google Gemini API (`gemini-1.5-flash` via official SDK) | Isolated server-side advisory service, structured JSON outputs |

---

## 📂 Project Structure

```text
ai-study-planner/
├── client/                     # React 18 + Vite SPA Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI & Layout components
│   │   ├── layouts/            # AppLayout (Sidebar, Header, Main Content)
│   │   ├── pages/              # Route views (Dashboard, Planner, Study, etc.)
│   │   ├── services/           # Axios API client & Supabase client foundations
│   │   └── App.jsx             # React Router configuration
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express REST API Backend
│   ├── src/
│   │   ├── config/             # Zod environment validator & Supabase admin client
│   │   ├── middleware/         # Logger, CORS, Error handling, 404 handler
│   │   ├── routes/             # API v1 routes (/api/health, etc.)
│   │   ├── app.js              # Express app initialization
│   │   └── server.js           # Server startup & port listener
│   ├── .env.example
│   └── package.json
│
├── docs/                       # Architectural Blueprints & System Design
│   └── PHASE_0_ARCHITECTURE_BLUEPRINT.md # Single Source of Truth
├── .gitignore
├── README.md
└── package.json                # Root developer orchestration scripts
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
* **Node.js:** v20.x or higher LTS installed (`node -v`)
* **npm:** v10.x or higher (`npm -v`)

### 2. Installation
Clone the repository and install all dependencies:
```bash
# Clone the repository
git clone <repo-url>
cd ai-study-planner

# Install root dependencies
npm install

# Install client and server dependencies
npm run install:all
```

### 3. Environment Variables Configuration
Create `.env` files for both client and server based on their provided templates:

#### Client Setup:
```bash
cp client/.env.example client/.env
```
Populate `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Server Setup:
```bash
cp server/.env.example server/.env
```
Populate `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

> **Security Note:** Never commit `.env` files or secrets to source control. Client builds only receive `VITE_` public variables. `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are strictly server-side.

### 4. Supabase Setup & Database Migrations

1. **Create Supabase Project:**
   - Go to [Supabase](https://supabase.com) and create a new project.
   - Note your Project URL and database password.
2. **Retrieve API Keys:**
   - Go to **Project Settings ➔ API**.
   - Copy `Project URL` to `SUPABASE_URL` and `VITE_SUPABASE_URL`.
   - Copy `anon / public` key to `VITE_SUPABASE_ANON_KEY` and `server/.env`.
   - Copy `service_role / secret` key to `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`.
3. **Database Connection String:**
   - Under **Project Settings ➔ Database ➔ Connection parameters**, copy the URI.
   - Percent-encode any special characters in the password.
   - Set as `DATABASE_URL` in `server/.env`.
4. **Execute Database Migrations:**
   - Run the automated migration runner to apply `profiles` schema, triggers, and Row Level Security:
   ```bash
   cd server && npm run migrate
   ```
5. **Verify Row Level Security (RLS):**
   - Run the automated multi-tenant RLS verification test suite:
   ```bash
   cd server && npm run test:rls
   ```
6. **Email Confirmation Handling:**
   - If your Supabase Auth project has **Confirm email** enabled (Authentication ➔ Providers ➔ Email), new users will receive a verification link before establishing a session. The application gracefully supports both immediate-session configurations and email-confirmation workflows.

### 5. Running the Application
Start both frontend and backend concurrently from the root directory:
```bash
npm run dev
```

Or run them in separate terminal sessions:
```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
npm run server

# Terminal 2: Frontend Client (runs on http://localhost:5173)
npm run client
```

### 6. Verifying Installation
* **Backend Healthcheck:** Open `http://localhost:5000/api/health` in your browser. Expected response:
  ```json
  {
    "success": true,
    "message": "AI Study Planner API is running",
    "environment": "development"
  }
  ```
* **Frontend Application:** Open `http://localhost:5173/` to view the landing page, register a student account at `/register`, or log in at `/login`.

---

### 5. Running Database Tests
Verify Row Level Security (RLS) and cross-user data isolation:
```bash
# Verify Phase 2 Profile RLS
cd server && npm run test:rls

# Verify Phase 3 Subject & Topic Hierarchy RLS & Cascade Deletions
cd server && npm run test:rls:phase3
```

---

## 🧭 Project Roadmap & Phases

* [x] **Phase 0:** Complete Project Architecture & Technical Blueprint (`docs/PHASE_0_ARCHITECTURE_BLUEPRINT.md`)
* [x] **Phase 1:** Project Setup, Frontend Foundation & Backend Foundation
* [x] **Phase 2 (COMPLETED):** Authentication & Student Profile Management (Supabase Auth & RLS)
* [x] **Phase 3 (COMPLETED):** Subject, Syllabus & Topic Management
  * `subjects` table: `id`, `user_id` (FK), `name`, `description`, `exam_date`, `target_score`, `color`, `icon`, timestamps.
  * `topics` table: `id`, `subject_id` (FK), `name`, `description`, `difficulty`, `estimated_minutes`, `status`, `completion_percentage`, timestamps.
  * PostgreSQL triggers, indexes, and 8 Row Level Security policies enforcing zero cross-user leakage.
  * Layered Express backend with Zod validation (`/api/subjects`, `/api/topics`, `/api/subjects/summary`).
  * Strict Light Theme UI: Curriculum list with search (`/subjects`), Subject Details with syllabus checklist & progress velocity (`/subjects/:id`), and live Dashboard metrics integration.
  * 100% passing automated test suite (`npm run test:rls:phase3`).
* [ ] **Phase 4:** Focus Mode & Live Study Session Stopwatch
* [ ] **Phase 5:** Deterministic Priority & Rule-Based Timetable Generator *(Core MVP)*
* [ ] **Phase 6:** Server-Side Google Gemini AI Gateway Integration
* [ ] **Phase 7:** AI Quiz Generation & Objective Topic Mastery Evaluation
* [ ] **Phase 8:** Adaptive Replanning & Event-Driven Rescheduling
* [ ] **Phase 9:** Comprehensive Analytics & Visual Progress Dashboard (Recharts)
* [ ] **Phase 10:** Contextual AI Tutor & Natural Language Study Log Parser
* [ ] **Phase 11:** Multi-Tier Testing, Security Audits & Optimization
* [ ] **Phase 12:** Production Deployment, CI/CD & Final Capstone Presentation

---

## 📄 License
This project is developed as an academic B.Tech CSE Capstone Project under the MIT License.
