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

# Verify Phase 4 Study Session RLS, Single Active Session Rule & History Preservation
cd server && npm run test:rls:phase4

# Verify Phase 5 Rule-Based Planner Engine
cd server && npm run test:planner

# Verify Phase 6 Gemini AI Advisory Layer & Fallback
cd server && npm run test:ai

# Verify Phase 7 Quiz Generation, Evaluation & Topic Performance Engine
cd server && npm run test:quiz

# Verify Phase 8 Adaptive Priority & Engine
cd server && npm run test:priority:adaptive
cd server && npm run test:adaptive
cd server && npm run test:adaptive:api
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
* [x] **Phase 4 (COMPLETED):** Study Session & Activity Tracking
  * `study_sessions` table: `id`, `user_id` (FK), `subject_id` (FK with historical preservation via `ON DELETE SET NULL`), `topic_id` (FK with historical preservation via `ON DELETE SET NULL`), `started_at`, `ended_at`, `duration_minutes`, `status`, `notes`, `confidence_level`, `difficulty_feedback`, timestamps.
  * Unbreakable single active session constraint: partial unique index `idx_one_active_session_per_user` on `(user_id) WHERE status = 'IN_PROGRESS'`.
  * Server-authoritative duration calculation (`ended_at - started_at`) avoiding clock tampering and client timer drift.
  * Layered Express backend with Zod validation (`POST /api/study/start`, `GET /api/study/active`, `POST /api/study/:id/complete`, `POST /api/study/:id/cancel`, `GET /api/study/today`, `GET /api/study/history`, `GET /api/study/summary`).
  * Strict Light Theme UI: Focus Room (`/study`) with precision timestamp timer, post-session reflection modal (1–5 confidence, difficulty feedback, notes), cancel confirmation, cascading selectors, and tab-closure/refresh recovery.
  * Dashboard live integration: real Today's Focus Duration (`Xh Ym`), completed session counter, and active session pulse banner with 1-click timer resume.
  * 100% passing automated test suite (`npm run test:rls:phase4`).
* [x] **Phase 5 (COMPLETED):** Rule-Based Study Planner & Deterministic Timetable Engine
  * `study_plans` table: `id`, `user_id` (FK), `subject_id` (FK), `topic_id` (FK), `plan_date`, `start_time`, `end_time`, `planned_minutes`, `priority_score`, `reason`, `status`, `source`, timestamps.
  * Deterministic multi-factor priority algorithm:
    $$\text{Priority Score} = 0.40 \cdot \text{Urgency} + 0.30 \cdot \text{CompletionNeed} + 0.15 \cdot \text{Difficulty} + 0.15 \cdot \text{Inactivity}$$
  * Zero overscheduling guarantee: planned minutes capped by $\min(H_{daily} \cdot 60, \text{windowMinutes})$.
  * Zero overlap guarantee: sequential scheduling with automatic 10-minute rest intervals after $\ge 50$m study blocks.
  * Safe Regeneration policy: only regenerates `RULE_ENGINE` `PENDING` / `SKIPPED` tasks; strictly preserves `COMPLETED` and `IN_PROGRESS` plans.
  * Express REST API with Zod validation (`POST /api/planner/generate`, `GET /api/planner/today`, `GET /api/planner`, `GET /api/planner/week`, `PATCH /api/planner/:id/status`).
  * Strict Light Theme UI: Interactive timetable (`/planner`) with DaySelector, PlanSummaryHeader, PlanTaskCard, explainable reasons, 1-click "Start Study" linking to Phase 4 focus room, and real Today's Plan section on Dashboard.
  * 100% passing automated verification suite (`npm run test:planner`).
* [x] **Phase 6 (COMPLETED):** Gemini AI Advisory & Recommendation Layer
  * Server-side isolated AI architecture wrapping `@google/genai` (v2.24.0) with centralized model configuration, timeout racing ($15000$ms), and low temperature ($0.2$) for factual grounding.
  * Zero-crash architectural guarantee: Gemini operates strictly as an advisory layer with automatic fallback to deterministic rule-engine advice (`FALLBACK_RULE_ENGINE`) if offline or rate-limited; core Phase 5 planner is never blocked.
  * Minimal context extraction service (`ai-context.service.js`) with verified cross-user data isolation, topic ownership enforcement, and prompt injection sanitization.
  * Versioned prompt builders:
    * `recommendation_prompt_v1`: High-impact daily focus recommendations.
    * `explain_plan_prompt_v1`: Transparent student-friendly explanations of rule-based task ordering.
    * `study_strategy_prompt_v1`: 4-to-6 timed tactical phases (Concept Review, Problem Solving, Active Recall) and pro tips.
    * `ask_prompt_v1`: Timetable-grounded mentor Q&A with guardrails preventing unauthorized database actions.
  * Express REST API with Zod validation (`POST /api/ai/recommendation`, `POST /api/ai/explain-plan`, `POST /api/ai/study-strategy`, `POST /api/ai/ask`).
  * Strict Light Theme UI: Interactive AI Advisor page (`/ai`), on-demand AI Advice card on Dashboard, "Why this plan?" modal on Planner, and "AI Strategy" button on Subject Details topics.
  * Security verified: `GEMINI_API_KEY` exists strictly on the server and is 100% absent from client bundles, browser network payloads, and Git history.
  * 100% passing automated test suite (`npm run test:ai`).
* [x] **Phase 7 (COMPLETED):** AI Quiz Generation, Deterministic Evaluation & Topic Performance Engine
  * Relational database tables with Row Level Security:
    * `quizzes`: `id`, `user_id` (FK), `subject_id` (FK), `topic_id` (FK), `title`, `difficulty`, `question_count`, `created_at`.
    * `quiz_questions`: `id`, `quiz_id` (FK), `question_text`, `options` (JSONB), `correct_answer`, `explanation`, `points`, `question_order`.
    * `quiz_attempts`: `id`, `quiz_id` (FK), `user_id` (FK), `started_at`, `submitted_at`, `score`, `max_score`, `percentage`, `correct_count`, `incorrect_count`, `unanswered_count`, `status`.
    * `quiz_answers`: `id`, `attempt_id` (FK), `question_id` (FK), `selected_answer`, `is_correct`, `points_earned`, `answered_at`.
    * `topic_performance`: `id`, `user_id` (FK), `topic_id` (FK), `attempt_count`, `average_percentage`, `recent_percentage`, `composite_score`, `performance_level`, `last_assessed_at`.
  * **Zero Answer Leakage Guarantee:** `GET /api/quizzes/:id` and `POST /api/quizzes/:id/start` deliver questions with choices while strictly omitting `correct_answer` and `explanation`. Full answers and pedagogical rationales are only revealed in the post-submission review payload.
  * **Deterministic Backend Evaluation:** Client submits only selected answer identifiers; server calculates points, correct/incorrect/unanswered tallies, and percentage. Duplicate submission rejected with `409 QUIZ_ALREADY_SUBMITTED`.
  * **Topic Performance Engine:** Computes multi-attempt moving average:
    $$\text{Composite Score} = 0.60 \times (\text{Average of last 3 attempts}) + 0.40 \times (\text{All-time average})$$
    Performance categories: `WEAK` (<50%), `NEEDS_PRACTICE` (50–69%), `AVERAGE` (70–84%), `STRONG` ($\ge$85%).
  * **Pedagogical Separation Principle:** Verified that 100% syllabus progress does not mask weak quiz mastery.
  * **On-Demand AI Explanations:** Deep-dive conceptual breakdowns, distractor analysis, and key takeaways generated by Gemini on student request.
  * **Strict Light Theme UI:** Full Quiz page (`/quiz`) with quiz generator form, taking stepper with unanswered question warnings, scorecard results with on-demand AI drawer, and past attempts table; revamped Progress page (`/progress`) with live Topic Performance Matrix; and Dashboard with live Quiz Mastery KPI and Weak Topics card with 1-click "Practice Quiz" deep links.
  * 100% passing automated verification test suites: `npm run test:quiz` (`test:quiz:eval` + `test:perf`), `npm run test:planner`, `npm run test:ai`, `npm run test:rls`.
* [x] **Phase 8 (COMPLETED):** Adaptive Study Planner & Multi-Factor Feedback Engine
  * Migration `20260925000005_add_adaptive_planner_metadata.sql`: Added `adaptation_metadata JSONB` and `idx_study_plans_user_source` to `public.study_plans`.
  * **Zero Gemini Scheduling Authority Guarantee:** Gemini has 0% direct control over timetable generation. Scheduling is 100% deterministic backend logic. Gemini only provides optional natural-language explanations (`/api/ai/explain-adaptive-plan`).
  * **Zero Crash / AI Independence Guarantee:** The adaptive planner operates deterministically and generates valid timetables even if Gemini is disabled, offline, or rate-limited.
  * **6-Factor Dynamic Priority Formula:**
    $$\text{Priority Score} = 0.30 \cdot \text{ExamUrgency} + 0.25 \cdot \text{Weakness} + 0.15 \cdot \text{CompletionNeed} + 0.10 \cdot \text{Inactivity} + 0.10 \cdot \text{Difficulty} + 0.10 \cdot \text{MissedPressure}$$
    * Monotonic exam urgency decay with past exam bounding.
    * Weakness scoring integrated with Phase 7 quiz accuracy moving averages and sudden degradation penalties (+0.10).
    * Bounded missed task pressure ($0 \rightarrow 0.0, 1 \rightarrow 0.5, 2 \rightarrow 0.8, \ge 3 \rightarrow 1.0$) preventing infinite loops.
  * **Observed vs. Declared Capacity Reconciler:**
    $$\text{effective\_capacity} = \min(\text{declared\_capacity}, \text{round}(\text{daily\_observed\_avg} \times 1.15))$$
    Adjusts workload to match the student's real observed pace when $\ge 3$ sessions are logged across $\ge 2$ active days.
  * **Scheduling Constraints & Multi-Day Workload Allocator:**
    * Topics $>90$m automatically split into manageable blocks across multiple days.
    * Strict minimum study block packing ($\ge 20$m).
    * Non-overlapping time slots with automatic 10-minute breaks after blocks $\ge 50$m.
    * Subject balancing across days when priority scores are within $0.15$.
    * Strict omission of topics whose subject exam date has passed.
  * **Safe Plan Regeneration Policy:** Strictly preserves `COMPLETED` and `IN_PROGRESS` historical sessions. Only future `PENDING`, `SKIPPED`, and `MISSED` plans in the target horizon are recalibrated.
  * **Express REST APIs:**
    * `POST /api/planner/adaptive/generate`: Generates adaptive schedule across 1 to 14 days.
    * `POST /api/planner/adaptive/regenerate`: Safe recalibration of upcoming tasks.
    * `GET /api/planner/adaptive/today`: Today's adaptive tasks and real-time capacity budget.
    * `GET /api/planner/adaptive/week`: 7-day adaptive timetable view.
    * `POST /api/planner/adaptive/explain`: Explainable rationale with AI enhancement and deterministic fallback.
    * `PATCH /api/planner/:id/status`: Updates task status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`, `MISSED`).
  * **Strict Light Theme UI:**
    * `Planner.jsx`: Adaptive Planner with 7-Day ribbon, daily/weekly views, safe recalibration modal, and "Why this plan?" explanation drawer.
    * `AdaptiveExplainerCard.jsx`: Light-theme transparency panel detailing the 6 adaptive signals.
    * `PlanTaskCard.jsx`: Adaptive task blocks with driving factor tags (`Weak Topic`, `Exam Soon`, `Recovery`), formatted time slots, priority badges, explainable reasons, and actions (`Start Study`, `Complete`, `Skip`, `Catch Up`).
    * `PlanSummaryHeader.jsx`: Daily stats with pace-calibrated capacity indicator and completion meters.
    * `PlanRegenerationModal.jsx`: Reassuring confirmation dialog emphasizing completed history preservation.
    * `QuizResultCard.jsx`: Post-quiz adaptation prompt linking directly to `/planner`.
    * `Dashboard.jsx`: Live adaptive schedule integration with driving factor chips and capacity utilization bar.
  * **Verification Suites:**
    * `npm run test:priority:adaptive`: **100% PASS** (7/7 tests passed).
    * `npm run test:adaptive`: **100% PASS** (Capacity budgeting, topic splitting, expired exam omission, Gemini independence, RLS isolation).
    * `npm run test:adaptive:api`: **100% PASS** (Validation, schedule generation, day/week queries, lifecycle state transitions, safe recalibration, explainability).
    * `npm run test:planner`: **100% PASS** (Phase 5 rule-based planner remains 100% backward compatible).
    * `npm run test:quiz`: **100% PASS** (Quiz evaluation and topic performance moving averages).
    * `npm run test:ai`: **100% PASS** (AI advisory and context isolation).
    * `client` production build (`npm run build`): **100% SUCCESS** (0 errors).
* [x] **Phase 9 (COMPLETED):** Student Intelligence, Analytics & Insights
  * **Zero Gemini Authoritative Calculation Guarantee:** All statistical metrics (total study hours, active vs. inactive days, daily velocity, plan adherence %, consistency score %, quiz trajectories, syllabus progress) are calculated 100% deterministically in the Node.js backend. Gemini is strictly optional for conversational synthesis (`/api/analytics/explain-insights`) with automatic fallback to deterministic summaries.
  * **Zero Crash / AI Independence Guarantee:** The analytics dashboard and all endpoints function completely without failure even if Gemini is disabled, rate-limited, or unavailable.
  * **Pure Statistical Calculation Engine (`server/src/services/metrics/`):**
    * `study-metrics.service.js`: Total study time, active vs. calendar-day velocity separation, consistency percentage, timezone-aware daily series, and streak calculator with yesterday-fallback.
    * `planner-metrics.service.js`: Planned study time vs. actual focus, adherence score (bounded 0–100%), status distribution counts (`COMPLETED`, `MISSED`, `PENDING`, `SKIPPED`), completion rate %, and miss rate %.
    * `quiz-metrics.service.js`: Score trajectory, historical moving averages, and trend classification (`IMPROVING`, `DECLINING`, `STABLE`, `INSUFFICIENT_DATA`).
    * `completion-metrics.service.js`: Weighted syllabus completion %, topic status distributions, subject-level breakdowns, and exam countdowns.
  * **Deterministic Educational Insight Engine (`server/src/services/analytics/insight.service.js`):**
    * 11+ deterministic pedagogic rules evaluating approaching exams, quiz score shifts, weak topic concentrations, plan adherence, study habit consistency, and multi-day inactivity gaps.
    * Deterministic priority ordering: `EXAM_URGENCY` (100) $\rightarrow$ `QUIZ_PERFORMANCE` (95/80) $\rightarrow$ `TOPIC_PERFORMANCE` (85) $\rightarrow$ `PLAN_ADHERENCE` (75) $\rightarrow$ `STUDY_CONSISTENCY` (70) $\rightarrow$ `STUDY_PATTERN` (65) $\rightarrow$ `SUBJECT_BALANCE` (60) $\rightarrow$ `ACADEMIC_PROGRESS` (50).
    * Deduplication and strict cap at top 3–5 actionable insights.
    * Strict non-judgmental, neutral tone audit.
  * **REST APIs (`/api/analytics/`):**
    * `GET /api/analytics/overview?days=30`: Aggregated dashboard payload combining study, planner, quiz, academic completion, and deterministic insights in a single parallel query.
    * `GET /api/analytics/study?days=30`: Granular study session velocity and streaks.
    * `GET /api/analytics/academic?days=30`: Syllabus completion and subject breakdowns.
    * `GET /api/analytics/quiz?days=30`: Quiz mastery trajectories and score trends.
    * `GET /api/analytics/planner?days=30`: Plan adherence and task status distributions.
    * `GET /api/analytics/trends?days=30`: Chronological daily series for Recharts visualizations.
    * `GET /api/analytics/insights?days=30`: Prioritized deterministic insights.
    * `GET /api/analytics/subjects/:subjectId?days=30`: Single subject deep-dive with weak topics.
    * `GET /api/analytics/topics/:topicId`: Topic drill-down with session history and quiz attempts.
    * `POST /api/analytics/explain-insights`: Friendly AI Coach explanation with deterministic fallback.
  * **Strict Light Theme UI (`client/src/`):**
    * `Analytics.jsx`: Complete `/analytics` page with time range selector (`7d`, `14d`, `30d`, `90d`), refresh button, and responsive layout.
    * `OverviewMetrics.jsx`: Core KPI cards (Total Study Time, Consistency %, Current Streak, Plan Adherence %).
    * `StudyTrendChart.jsx`: Recharts BarChart visualizing daily focus minutes with light-themed tooltips.
    * `QuizTrendChart.jsx`: Recharts LineChart tracking assessment trajectories with trend badges (`Improving`, `Declining`, `Stable`).
    * `PlannerAdherence.jsx`: Dual-bar timeline comparing planned vs actual study time with status distribution chips.
    * `SubjectProgress.jsx`: Syllabus completion bars with course colors, topic counters, and exam countdown badges (`Exam in Xd`, `Exam Today!`, `Exam Passed`).
    * `InsightsPanel.jsx`: Severity-coded intelligence cards with actionable recommendations and interactive AI Coach modal.
    * `TopicAnalyticsTable.jsx`: Comprehensive table with search filter, subject filter, status filter, and pagination.
    * `Dashboard.jsx`: 7-day Student Intelligence Preview card linking to `/analytics`.
    * `SubjectDetails.jsx`, `Study.jsx`, `Quiz.jsx`: Deep links connecting the entire learning loop.
  * **Verification Suites:**
    * `npm run test:analytics:metrics`: **100% PASS** (6/6 test groups passed).
    * `npm run test:analytics:insights`: **100% PASS** (6/6 test groups passed).
    * `npm run test:analytics:api`: **100% PASS** (6/6 integration tests passed with cross-user RLS tenant isolation).
    * `npm run test:analytics`: **100% PASS** (Unified suite passed).
    * `npm run test:priority:adaptive`, `npm run test:adaptive`, `npm run test:planner`, `npm run test:quiz`, `npm run test:ai`: **100% PASS** (All regressions verified).
    * `npm run build` in `client/`: **100% SUCCESS** (Vite built in <700ms, 0 errors).
* [ ] **Phase 10:** Contextual AI Tutor & Natural Language Study Log Parser
* [ ] **Phase 11:** Multi-Tier Testing, Security Audits & Optimization
* [ ] **Phase 12:** Production Deployment, CI/CD & Final Capstone Presentation

---

## 📄 License
This project is developed as an academic B.Tech CSE Capstone Project under the MIT License.
