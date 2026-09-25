# AI STUDY PLANNER — SYSTEM ARCHITECTURE & DEVELOPMENT BLUEPRINT
**Document Version:** 1.0.0  
**Phase:** 0 (System Architecture & Technical Blueprint)  
**Author:** Lead Software Architect (B.Tech CSE Capstone Project)  
**Status:** Approved for Implementation Blueprinting  

---

# 1. Executive Summary

### 1.1 Project Overview
The **AI Study Planner** is a production-grade, adaptive web application engineered to solve one of the most critical challenges facing undergraduate engineering students: **ineffective, rigid, and static study scheduling**. 

Traditional study planners and calendar apps treat study planning as a static calendar-filling exercise. When a student inevitably misses a study session or struggles with a difficult topic, static schedules immediately fall out of sync, causing anxiety, cognitive overload, and plan abandonment. 

The **AI Study Planner** redefines this paradigm by functioning as an **intelligent, closed-loop adaptive system**. It combines a **deterministic algorithmic core** (for date calculations, urgency scoring, syllabus tracking, and daily capacity constraints) with **Large Language Model (LLM) intelligence powered by Google Gemini** (for natural language parsing, contextual tutoring, dynamic quiz generation, and personalized recommendations).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE CLOSED-LOOP SYSTEM                          │
│                                                                        │
│   Student Input (Syllabus, Exam Dates, Daily Available Hours)          │
│        ↓                                                               │
│   Deterministic Initial Schedule (Constraint-Based Slot Allocation)    │
│        ↓                                                               │
│   Active Study Session Tracking (Focus Mode, Elapsed Timer, Notes)     │
│        ↓                                                               │
│   Performance & Objective Feedback (Quiz Scores, Confidence Ratings)   │
│        ↓                                                               │
│   Algorithmic Analysis (Urgency, Weakness Index, Completion Drift)     │
│        ↓                                                               │
│   Adaptive Dynamic Plan Regeneration (Automatic Rescheduling)          │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Architectural Philosophy: Deterministic Core vs AI Augmentation
A fundamental tenet of this system is the **strict separation between deterministic software engineering and AI capabilities**:
* **Deterministic Logic (Handled strictly by Node.js & PostgreSQL):**
  * Time tracking, session durations, countdown timers.
  * Date/time calculations and timezone conversions.
  * Syllabus completion percentages.
  * Objective quiz scoring and percentage calculations.
  * Mathematical priority formulas (combining exam urgency, weakness index, syllabus weight).
  * Access control, authentication, database transactions, and data consistency.
* **AI Capabilities (Handled strictly via Server-Side Google Gemini API calls):**
  * Dynamic, syllabus-aware multiple-choice quiz generation with pedagogical explanations.
  * Conversational AI tutoring scoped strictly to the student's active topic.
  * Natural language study log parsing (e.g., converting informal student logs into structured database entries).
  * High-level weekly qualitative feedback and study strategy recommendations.

The application never relies on an LLM for calendar arithmetic, database mutations, or business logic validation. If the AI service is unreachable, 100% of the core scheduling and tracking capabilities remain operational.

---

# 2. Product Vision & Value Proposition

### 2.1 The Four Core Student Questions
The application is designed specifically to answer four daily questions for an engineering student with absolute clarity:

```mermaid
mindmap
  root((Student Questions))
    1. What should I study today?
      Targeted daily schedule
      Balanced across subjects
      Strictly fits within daily available hours
    2. Why should I study this topic?
      Transparent Priority Score breakdown
      Days remaining before exam
      Identified topic weakness from past quizzes
    3. How am I performing?
      Objective quiz mastery metrics
      Planned vs actual study time tracking
      Syllabus completion percentage
    4. What should I change in my plan?
      Adaptive rescheduling of missed sessions
      Automatic revision injection for weak areas
      Pacing adjustments for upcoming deadlines
```

### 2.2 Continuous Adaptive Feedback Loop
Unlike traditional planners where a missed task remains a red mark on an outdated calendar, the AI Study Planner operates as an adaptive feedback engine:
1. **Student Input:** Subjects, syllabus topics, estimated minutes, exam dates, daily available hours ($H_{daily}$), and preferred study windows.
2. **Initial Plan:** Deterministic rule engine allocates optimal study blocks avoiding burn-out.
3. **Study Activity:** Focus mode tracks actual minutes spent vs planned minutes, capturing post-session confidence (1 to 5).
4. **Performance Data:** AI-generated quizzes assess factual recall and conceptual understanding.
5. **Analysis:** Weakness scores ($W$) and Exam Urgency ($E$) are recomputed.
6. **Updated Priorities:** Topics with low scores or missed sessions receive an elevated priority score.
7. **Updated Study Plan:** Future study blocks automatically adapt without requiring manual calendar rearrangement by the student.

---

# 3. Core Features & Functional Scope

The system is partitioned into nine tightly cohesive functional modules:

| # | Module | Scope & Responsibility |
|---|---|---|
| **M1** | **Profile & Availability Management** | Captures college branch, semester, target CGPA, timezone, daily available study hours ($1.0 - 12.0\text{ hrs}$), and preferred study slots (Morning, Afternoon, Evening, Night). |
| **M2** | **Subject & Syllabus Hierarchy** | CRUD operations for Subjects (with exam dates, target marks, color-coding) and Topics (difficulty level: Easy/Medium/Hard, estimated minutes, completion status: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `NEEDS_REVISION`). |
| **M3** | **Active Study Session Tracker (Focus Mode)** | Distraction-free study interface featuring an active stopwatch/countdown timer, play/pause controls, real-time minute logging, and post-session reflection (difficulty rating, confidence score, notes). |
| **M4** | **Deterministic Rule-Based Planner** | Computes multi-factor priority scores ($0 - 100$) based on exam countdowns, syllabus progress, and difficulty ratings to generate clean daily and weekly schedules. |
| **M5** | **Adaptive Replanning Engine** | State machine reacting to missed sessions, partial durations ($<70\%$), and poor quiz scores ($<50\%$) by automatically inserting remediation and revision slots. |
| **M6** | **AI Quiz Engine & Weak Topic Detection** | Generates 5–10 question conceptual multiple-choice quizzes using Gemini API with structured JSON output; records attempt history and tracks historical topic mastery. |
| **M7** | **Contextual AI Tutor** | Context-bounded educational chat assistant that grounds responses strictly in the student's active subject and topic, with pre-configured prompts for simplifying, providing examples, or testing understanding. |
| **M8** | **Natural Language Study Log Parser** | Parses unstructured student input (e.g., *"Studied Operating Systems for 90 minutes today, understood Semaphore but struggled with Banker's Algorithm"*) into structured database records. |
| **M9** | **Progress & Analytics Dashboard** | Visualizes planned vs actual study time, subject distribution, quiz performance curves, study streaks, and syllabus completion using Recharts. |

---

# 4. Technology Stack & Architectural Justifications

The technology stack is selected to ensure developer velocity, maintainability, type safety, relational data integrity, and strict enterprise security:

```
┌────────────────────────────────────────────────────────────────────────┐
│                           TECHNOLOGY STACK                             │
├───────────────────┬────────────────────────────────────────────────────┤
│ Frontend Layer    │ React 18, Vite, React Router v6, Tailwind CSS,     │
│                   │ Recharts, Axios, Context API                       │
├───────────────────┼────────────────────────────────────────────────────┤
│ Backend Layer     │ Node.js (v20+ LTS), Express.js (REST Architecture),│
│                   │ Zod / Joi Validation, Helmet, CORS, Rate-Limiting  │
├───────────────────┼────────────────────────────────────────────────────┤
│ Database & Auth   │ Supabase (Managed PostgreSQL 15+, Supabase Auth,   │
│                   │ Row Level Security Policies)                       │
├───────────────────┼────────────────────────────────────────────────────┤
│ Artificial Intel. │ Google Gemini API (Gemini 1.5 Pro / Flash via      │
│                   │ official Google Gen AI SDK — Backend Only)         │
└───────────────────┴────────────────────────────────────────────────────┘
```

### 4.1 Frontend Justifications
* **React 18 + Vite:** Instant Hot Module Replacement (HMR), minimal build overhead compared to Create React App, and vast ecosystem compatibility.
* **Tailwind CSS:** Eliminates bulky CSS bundles, enables consistent design tokens (colors, spacing, typography), and provides instant responsiveness for mobile and desktop screens.
* **Recharts:** Composable, SVG-based charting library built specifically for React, offering smooth animations for study analytics and score trends.
* **Context API over Redux:** The application has well-defined domain boundaries (Auth, Active Study Session, Planner State). Redux introduces unnecessary boilerplate and mental overhead for this scope; custom React hooks wrapping Context provide clean, maintainable, and inspectable state management.

### 4.2 Backend Justifications
* **Node.js + Express.js:** Mature asynchronous I/O model ideal for REST APIs, rich ecosystem of middleware (security headers, token decoders, rate limiters), and universal JavaScript/JSON handling across the stack.
* **Layered Service Architecture (`Routes ➔ Middleware ➔ Controllers ➔ Services ➔ Data Layer`):** Prevents bloated route handlers, enables unit testing of business logic in complete isolation from HTTP requests, and cleanly separates database access from external AI calls.

### 4.3 Database & Authentication Justifications (Supabase vs MongoDB)
* **PostgreSQL over MongoDB:** Study planning data is **inherently relational**:
  * A Profile has many Subjects.
  * A Subject has many Topics.
  * A Topic has many Study Sessions, Study Plans, Quizzes, and Performance metrics.
  * Relational foreign key constraints (`ON DELETE CASCADE`), ACID transactions, and standard relational joins prevent orphaned records and data corruption. MongoDB's document model would lead to duplicated data, inconsistent references, or complex manual aggregation pipelines.
* **Supabase Auth & Row Level Security (RLS):** Offloads complex password hashing, JWT signing, refresh token rotation, and email verification to a battle-tested service. PostgreSQL RLS adds a critical second layer of defense directly at the database engine level.

### 4.4 AI Architecture Justifications (Gemini Backend-Only)
* **Zero Client Exposure:** `GEMINI_API_KEY` is strictly confined to the Node.js server. The React client has zero awareness of AI credentials.
* **Input Sanitization & Output Validation:** The Node.js server filters all inputs before dispatching prompts to Gemini and validates AI-returned JSON structures against strict Zod schemas before saving any data to PostgreSQL.

---

# 5. High-Level System Architecture

### 5.1 Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Browser / Mobile)"]
        UI["React 18 SPA (Vite + Tailwind CSS)"]
        Router["React Router v6"]
        State["Context API & Custom Hooks"]
        ClientAPI["Axios HTTP Client (Bearer JWT Token)"]
        UI --> Router --> State --> ClientAPI
    end

    subgraph SecurityPerimeter ["API Gateway & Security Perimeter"]
        CORS["CORS Policy Middleware"]
        Helmet["Helmet Security Headers"]
        RateLimit["Express Rate Limiter (AI & Auth Limiting)"]
        AuthMiddleware["Supabase Auth Token Verifier"]
        ClientAPI -- HTTPS / JSON --> CORS --> Helmet --> RateLimit --> AuthMiddleware
    end

    subgraph BackendLayer ["Node.js + Express Application Tier"]
        Controllers["Express Route Controllers"]
        Validators["Input Validation Layer (Zod Schemas)"]
        
        subgraph DomainServices ["Domain Services (Business Logic)"]
            ProfileService["Profile & Settings Service"]
            SubjectService["Subject & Syllabus Service"]
            StudyService["Study Session Tracker Service"]
            PlannerEngine["Deterministic Planner Engine"]
            AdaptiveEngine["Adaptive Re-Scheduling Engine"]
            QuizEngine["Quiz & Evaluation Service"]
            AnalyticsEngine["Performance Analytics Engine"]
            GeminiAIService["Gemini AI Gateway Service"]
        end

        AuthMiddleware --> Controllers
        Controllers --> Validators --> DomainServices
    end

    subgraph ExternalServices ["Data & Intelligence Infrastructure"]
        subgraph SupabasePlatform ["Supabase Cloud (PostgreSQL 15+)"]
            AuthDB["Supabase Auth Engine (JWT / Users)"]
            PostgresDB[(PostgreSQL Relational DB)]
            RLSPolicies["Row Level Security (RLS Engine)"]
            PostgresDB --- RLSPolicies
        end

        subgraph GoogleCloud ["Google AI Infrastructure"]
            GeminiAPI["Google Gemini 1.5 API (REST / SDK)"]
        end
    end

    DomainServices -- Supabase Client (Service Role / User JWT) --> PostgresDB
    AuthMiddleware -- Token Validation --> AuthDB
    GeminiAIService -- Secure Server-Side Calls (GEMINI_API_KEY) --> GeminiAPI
```

### 5.2 Component Isolation & Data Flow Boundaries

1. **Client Isolation:** The React frontend can only communicate with the Node.js backend via authenticated HTTPS REST requests. The client never queries Supabase PostgreSQL directly using the service role, and never calls Gemini directly.
2. **Stateless Backend Tier:** The Node.js server maintains no in-memory session state; every request contains a cryptographically signed Bearer JWT token issued by Supabase Auth.
3. **Dual-Layer Database Security:**
   * **Application Layer:** Express controllers verify user ownership (`req.user.id`).
   * **Database Engine Layer:** PostgreSQL Row Level Security (RLS) ensures that even if an application bug allows an unauthorized query, the database itself rejects any row access where `auth.uid() != user_id`.
4. **AI Sandboxing:** The `GeminiAIService` acts as an isolated gateway. Prompts are constructed server-side with strict system guidelines. AI responses are parsed through strict JSON validation before any application state is updated.

---

# 6. End-to-End Data Flow & Interaction Workflows

This section provides exhaustive, step-by-step data traces for the **13 core application workflows**. Each trace details the exact journey of data:
$$\text{Frontend Action} \longrightarrow \text{API Endpoint} \longrightarrow \text{Backend Service} \longrightarrow \text{Database / AI Tier} \longrightarrow \text{Client UI Update}$$

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (React Client)
    participant API as Express API Layer
    participant Svc as Backend Domain Service
    participant DB as Supabase PostgreSQL
    participant AI as Google Gemini API

    Note over Student, DB: Example: Study Session Completion Flow
    Student->>API: POST /api/study/:id/complete (Token, Duration, Feedback)
    API->>API: Validate JWT & Request Schema (Zod)
    API->>Svc: studyService.completeSession(userId, sessionId, data)
    Svc->>DB: UPDATE study_sessions SET status='COMPLETED'...
    Svc->>Svc: Check Duration vs Planned (Adaptive Trigger)
    Svc->>DB: UPDATE topics SET completion_percentage...
    Svc-->>API: Session Completed + Adaptive Status
    API-->>Student: 200 OK { success: true, session, adaptiveUpdate }
    Student->>Student: Update Dashboard Progress & Streak
```

---

### Flow 1: User Registration & Profile Initialization
1. **Frontend:** Student fills registration form (`email`, `password`, `full_name`, `branch`, `semester`, `target_cgpa`, `daily_available_hours`, `preferred_study_start_time`, `preferred_study_end_time`, `timezone`).
2. **Client ➔ Supabase Auth:** React calls `supabase.auth.signUp({ email, password })`. Supabase creates `auth.users` record and returns user session + JWT.
3. **Client ➔ REST API:** React calls `POST /api/profile/init` with `Authorization: Bearer <jwt>` and profile metadata.
4. **Backend Middleware:** `authMiddleware` validates JWT via `supabase.auth.getUser(token)`. Extracts `user.id`.
5. **Backend Controller & Service:** `profileController` invokes `profileService.createProfile()`. Validates fields using Zod (`daily_available_hours` between 1.0 and 12.0).
6. **Database:** Executes `INSERT INTO profiles (id, full_name, email, branch, semester, target_cgpa, daily_available_hours, ...) VALUES (user.id, ...)`.
7. **Response & UI:** Backend returns `201 Created` with profile JSON. React stores profile in `AuthContext` and redirects to `/dashboard`.

---

### Flow 2: User Login & Token Exchange
1. **Frontend:** Student submits login credentials on `/login`.
2. **Client ➔ Supabase Auth:** Calls `supabase.auth.signInWithPassword({ email, password })`. Supabase verifies hash and returns `{ access_token, refresh_token, user }`.
3. **Client ➔ REST API:** React initiates `GET /api/profile/me` with `Authorization: Bearer <access_token>`.
4. **Backend Middleware:** `authMiddleware` verifies the cryptographic signature of the token against Supabase public keys/auth service and attaches `req.user = { id: user.id, email: user.email }`.
5. **Database:** Queries `SELECT * FROM profiles WHERE id = req.user.id`.
6. **Response & UI:** Backend returns `200 OK` with profile details. React initializes global `AuthContext`, sets up Axios request interceptors with the Bearer token, and navigates to `/dashboard`.

---

### Flow 3: Add Subject & Exam Target
1. **Frontend:** Student opens `/subjects` and submits modal form (`name: "Operating Systems"`, `exam_date: "2026-11-15"`, `target_score: 90`, `color: "#4F46E5"`).
2. **API Call:** `POST /api/subjects` with JSON payload and Bearer token.
3. **Backend Middleware & Validation:** `authMiddleware` injects `req.user.id`. Zod validator ensures `exam_date` is a valid ISO date in the future and `name` is non-empty.
4. **Backend Service:** `subjectService.createSubject(userId, data)` prepares record.
5. **Database:** Executes `INSERT INTO subjects (user_id, name, exam_date, target_score, color) VALUES (...) RETURNING *`.
6. **Response & UI:** Backend returns `201 Created` with new subject object. React updates subject list state and re-renders syllabus overview.

---

### Flow 4: Add / Manage Topics (Syllabus Input)
1. **Frontend:** On `/subjects/:id`, student adds topic (`name: "Virtual Memory & Paging"`, `difficulty: "HARD"`, `estimated_minutes: 90`).
2. **API Call:** `POST /api/subjects/:id/topics`.
3. **Backend Validation:** Validates `subject_id` UUID, verifies subject belongs to `req.user.id`, and validates difficulty enum (`EASY`, `MEDIUM`, `HARD`).
4. **Backend Service:** `topicService.createTopic(userId, subjectId, topicData)`.
5. **Database:** Executes `INSERT INTO topics (subject_id, name, difficulty, estimated_minutes, status, completion_percentage) VALUES (...)`. Also initializes row in `topic_performance` with score $0.0$.
6. **Response & UI:** Returns `201 Created`. Frontend appends topic to syllabus list, recalculates total subject minutes, and displays "Needs Planning" badge.

---

### Flow 5: Start Active Study Session (Focus Mode)
1. **Frontend:** Student clicks "Start Studying" for a scheduled topic from `/planner` or `/study`.
2. **API Call:** `POST /api/study/start` with `{ topic_id, subject_id, planned_minutes }`.
3. **Backend Middleware & Service:** `studyService.startSession(userId, topicId, subjectId)`.
4. **Database:** Executes `INSERT INTO study_sessions (user_id, subject_id, topic_id, started_at, status) VALUES (req.user.id, ..., NOW(), 'IN_PROGRESS') RETURNING id`. Updates corresponding `study_plans` row to status `IN_PROGRESS`.
5. **Response & UI:** Backend returns `201 Created` with `{ sessionId, started_at }`. React opens `/study` Focus Mode: begins active local stopwatch/timer, plays subtle white-noise audio if enabled, and locks distracting navigation.

---

### Flow 6: Complete Study Session (Feedback & Metric Capture)
1. **Frontend:** Student clicks "End Session" in Focus Mode. Modal collects: `duration_minutes: 45`, `difficulty_feedback: "HARD"`, `confidence_level: 4`, `notes: "Understood Page Tables; Need practice with TLB miss calculations"`.
2. **API Call:** `POST /api/study/:id/complete` with session metrics.
3. **Backend Validation:** Ensures `duration_minutes > 0` and `confidence_level` is between 1 and 5.
4. **Backend Service:**
   * Computes delta: `planned_minutes vs actual duration_minutes`.
   * Updates `study_sessions` row: `ended_at = NOW()`, `duration_minutes = 45`, `status = 'COMPLETED'`, `confidence_level = 4`, `difficulty_feedback = 'HARD'`.
   * Updates `study_plans` row to `COMPLETED`.
   * Increments `topics.completion_percentage` proportionally based on estimated topic duration.
   * If actual time was $< 70\%$ of planned time, dispatches event to `AdaptiveEngine` to schedule a carryover session.
5. **Database:** Executes transactional updates to `study_sessions`, `study_plans`, and `topics`.
6. **Response & UI:** Returns `200 OK` with session summary and updated streak count. React renders success screen with option: *"Test your knowledge with an instant 5-question AI quiz!"*.

---

### Flow 7: Generate Daily / Weekly Deterministic Study Plan
1. **Frontend:** Student navigates to `/planner` or clicks "Regenerate Plan".
2. **API Call:** `POST /api/planner/generate` with `{ target_date: "2026-10-01", days_ahead: 7 }`.
3. **Backend Service (`PlannerEngine`):**
   * Fetches user profile (`daily_available_hours`, preferred study slots).
   * Fetches all subjects and pending topics (`status != 'COMPLETED'`).
   * Fetches latest `topic_performance` records and upcoming exam dates.
   * Computes **Deterministic Priority Score** for every topic:
     $$\text{Priority} = 0.30(E) + 0.25(W) + 0.20(P) + 0.15(D) + 0.10(R)$$
   * Sorts candidate topics by priority descending.
   * Bin-packs topics into available daily study blocks ($H_{daily}$) without exceeding max daily hours.
4. **Database:** In a single transaction: marks unstarted previous plans for that range as `RESCHEDULED`, and executes `INSERT INTO study_plans (...)` for all newly slotted tasks.
5. **Response & UI:** Returns `200 OK` with structured array of daily plan slots. React renders calendar/timeline view with tags: `[Priority: 88]`, `[Reason: Exam in 6 days + Weak Quiz History]`.

---

### Flow 8: Generate AI Quiz (Contextual Gemini Request)
1. **Frontend:** Student selects subject & topic, chooses difficulty (`MEDIUM`), and clicks "Generate Quiz".
2. **API Call:** `POST /api/quizzes/generate` with `{ topic_id, question_count: 5, difficulty: "MEDIUM" }`.
3. **Backend Service (`QuizEngine`):**
   * Fetches topic name, subject name, and previous quiz performance metrics from DB.
   * Formulates strict system prompt and user context for Gemini (see Task 8 specifications).
   * Injects strict JSON response schema into Gemini API request (`response_mime_type: "application/json"`).
4. **AI Processing:** Server calls `gemini-1.5-flash`. Gemini produces 5 conceptual multiple-choice questions with 4 options, correct answer index, and clear pedagogical explanations.
5. **Backend Validation:** Validates Gemini JSON using Zod: verifies exact 5 items, each with 4 distinct options, valid correct answer index (0–3), and non-empty explanation.
6. **Database:**
   * Inserts row into `quizzes (topic_id, difficulty, question_count, generated_by='AI')`.
   * Inserts 5 rows into `quiz_questions (quiz_id, question, options, correct_answer, explanation)`.
   * Logs AI token usage into `ai_interaction_logs`.
7. **Response & UI:** Returns `201 Created` with quiz ID and question list (excluding `correct_answer` and `explanation` to prevent frontend inspection). React launches interactive quiz UI with countdown timer.

---

### Flow 9: Submit Quiz & Compute Objective Score
1. **Frontend:** Student completes answers `[ { question_id: "...", selected_option: 2 }, ... ]` and clicks "Submit Quiz".
2. **API Call:** `POST /api/quizzes/:id/submit` with answers array.
3. **Backend Service (`QuizEngine`):**
   * Deterministically evaluates answers against database `quiz_questions.correct_answer`.
   * Calculates raw score (e.g., $4 / 5$) and percentage ($80.0\%$).
   * Determines per-question correctness and collects explanations.
4. **Database (Transaction):**
   * Inserts into `quiz_attempts (user_id, quiz_id, score, percentage, completed_at)`.
   * Inserts rows into `quiz_answers (attempt_id, question_id, selected_answer, is_correct)`.
5. **Automatic Hook ➔ Topic Performance Update:**
   * Triggers `performanceService.recalculateTopicScore(userId, topicId)`.
   * Recalculates exponentially weighted moving average topic mastery.
6. **Response & UI:** Returns `200 OK` with `{ score: 4, total: 5, percentage: 80.0, review: [ { question, selected, correct, is_correct, explanation } ] }`. React renders scorecard with detailed question-by-question breakdown.

---

### Flow 10: Topic Performance Update & Classification
1. **Trigger:** Automatically invoked after a quiz submission or study session completion.
2. **Backend Service (`AnalyticsEngine`):**
   * Fetches all quiz attempt percentages for the topic: $Q_1, Q_2, \dots, Q_k$.
   * Computes weighted average score giving higher weight ($60\%$) to the most recent attempt and $40\%$ to historical average.
   * Fetches student's average self-rated confidence level ($1.0 - 5.0$).
   * Classifies Topic Mastery Tier:
     * **STRONG:** $\text{Score} \ge 75\%$ AND $\text{Confidence} \ge 4$
     * **MEDIUM:** $50\% \le \text{Score} < 75\%$
     * **WEAK:** $\text{Score} < 50\%$ OR $\text{Confidence} \le 2$
3. **Database:** Executes `UPSERT INTO topic_performance (user_id, topic_id, mastery_score, attempts_count, mastery_tier, updated_at) VALUES (...)`.
4. **Response & System Effect:** If classified as `WEAK`, automatically flags `topics.status = 'NEEDS_REVISION'` and dispatches notification to student.

---

### Flow 11: Adaptive Plan Recalculation Trigger
1. **Trigger Scenarios:**
   * **Scenario A (Missed Session):** Cron check or student visit detects a study plan slot scheduled for yesterday that remains `PENDING`.
   * **Scenario B (Low Quiz Score):** Student scores $<50\%$ on a topic quiz.
   * **Scenario C (Partial Study):** Student studied only 25 minutes of a planned 60-minute session.
2. **Backend Service (`AdaptiveEngine`):**
   * Ingests the triggering event.
   * Marks missed slot as `MISSED` in `study_plans`.
   * Adjusts priority vector: increases Weakness score ($W = 100$) and Urgency.
   * Finds the earliest available open study slot in upcoming days matching student's preferred study window.
   * Rebalances workload to ensure daily study time does not exceed `daily_available_hours`.
3. **Database:** Inserts new adaptive `study_plans` record with `source = 'ADAPTIVE_ENGINE'` and `reason = 'Automatic revision: Scored 40% on recent quiz'`.
4. **Response & UI:** When student views `/planner`, a notification banner displays: *"Plan adapted: 1 revision session added for Normalization based on your recent quiz performance"*.

---

### Flow 12: Contextual AI Tutor Query
1. **Frontend:** On `/ai-tutor` or topic side-drawer, student asks: *"Why does BCNF eliminate all redundancy while 3NF does not? Give a real-world example."*
2. **API Call:** `POST /api/ai/tutor` with `{ topic_id: "...", message: "..." }`.
3. **Backend Middleware & Rate Limiting:** Enforces strict AI rate limit (max 15 queries / 10 minutes).
4. **Backend Service (`GeminiAIService`):**
   * Fetches subject name ("Database Management Systems") and topic name ("BCNF & 3NF") from DB to establish strict pedagogical context.
   * Constructs guarded prompt ensuring the model acts exclusively as an academic CS tutor:
     * Disallows off-topic questions.
     * Enforces structured formatting (Definition, Core Difference, Real-World Example, Quick Comprehension Check).
5. **AI Call:** Server dispatches request to Gemini 1.5.
6. **Backend Logging & Response:** Logs interaction in `ai_interaction_logs` (storing prompt metadata and token count). Returns `200 OK` with `{ reply: markdownText }`.
7. **UI:** React streams/renders formatted markdown response with syntax-highlighted examples and "Ask follow-up" shortcuts.

---

### Flow 13: Weekly Analytics Aggregation & AI Summary
1. **Frontend:** Student visits `/analytics` on Sunday evening or requests a "Weekly Performance Report".
2. **API Call:** `GET /api/analytics/weekly-summary`.
3. **Backend Deterministic Aggregation (`AnalyticsEngine`):**
   * Aggregates total hours studied in last 7 days vs planned hours.
   * Calculates syllabus completion delta ($\Delta\%$ completed this week).
   * Identifies top 3 strongest topics and top 3 weakest topics based on quiz scores.
   * Counts completed, missed, and rescheduled sessions.
4. **AI Augmentation Call (Gemini):**
   * Server sends the **anonymized numeric summary** to Gemini (no PII, no student names).
   * Prompt instructs Gemini to act as an academic mentor producing a concise 3-part brief:
     1. *What went exceptionally well*
     2. *High-priority areas requiring focus next week*
     3. *Actionable strategic tip for upcoming exams*
5. **Database:** Caches the weekly summary in `ai_interaction_logs` with a 7-day TTL to prevent duplicate LLM calls.
6. **Response & UI:** Returns `200 OK` with raw chart metrics (daily study breakdown, subject pie chart, quiz score timeline) plus the AI Mentor Narrative card. React renders rich charts via Recharts.

---

# 7. PostgreSQL Database Schema & Production DDL

This section provides the exhaustive, production-grade relational database schema for PostgreSQL (Supabase). The schema enforces strict referential integrity, domain constraints (`CHECK`), primary keys (`UUID`), cascading deletions (`ON DELETE CASCADE`), and automated timestamp triggers.

---

### 7.1 Schema Entity Overview (12 Tables)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE ENTITY MAP (12 TABLES)                     │
├────────────────────┬───────────────────────────────────────────────────┤
│ User & Identity    │ profiles                                          │
│ Curriculum         │ subjects, topics                                  │
│ Study Activity     │ study_sessions, study_plans                        │
│ Assessment         │ quizzes, quiz_questions, quiz_attempts,           │
│                    │ quiz_answers                                      │
│ Intelligence State │ topic_performance, ai_interaction_logs            │
│ Communication      │ notifications                                     │
└────────────────────┴───────────────────────────────────────────────────┘
```

---

### 7.2 Detailed Table Specifications

#### 1. `profiles`
Represents the student's academic profile, linked directly to Supabase Auth `auth.users`.
* `id` (`UUID`, PK, references `auth.users(id)` ON DELETE CASCADE)
* `full_name` (`VARCHAR(150)`, NOT NULL)
* `email` (`VARCHAR(255)`, NOT NULL, UNIQUE)
* `branch` (`VARCHAR(100)`, NOT NULL) — e.g. "Computer Science & Engineering"
* `semester` (`SMALLINT`, NOT NULL, CHECK: between 1 and 8)
* `target_cgpa` (`NUMERIC(3,2)`, NULL, CHECK: between 0.00 and 10.00)
* `daily_available_hours` (`NUMERIC(4,2)`, NOT NULL, DEFAULT 3.00, CHECK: between 0.50 and 16.00)
* `preferred_study_start_time` (`TIME`, NOT NULL, DEFAULT '09:00:00')
* `preferred_study_end_time` (`TIME`, NOT NULL, DEFAULT '22:00:00')
* `timezone` (`VARCHAR(50)`, NOT NULL, DEFAULT 'UTC')
* `streak_count` (`INTEGER`, NOT NULL, DEFAULT 0)
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())
* `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 2. `subjects`
Academic courses registered by the student.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id)` ON DELETE CASCADE)
* `name` (`VARCHAR(150)`, NOT NULL) — e.g. "Operating Systems"
* `description` (`TEXT`, NULL)
* `exam_date` (`DATE`, NOT NULL)
* `target_score` (`SMALLINT`, NOT NULL, DEFAULT 85, CHECK: between 0 and 100)
* `color` (`VARCHAR(20)`, NOT NULL, DEFAULT '#4F46E5')
* `icon` (`VARCHAR(50)`, NULL, DEFAULT 'book')
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())
* `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 3. `topics`
Individual syllabus chapters or modules under a subject.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `subject_id` (`UUID`, NOT NULL, references `subjects(id)` ON DELETE CASCADE)
* `name` (`VARCHAR(200)`, NOT NULL) — e.g. "Virtual Memory & Paging"
* `description` (`TEXT`, NULL)
* `difficulty` (`VARCHAR(20)`, NOT NULL, CHECK: `difficulty IN ('EASY', 'MEDIUM', 'HARD')`)
* `estimated_minutes` (`INTEGER`, NOT NULL, DEFAULT 60, CHECK: > 0)
* `status` (`VARCHAR(30)`, NOT NULL, DEFAULT 'NOT_STARTED', CHECK: `status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVISION')`)
* `completion_percentage` (`NUMERIC(5,2)`, NOT NULL, DEFAULT 0.00, CHECK: between 0.00 and 100.00)
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())
* `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 4. `study_sessions`
Logs actual time spent studying a topic.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id)` ON DELETE CASCADE)
* `subject_id` (`UUID`, NOT NULL, references `subjects(id)` ON DELETE CASCADE)
* `topic_id` (`UUID`, NOT NULL, references `topics(id)` ON DELETE CASCADE)
* `started_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())
* `ended_at` (`TIMESTAMPTZ`, NULL)
* `duration_minutes` (`INTEGER`, NOT NULL, DEFAULT 0, CHECK: >= 0)
* `status` (`VARCHAR(30)`, NOT NULL, DEFAULT 'IN_PROGRESS', CHECK: `status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'INTERRUPTED')`)
* `notes` (`TEXT`, NULL)
* `confidence_level` (`SMALLINT`, NULL, CHECK: between 1 and 5)
* `difficulty_feedback` (`VARCHAR(20)`, NULL, CHECK: `difficulty_feedback IN ('EASY', 'MEDIUM', 'HARD')`)
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 5. `study_plans`
Scheduled timetable blocks generated by rule engine or adaptive engine.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id)` ON DELETE CASCADE)
* `subject_id` (`UUID`, NOT NULL, references `subjects(id)` ON DELETE CASCADE)
* `topic_id` (`UUID`, NOT NULL, references `topics(id)` ON DELETE CASCADE)
* `plan_date` (`DATE`, NOT NULL)
* `start_time` (`TIME`, NOT NULL)
* `end_time` (`TIME`, NOT NULL)
* `planned_minutes` (`INTEGER`, NOT NULL, CHECK: > 0)
* `priority_score` (`NUMERIC(5,2)`, NOT NULL, DEFAULT 50.00, CHECK: between 0.00 and 100.00)
* `reason` (`VARCHAR(255)`, NOT NULL, DEFAULT 'Scheduled by Priority Engine')
* `status` (`VARCHAR(30)`, NOT NULL, DEFAULT 'PENDING', CHECK: `status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED', 'RESCHEDULED')`)
* `source` (`VARCHAR(30)`, NOT NULL, DEFAULT 'RULE_ENGINE', CHECK: `source IN ('RULE_ENGINE', 'AI', 'ADAPTIVE_ENGINE')`)
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())
* `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 6. `quizzes`
Quiz entity associated with a topic.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `topic_id` (`UUID`, NOT NULL, references `topics(id)` ON DELETE CASCADE)
* `difficulty` (`VARCHAR(20)`, NOT NULL, CHECK: `difficulty IN ('EASY', 'MEDIUM', 'HARD')`)
* `question_count` (`SMALLINT`, NOT NULL, DEFAULT 5, CHECK: > 0)
* `generated_by` (`VARCHAR(30)`, NOT NULL, DEFAULT 'AI', CHECK: `generated_by IN ('AI', 'MANUAL')`)
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 7. `quiz_questions`
Individual multiple-choice questions belonging to a quiz.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `quiz_id` (`UUID`, NOT NULL, references `quizzes(id)` ON DELETE CASCADE)
* `question` (`TEXT`, NOT NULL)
* `options` (`JSONB`, NOT NULL) — Array of 4 string options: `["Option A", "Option B", "Option C", "Option D"]`
* `correct_answer` (`SMALLINT`, NOT NULL, CHECK: between 0 and 3)
* `explanation` (`TEXT`, NOT NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 8. `quiz_attempts`
Student's test submission record.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id)` ON DELETE CASCADE)
* `quiz_id` (`UUID`, NOT NULL, references `quizzes(id)` ON DELETE CASCADE)
* `score` (`SMALLINT`, NOT NULL, CHECK: >= 0)
* `percentage` (`NUMERIC(5,2)`, NOT NULL, CHECK: between 0.00 and 100.00)
* `started_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())
* `completed_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 9. `quiz_answers`
Granular record of an answer chosen for each question in an attempt.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `attempt_id` (`UUID`, NOT NULL, references `quiz_attempts(id)` ON DELETE CASCADE)
* `question_id` (`UUID`, NOT NULL, references `quiz_questions(id)` ON DELETE CASCADE)
* `selected_answer` (`SMALLINT`, NOT NULL, CHECK: between 0 and 3)
* `is_correct` (`BOOLEAN`, NOT NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 10. `topic_performance`
Maintains the student's historical mastery metrics per topic.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id)` ON DELETE CASCADE)
* `topic_id` (`UUID`, NOT NULL, references `topics(id)` ON DELETE CASCADE)
* `mastery_score` (`NUMERIC(5,2)`, NOT NULL, DEFAULT 0.00, CHECK: between 0.00 and 100.00)
* `attempts_count` (`INTEGER`, NOT NULL, DEFAULT 0, CHECK: >= 0)
* `mastery_tier` (`VARCHAR(20)`, NOT NULL, DEFAULT 'MEDIUM', CHECK: `mastery_tier IN ('WEAK', 'MEDIUM', 'STRONG')`)
* `last_studied_at` (`TIMESTAMPTZ`, NULL)
* `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())
* **Constraint:** `UNIQUE(user_id, topic_id)`

#### 11. `ai_interaction_logs`
Audit log tracking LLM token consumption and sanitization monitoring.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id)` ON DELETE CASCADE)
* `interaction_type` (`VARCHAR(50)`, NOT NULL, CHECK: `interaction_type IN ('STUDY_PLAN', 'QUIZ_GENERATION', 'AI_TUTOR', 'STUDY_LOG_ANALYSIS', 'WEEKLY_SUMMARY', 'RECOMMENDATION')`)
* `input_context_summary` (`TEXT`, NOT NULL)
* `output_summary` (`TEXT`, NOT NULL)
* `model` (`VARCHAR(50)`, NOT NULL, DEFAULT 'gemini-1.5-flash')
* `tokens_used` (`INTEGER`, NULL)
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

#### 12. `notifications`
In-app alerts for adaptive changes, study reminders, and exam deadlines.
* `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
* `user_id` (`UUID`, NOT NULL, references `profiles(id)` ON DELETE CASCADE)
* `title` (`VARCHAR(150)`, NOT NULL)
* `message` (`TEXT`, NOT NULL)
* `type` (`VARCHAR(50)`, NOT NULL, DEFAULT 'SYSTEM', CHECK: `type IN ('PLAN_REMINDER', 'EXAM_ALERT', 'ADAPTIVE_CHANGE', 'SYSTEM')`)
* `is_read` (`BOOLEAN`, NOT NULL, DEFAULT FALSE)
* `scheduled_for` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())
* `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT NOW())

---

### 7.3 Production SQL DDL Script

```sql
-- ============================================================================
-- AI STUDY PLANNER: FULL POSTGRESQL SCHEMA SPECIFICATION
-- Database Engine: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    branch VARCHAR(100) NOT NULL,
    semester SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    target_cgpa NUMERIC(3,2) CHECK (target_cgpa BETWEEN 0.00 AND 10.00),
    daily_available_hours NUMERIC(4,2) NOT NULL DEFAULT 3.00 CHECK (daily_available_hours BETWEEN 0.50 AND 16.00),
    preferred_study_start_time TIME NOT NULL DEFAULT '09:00:00',
    preferred_study_end_time TIME NOT NULL DEFAULT '22:00:00',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    streak_count INTEGER NOT NULL DEFAULT 0 CHECK (streak_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    exam_date DATE NOT NULL,
    target_score SMALLINT NOT NULL DEFAULT 85 CHECK (target_score BETWEEN 0 AND 100),
    color VARCHAR(20) NOT NULL DEFAULT '#4F46E5',
    icon VARCHAR(50) DEFAULT 'book',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    estimated_minutes INTEGER NOT NULL DEFAULT 60 CHECK (estimated_minutes > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVISION')),
    completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (completion_percentage BETWEEN 0.00 AND 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'INTERRUPTED')),
    notes TEXT,
    confidence_level SMALLINT CHECK (confidence_level BETWEEN 1 AND 5),
    difficulty_feedback VARCHAR(20) CHECK (difficulty_feedback IN ('EASY', 'MEDIUM', 'HARD')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. STUDY PLANS TABLE
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    planned_minutes INTEGER NOT NULL CHECK (planned_minutes > 0),
    priority_score NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (priority_score BETWEEN 0.00 AND 100.00),
    reason VARCHAR(255) NOT NULL DEFAULT 'Scheduled by Priority Engine',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED', 'RESCHEDULED')),
    source VARCHAR(30) NOT NULL DEFAULT 'RULE_ENGINE' CHECK (source IN ('RULE_ENGINE', 'AI', 'ADAPTIVE_ENGINE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_study_plans_updated_at
BEFORE UPDATE ON public.study_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    question_count SMALLINT NOT NULL DEFAULT 5 CHECK (question_count > 0),
    generated_by VARCHAR(30) NOT NULL DEFAULT 'AI' CHECK (generated_by IN ('AI', 'MANUAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer SMALLINT NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    score SMALLINT NOT NULL CHECK (score >= 0),
    percentage NUMERIC(5,2) NOT NULL CHECK (percentage BETWEEN 0.00 AND 100.00),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. QUIZ ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_answer SMALLINT NOT NULL CHECK (selected_answer BETWEEN 0 AND 3),
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TOPIC PERFORMANCE TABLE
CREATE TABLE IF NOT EXISTS public.topic_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (mastery_score BETWEEN 0.00 AND 100.00),
    attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (attempts_count >= 0),
    mastery_tier VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (mastery_tier IN ('WEAK', 'MEDIUM', 'STRONG')),
    last_studied_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_topic_performance UNIQUE (user_id, topic_id)
);

CREATE TRIGGER update_topic_performance_updated_at
BEFORE UPDATE ON public.topic_performance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. AI INTERACTION LOGS TABLE
CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('STUDY_PLAN', 'QUIZ_GENERATION', 'AI_TUTOR', 'STUDY_LOG_ANALYSIS', 'WEEKLY_SUMMARY', 'RECOMMENDATION')),
    input_context_summary TEXT NOT NULL,
    output_summary TEXT NOT NULL,
    model VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash',
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('PLAN_REMINDER', 'EXAM_ALERT', 'ADAPTIVE_CHANGE', 'SYSTEM')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 8. Entity-Relationship (ER) Architecture

The data architecture follows strict Third Normal Form (3NF) relational design to guarantee data integrity, eliminate duplicate syllabus representations, and preserve historical performance records across all study interactions.

### 8.1 Visual Entity-Relationship Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1 identity"
    PROFILES ||--o{ SUBJECTS : "owns"
    SUBJECTS ||--o{ TOPICS : "contains"
    
    PROFILES ||--o{ STUDY_SESSIONS : "logs"
    SUBJECTS ||--o{ STUDY_SESSIONS : "categorizes"
    TOPICS ||--o{ STUDY_SESSIONS : "tracks"

    PROFILES ||--o{ STUDY_PLANS : "schedules"
    SUBJECTS ||--o{ STUDY_PLANS : "groups"
    TOPICS ||--o{ STUDY_PLANS : "allocates"

    TOPICS ||--o{ QUIZZES : "assesses"
    QUIZZES ||--o{ QUIZ_QUESTIONS : "comprises"
    
    PROFILES ||--o{ QUIZ_ATTEMPTS : "takes"
    QUIZZES ||--o{ QUIZ_ATTEMPTS : "records"
    
    QUIZ_ATTEMPTS ||--o{ QUIZ_ANSWERS : "contains"
    QUIZ_QUESTIONS ||--o{ QUIZ_ANSWERS : "evaluates"

    PROFILES ||--o{ TOPIC_PERFORMANCE : "accumulates"
    TOPICS ||--o{ TOPIC_PERFORMANCE : "measures"

    PROFILES ||--o{ AI_INTERACTION_LOGS : "audits"
    PROFILES ||--o{ NOTIFICATIONS : "receives"

    PROFILES {
        uuid id PK
        string email
        string full_name
        numeric daily_available_hours
        integer streak_count
    }

    SUBJECTS {
        uuid id PK
        uuid user_id FK
        string name
        date exam_date
        smallint target_score
    }

    TOPICS {
        uuid id PK
        uuid subject_id FK
        string name
        string difficulty
        numeric completion_percentage
    }

    STUDY_SESSIONS {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        integer duration_minutes
        smallint confidence_level
    }

    STUDY_PLANS {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        date plan_date
        numeric priority_score
        string status
    }

    QUIZZES {
        uuid id PK
        uuid topic_id FK
        string difficulty
        smallint question_count
    }

    QUIZ_QUESTIONS {
        uuid id PK
        uuid quiz_id FK
        text question
        jsonb options
        smallint correct_answer
    }

    QUIZ_ATTEMPTS {
        uuid id PK
        uuid user_id FK
        uuid quiz_id FK
        smallint score
        numeric percentage
    }

    QUIZ_ANSWERS {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        smallint selected_answer
        boolean is_correct
    }

    TOPIC_PERFORMANCE {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        numeric mastery_score
        string mastery_tier
    }
```

### 8.2 Relational Cardinality & Cascade Behavior

1. **User Identity Boundary (`auth.users` ➔ `profiles`):**
   * **Cardinality:** Strict $1 : 1$. When a student account is deleted in Supabase Auth, the cascading trigger permanently deletes their corresponding profile.
2. **Curriculum Hierarchy (`profiles` ➔ `subjects` ➔ `topics`):**
   * **Cardinality:** $1 : N$ (One student owns many subjects; one subject contains many topics).
   * **Integrity:** Deleting a subject automatically cascades and removes all associated topics, scheduled plans, and historical logs, preventing orphaned data records.
3. **Activity Logging (`study_sessions` & `study_plans`):**
   * **Cardinality:** A topic participates in $1 : N$ study sessions and $1 : N$ study plans. Both tables maintain denormalized foreign keys to `subject_id` and `user_id` to permit high-speed analytical aggregation without multi-table recursive joins.
4. **Assessment Subsystem (`topics` ➔ `quizzes` ➔ `quiz_questions`):**
   * **Cardinality:** A topic can have multiple generated quizzes ($1 : N$). Each quiz contains $N$ questions ($1 : N$).
   * **Attempt Isolation:** Student attempts are captured in `quiz_attempts` ($1 : N$ from profile), while individual response choices map $1 : N$ to `quiz_answers`.
5. **Mastery Tracking (`topic_performance`):**
   * **Cardinality:** Enforces a strict `UNIQUE(user_id, topic_id)` constraint. There is exactly one live mastery tracking state per student per topic.

---

# 9. Supabase Auth Architecture & Backend Verification

Authentication is managed via **Supabase Auth (GoTrue engine)** on the frontend, while the Node.js Express server operates as a **secure, stateless resource validator**.

```mermaid
sequenceDiagram
    autonumber
    actor Client as React Frontend
    participant SupaAuth as Supabase Auth Server
    participant Express as Node.js Backend API
    participant SupaDB as PostgreSQL DB

    Client->>SupaAuth: signInWithPassword(email, password)
    SupaAuth-->>Client: Returns Session { access_token (JWT), refresh_token, user }
    
    Note over Client, Express: Every authenticated request includes Bearer Token
    Client->>Express: GET /api/planner/today (Authorization: Bearer <access_token>)
    Express->>Express: authMiddleware: Extract Bearer Token
    Express->>SupaAuth: Verify JWT & fetch user context (supabase.auth.getUser)
    
    alt Token Invalid / Expired
        Express-->>Client: 401 Unauthorized { error: "TOKEN_EXPIRED_OR_INVALID" }
        Client->>SupaAuth: Refresh token exchange
    else Token Valid
        Express->>Express: Attach req.user = { id, email }
        Express->>SupaDB: Query records WHERE user_id = req.user.id
        SupaDB-->>Express: Return User Rows
        Express-->>Client: 200 OK { success: true, data: [...] }
    end
```

### 9.1 The Stateless Authentication Middleware (`authMiddleware.js`)
On every incoming protected request, the Express server validates the cryptographic signature of the Bearer JWT:

```javascript
// Conceptual Pattern: middleware/auth.middleware.js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Cryptographically verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token is invalid or has expired' }
      });
    }

    // Attach verified user identity to request object
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'AUTH_INTERNAL_ERROR', message: 'Authentication verification failed' }
    });
  }
};
```

### 9.2 Key Security Guarantees:
1. **Zero Client Trust:** The client cannot pass an arbitrary `userId` in request parameters or body to read or mutate another student's data. All database operations strictly bind to `req.user.id`.
2. **Automatic Expiry & Refresh:** JWT tokens have a short lifespan (1 hour). The React client utilizes Supabase's automatic refresh-token rotation to refresh expired tokens seamlessly in the background.

---

# 10. Supabase Row Level Security (RLS) Strategy

Row Level Security (RLS) guarantees **hardware-enforced data multi-tenancy** directly within the PostgreSQL engine. Even if an application controller suffers an injection or logic defect, PostgreSQL will physically prohibit reading, inserting, or mutating any row where the tenant identity does not match the active session.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROW LEVEL SECURITY MATRIX                       │
├──────────────────────┬─────────────────────────────────────────────────┤
│ Direct Ownership     │ profiles, subjects, study_sessions,             │
│                      │ study_plans, quiz_attempts, topic_performance,  │
│                      │ ai_interaction_logs, notifications              │
│                      │ ➔ Rule: user_id = auth.uid()                    │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Indirect Ownership   │ topics, quizzes, quiz_questions, quiz_answers   │
│                      │ ➔ Rule: Subquery joins parent entity to check   │
│                      │    parent.user_id = auth.uid()                  │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Admin Bypass         │ service_role key bypasses RLS for system crons  │
└──────────────────────┴─────────────────────────────────────────────────┘
```

### 10.1 Complete Production SQL RLS Policies

```sql
-- ============================================================================
-- AI STUDY PLANNER: COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all 12 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. PROFILES POLICIES (Direct: id = auth.uid())
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. SUBJECTS POLICIES (Direct: user_id = auth.uid())
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own subjects" 
ON public.subjects FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. TOPICS POLICIES (Indirect via subjects.user_id)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage topics of own subjects" 
ON public.topics FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.subjects s 
        WHERE s.id = topics.subject_id AND s.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.subjects s 
        WHERE s.id = topics.subject_id AND s.user_id = auth.uid()
    )
);

-- ----------------------------------------------------------------------------
-- 4. STUDY SESSIONS POLICIES (Direct: user_id = auth.uid())
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own study sessions" 
ON public.study_sessions FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. STUDY PLANS POLICIES (Direct: user_id = auth.uid())
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own study plans" 
ON public.study_plans FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. QUIZZES POLICIES (Indirect via topics -> subjects.user_id)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view quizzes of own topics" 
ON public.quizzes FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.topics t
        JOIN public.subjects s ON s.id = t.subject_id
        WHERE t.id = quizzes.topic_id AND s.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert quizzes for own topics" 
ON public.quizzes FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.topics t
        JOIN public.subjects s ON s.id = t.subject_id
        WHERE t.id = quizzes.topic_id AND s.user_id = auth.uid()
    )
);

-- ----------------------------------------------------------------------------
-- 7. QUIZ QUESTIONS POLICIES (Indirect via quizzes -> topics -> subjects)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view questions of own quizzes" 
ON public.quiz_questions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        JOIN public.topics t ON t.id = q.topic_id
        JOIN public.subjects s ON s.id = t.subject_id
        WHERE q.id = quiz_questions.quiz_id AND s.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert questions into own quizzes" 
ON public.quiz_questions FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        JOIN public.topics t ON t.id = q.topic_id
        JOIN public.subjects s ON s.id = t.subject_id
        WHERE q.id = quiz_questions.quiz_id AND s.user_id = auth.uid()
    )
);

-- ----------------------------------------------------------------------------
-- 8. QUIZ ATTEMPTS POLICIES (Direct: user_id = auth.uid())
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own quiz attempts" 
ON public.quiz_attempts FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 9. QUIZ ANSWERS POLICIES (Indirect via quiz_attempts.user_id)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own quiz answers" 
ON public.quiz_answers FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts qa 
        WHERE qa.id = quiz_answers.attempt_id AND qa.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts qa 
        WHERE qa.id = quiz_answers.attempt_id AND qa.user_id = auth.uid()
    )
);

-- ----------------------------------------------------------------------------
-- 10. TOPIC PERFORMANCE POLICIES (Direct: user_id = auth.uid())
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own topic performance" 
ON public.topic_performance FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 11. AI INTERACTION LOGS POLICIES (Direct: user_id = auth.uid())
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own AI interaction logs" 
ON public.ai_interaction_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI interaction logs" 
ON public.ai_interaction_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 12. NOTIFICATIONS POLICIES (Direct: user_id = auth.uid())
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own notifications" 
ON public.notifications FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
```

---

# 11. Backend Architecture (Node.js & Express Tier)

The backend follows an enterprise **Layered Service-Oriented Architecture**. Business logic is strictly decoupled from the HTTP transport layer, ensuring testability, maintainability, and clean separation of concerns.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS LAYERED PATTERN                         │
│                                                                        │
│   HTTP Request (Client JSON + Bearer JWT)                              │
│        ↓                                                               │
│   Security & Gateway Middlewares (CORS, Helmet, RateLimiter)           │
│        ↓                                                               │
│   Authentication Middleware (Supabase JWT Verification ➔ req.user)     │
│        ↓                                                               │
│   Input Validation Middleware (Zod Schemas ➔ 422 Unprocessable)        │
│        ↓                                                               │
│   Route Handlers (Express Router URL mapping)                          │
│        ↓                                                               │
│   Controllers (Extracts parameters, calls Service, sends HTTP status)  │
│        ↓                                                               │
│   Domain Services (Business logic, Algorithms, AI Client Orchestration)│
│        ↓                                                               │
│   Data Access Layer (Supabase PostgreSQL Client with RLS context)      │
└────────────────────────────────────────────────────────────────────────┘
```

### 11.1 Directory Structure & Architectural Roles

```
server/
├── config/
│   ├── env.js                 # Validates process.env via Zod at startup
│   ├── supabase.js            # Supabase Admin / Service-Role Client
│   └── gemini.js              # Google Generative AI SDK Client
├── controllers/
│   ├── auth.controller.js     # User registration, profile initialization
│   ├── subject.controller.js  # Subject & topic CRUD handlers
│   ├── study.controller.js    # Start, pause, complete session handlers
│   ├── planner.controller.js  # Schedule generation & slot updates
│   ├── quiz.controller.js     # Quiz generation & submission handlers
│   ├── analytics.controller.js# Study trends & progress metrics
│   └── ai.controller.js       # AI Tutor & natural language study logs
├── middleware/
│   ├── auth.middleware.js     # Validates Supabase JWT, attaches req.user
│   ├── validate.middleware.js # Generic Zod request schema validator
│   ├── rateLimiter.middleware.js # Express rate limiters for AI & Auth
│   └── error.middleware.js    # Centralized error handler & status mapper
├── routes/
│   ├── index.js               # Master API router mounting /api/v1/*
│   ├── auth.routes.js
│   ├── subject.routes.js
│   ├── study.routes.js
│   ├── planner.routes.js
│   ├── quiz.routes.js
│   ├── analytics.routes.js
│   └── ai.routes.js
├── services/
│   ├── profile.service.js     # User profile mutations & onboarding
│   ├── subject.service.js     # Course and syllabus queries
│   ├── topic.service.js       # Chapter management & completion math
│   ├── study.service.js       # Live stopwatch state & actual duration
│   ├── planner.engine.js      # Deterministic priority & slot allocation
│   ├── adaptive.engine.js     # Reactive re-planning state machine
│   ├── quiz.service.js        # Objective scoring & review calculation
│   ├── performance.service.js # Weighted topic mastery calculations
│   ├── analytics.service.js   # Timeseries study duration aggregations
│   └── gemini.service.js      # Isolated AI gateway with strict JSON schemas
└── validators/
    ├── subject.validator.js   # Zod schemas for subjects & topics
    ├── study.validator.js     # Zod schemas for session logging
    ├── planner.validator.js   # Zod schemas for timetable generation
    └── quiz.validator.js      # Zod schemas for quiz submissions
```

### 11.2 The Controller-Service Rule
1. **Controllers are dumb:** Controllers contain **zero mathematical logic, zero SQL queries, and zero AI prompts**. A controller merely:
   * Extracts input (`req.params`, `req.query`, `req.body`, `req.user.id`).
   * Calls the corresponding Service function.
   * Sends the standard HTTP response (`res.status(200).json({ success: true, data })`).
2. **Services are pure:** Services encapsulate **100% of the domain rules**:
   * Computing Priority Scores.
   * Evaluating quiz scores.
   * Handling database transactions across multiple tables.
   * Communicating with the Gemini AI gateway.

---

# 12. Frontend Architecture (React 18 + Vite)

The frontend is engineered as a responsive, high-performance Single Page Application (SPA) using React 18, Vite, Tailwind CSS, and Recharts.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT SPA ARCHITECTURE                          │
│                                                                        │
│   App.jsx (Router, Global Context Providers, Toast Container)          │
│        ↓                                                               │
│   Layout Shells: AuthLayout (Public) / AppLayout (Protected Shell)     │
│        ↓                                                               │
│   Context Layer: AuthContext, StudySessionContext, NotificationContext │
│        ↓                                                               │
│   Custom Hooks Layer: useAuth, useTimer, usePlanner, useQuiz           │
│        ↓                                                               │
│   Page Views: /dashboard, /planner, /study, /subjects, /quiz, etc.     │
│        ↓                                                               │
│   Reusable UI Components (Tailwind CSS Modals, Cards, Charts, Tables)  │
│        ↓                                                               │
│   Axios Service Client (Automatic Bearer Token Interceptor)            │
└────────────────────────────────────────────────────────────────────────┘
```

### 12.1 Directory Structure & Organization

```
client/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/                # Icons, sound effects (focus chime)
│   ├── components/
│   │   ├── common/            # Button, Input, Modal, Badge, Card, Spinner
│   │   ├── layout/            # Navbar, Sidebar, PageHeader, NotificationBell
│   │   ├── planner/           # DailyTimeline, WeeklyGrid, TaskCard, SlotBadge
│   │   ├── study/             # StopwatchTimer, SoundControls, ReflectionModal
│   │   ├── quiz/              # QuestionCard, OptionSelector, ScoreReview
│   │   ├── analytics/         # StudyBarChart, SubjectPieChart, TrendLine
│   │   └── tutor/             # ChatMessage, ContextDrawer, QuickPromptChips
│   ├── context/
│   │   ├── AuthContext.jsx    # Supabase session, user profile, login/logout
│   │   ├── StudyContext.jsx   # Active session timer (persists on page refresh)
│   │   └── ToastContext.jsx   # Interactive alert notifications
│   ├── hooks/
│   │   ├── useAuth.js         # Access authenticated user & profile
│   │   ├── useTimer.js        # Precision web-worker based stopwatch/timer
│   │   ├── usePlanner.js      # Fetch, generate, and adapt study plans
│   │   └── useQuiz.js         # Quiz state, answer recording, submission
│   ├── layouts/
│   │   ├── AuthLayout.jsx     # Minimalist centered shell for login/register
│   │   └── AppLayout.jsx      # Navigation sidebar, topbar, content container
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx  # Today's focus, streak, urgent exams, progress
│   │   ├── PlannerPage.jsx    # Daily & weekly timeline, adaptive alerts
│   │   ├── SubjectsPage.jsx   # Subject list, syllabus management
│   │   ├── SubjectDetailPage.jsx # Topics hierarchy, completion status
│   │   ├── StudyPage.jsx      # Distraction-free active focus mode
│   │   ├── QuizPage.jsx       # AI Quiz setup & interactive testing
│   │   ├── AnalyticsPage.jsx  # Recharts performance & study volume metrics
│   │   ├── AITutorPage.jsx    # Academic conversational tutor
│   │   └── ProfilePage.jsx    # Availability sliders, exam goals, settings
│   ├── services/
│   │   ├── api.js             # Configured Axios instance with JWT interceptor
│   │   ├── auth.service.js    # Supabase Auth SDK wrappers
│   │   ├── planner.service.js # Endpoints for study schedule
│   │   ├── study.service.js   # Session start/complete API calls
│   │   ├── quiz.service.js    # Quiz generation & submission calls
│   │   └── ai.service.js      # AI tutor & study log parser endpoints
│   ├── utils/
│   │   ├── timeFormatter.js   # Converts minutes to "Xh Ym", ISO dates
│   │   └── priorityColors.js  # Returns Tailwind classes based on score
│   ├── App.jsx                # Route definitions & protected route guards
│   ├── index.css              # Tailwind base, components, utilities
│   └── main.jsx               # React DOM entrypoint
```

### 12.2 Routing Strategy (`react-router-dom` v6)

| Path | Layout | Access | Description |
|---|---|---|---|
| `/login` | `AuthLayout` | Public | Email/Password login via Supabase Auth |
| `/register` | `AuthLayout` | Public | Student onboarding & initial study goal form |
| `/dashboard` | `AppLayout` | Protected | Daily overview, upcoming exams, active recommendations |
| `/planner` | `AppLayout` | Protected | Interactive daily timeline and weekly calendar views |
| `/subjects` | `AppLayout` | Protected | All registered subjects with countdown cards |
| `/subjects/:id` | `AppLayout` | Protected | Subject topics syllabus, difficulty breakdown |
| `/study` | `AppLayout` | Protected | Focus Mode timer, full-screen study tracker |
| `/quiz` | `AppLayout` | Protected | Instant AI Quiz generator and history list |
| `/quiz/:id` | `AppLayout` | Protected | Interactive quiz taker and detailed answer review |
| `/analytics` | `AppLayout` | Protected | Recharts charts: Planned vs Actual, Weak Topics |
| `/ai-tutor` | `AppLayout` | Protected | Topic-grounded conversational study assistant |
| `/profile` | `AppLayout` | Protected | Study hour capacity, preferred slots, target CGPA |

### 12.3 Global State Management (Context API vs Redux)
The application avoids the boilerplate of Redux by utilizing three focused React Contexts:
1. **`AuthContext`:** Manages the active Supabase Auth user, the access token, and the database profile record. Listens to `supabase.auth.onAuthStateChange`.
2. **`StudyContext`:** Manages the currently running study session. Uses `localStorage` persistence and a web worker timer so that if a student refreshes their browser or switches pages, their active study stopwatch does not lose tracked time.
3. **`ToastContext`:** Displays unified animated alert toasts (success, warnings, adaptive rescheduling notifications).

### 12.4 Axios Interceptor Pattern (`services/api.js`)
All HTTP requests to the Node.js backend automatically attach the active Supabase JWT:

```javascript
// services/api.js
import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor: Injects Supabase JWT
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response Interceptor: Uniform error handling & token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, attempt refresh or redirect to /login
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data?.error || error);
  }
);

export default api;
```

---

# 13. Complete REST API Specification

This section documents the exhaustive API contract for the AI Study Planner backend. Every endpoint conforms to standard REST conventions, returns uniform JSON envelopes, and enforces strict HTTP status codes.

### 13.1 Standard Response Envelopes

#### Success Response Envelope (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Error Response Envelope (`4xx`, `5xx`):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR",
    "message": "Human-readable explanation of error",
    "details": [ ... ]
  }
}
```

---

### 13.2 Endpoint Summary Catalog

| Method | Endpoint | Auth | Rate Limit | Purpose |
|---|---|---|---|---|
| `POST` | `/api/profile/init` | Bearer JWT | Standard | Initializes profile after Supabase registration |
| `GET` | `/api/profile/me` | Bearer JWT | Standard | Retrieves authenticated student's profile & settings |
| `PUT` | `/api/profile/me` | Bearer JWT | Standard | Updates study hours, preferred slots, target CGPA |
| `GET` | `/api/subjects` | Bearer JWT | Standard | Lists all subjects with exam countdowns & progress |
| `POST` | `/api/subjects` | Bearer JWT | Standard | Creates a new subject |
| `GET` | `/api/subjects/:id` | Bearer JWT | Standard | Gets subject details along with full topics syllabus |
| `DELETE` | `/api/subjects/:id` | Bearer JWT | Standard | Deletes subject and cascades associated data |
| `POST` | `/api/subjects/:id/topics`| Bearer JWT | Standard | Adds a new topic chapter under a subject |
| `PATCH` | `/api/topics/:id` | Bearer JWT | Standard | Updates topic status (`COMPLETED`, `NEEDS_REVISION`) |
| `POST` | `/api/study/start` | Bearer JWT | Standard | Starts live study stopwatch session |
| `POST` | `/api/study/:id/complete`| Bearer JWT | Standard | Completes study session with feedback & metrics |
| `GET` | `/api/study/active` | Bearer JWT | Standard | Checks if an active timer is running |
| `GET` | `/api/study/history` | Bearer JWT | Standard | Paginated history of past study sessions |
| `GET` | `/api/planner/today` | Bearer JWT | Standard | Fetches scheduled study slots for today |
| `GET` | `/api/planner/week` | Bearer JWT | Standard | Fetches 7-day scheduled study blocks |
| `POST` | `/api/planner/generate`| Bearer JWT | 10 / 15m | Triggers deterministic priority slot allocation |
| `PATCH` | `/api/planner/slots/:id/status`| Bearer JWT | Standard | Updates plan slot (`COMPLETED`, `SKIPPED`, `MISSED`)|
| `POST` | `/api/planner/slots/:id/reschedule`| Bearer JWT | Standard | Triggers adaptive engine to reallocate a slot |
| `POST` | `/api/quizzes/generate`| Bearer JWT | 5 / 10m | Generates 5-question AI quiz via Gemini |
| `GET` | `/api/quizzes/:id` | Bearer JWT | Standard | Fetches quiz questions (options only, no answers) |
| `POST` | `/api/quizzes/:id/submit`| Bearer JWT | Standard | Submits answers, scores quiz, updates mastery |
| `GET` | `/api/performance/topics`| Bearer JWT | Standard | Returns mastery tiers (Strong, Medium, Weak) |
| `GET` | `/api/analytics/overview`| Bearer JWT | Standard | Daily/weekly study hours, streak, completion % |
| `GET` | `/api/analytics/weekly-summary`| Bearer JWT | 3 / hr | Aggregated statistics + AI Mentor narrative |
| `POST` | `/api/ai/tutor` | Bearer JWT | 15 / 10m | Contextual AI tutoring scoped to subject/topic |
| `POST` | `/api/ai/parse-study-log`| Bearer JWT | 10 / 10m| Extracts structured data from natural language logs |
| `GET` | `/api/ai/recommendations`| Bearer JWT | 10 / 10m| Fetches personalized actionable study tips |

---

### 13.3 Detailed Endpoint Specifications

#### 1. Profile Initialization
* **Route:** `POST /api/profile/init`
* **Auth:** Required (`Bearer <access_token>`)
* **Request Body:**
```json
{
  "full_name": "Ritik Saini",
  "branch": "Computer Science & Engineering",
  "semester": 6,
  "target_cgpa": 8.50,
  "daily_available_hours": 4.00,
  "preferred_study_start_time": "18:00:00",
  "preferred_study_end_time": "23:00:00",
  "timezone": "Asia/Kolkata"
}
```
* **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "full_name": "Ritik Saini",
    "email": "ritik@example.com",
    "branch": "Computer Science & Engineering",
    "semester": 6,
    "target_cgpa": 8.50,
    "daily_available_hours": 4.00,
    "streak_count": 0,
    "created_at": "2026-09-25T12:00:00.000Z"
  }
}
```

---

#### 2. Create Subject
* **Route:** `POST /api/subjects`
* **Auth:** Required
* **Request Body:**
```json
{
  "name": "Database Management Systems",
  "description": "Relational algebra, SQL, Normalization, Transactions",
  "exam_date": "2026-11-20",
  "target_score": 90,
  "color": "#3B82F6",
  "icon": "database"
}
```
* **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "e4b52c03-51bf-4b0d-9b55-a83e0ef88f01",
    "name": "Database Management Systems",
    "exam_date": "2026-11-20",
    "target_score": 90,
    "color": "#3B82F6",
    "topics_count": 0,
    "syllabus_completion_percentage": 0.00
  }
}
```

---

#### 3. Add Topic under Subject
* **Route:** `POST /api/subjects/:id/topics`
* **Auth:** Required
* **Request Body:**
```json
{
  "name": "BCNF & Lossless Decomposition",
  "description": "Functional dependencies and 3NF vs BCNF comparison",
  "difficulty": "HARD",
  "estimated_minutes": 75
}
```
* **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "7f8b9a10-234c-412d-8a90-b1c2d3e4f5a6",
    "subject_id": "e4b52c03-51bf-4b0d-9b55-a83e0ef88f01",
    "name": "BCNF & Lossless Decomposition",
    "difficulty": "HARD",
    "estimated_minutes": 75,
    "status": "NOT_STARTED",
    "completion_percentage": 0.00
  }
}
```

---

#### 4. Start Live Study Session
* **Route:** `POST /api/study/start`
* **Auth:** Required
* **Request Body:**
```json
{
  "subject_id": "e4b52c03-51bf-4b0d-9b55-a83e0ef88f01",
  "topic_id": "7f8b9a10-234c-412d-8a90-b1c2d3e4f5a6",
  "planned_minutes": 60
}
```
* **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "sessionId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "subject_name": "Database Management Systems",
    "topic_name": "BCNF & Lossless Decomposition",
    "started_at": "2026-09-25T14:30:00.000Z",
    "status": "IN_PROGRESS"
  }
}
```

---

#### 5. Complete Study Session
* **Route:** `POST /api/study/:id/complete`
* **Auth:** Required
* **Request Body:**
```json
{
  "duration_minutes": 65,
  "confidence_level": 4,
  "difficulty_feedback": "MEDIUM",
  "notes": "Solved 4 decomposition questions. Clear on dependency preservation."
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "duration_minutes": 65,
      "status": "COMPLETED",
      "ended_at": "2026-09-25T15:35:00.000Z"
    },
    "topic": {
      "id": "7f8b9a10-234c-412d-8a90-b1c2d3e4f5a6",
      "completion_percentage": 86.67,
      "status": "IN_PROGRESS"
    },
    "streak_count": 5,
    "suggested_next_action": "QUIZ"
  }
}
```

---

#### 6. Generate Deterministic Study Plan
* **Route:** `POST /api/planner/generate`
* **Auth:** Required
* **Request Body:**
```json
{
  "target_date": "2026-10-01",
  "days_ahead": 7
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "total_slots_scheduled": 14,
    "daily_allocated_hours": 3.50,
    "schedule": [
      {
        "plan_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "date": "2026-10-01",
        "start_time": "18:00:00",
        "end_time": "19:15:00",
        "planned_minutes": 75,
        "subject_name": "Database Management Systems",
        "topic_name": "BCNF & Lossless Decomposition",
        "priority_score": 88.50,
        "reason": "Exam in 12 days + High Topic Difficulty",
        "source": "RULE_ENGINE",
        "status": "PENDING"
      }
    ]
  }
}
```

---

#### 7. Generate AI Quiz
* **Route:** `POST /api/quizzes/generate`
* **Auth:** Required
* **Rate Limit:** 5 requests / 10 minutes
* **Request Body:**
```json
{
  "topic_id": "7f8b9a10-234c-412d-8a90-b1c2d3e4f5a6",
  "question_count": 5,
  "difficulty": "MEDIUM"
}
```
* **Success Response (`201 Created`):**
*(Note: Correct answers and explanations are withheld until submission)*
```json
{
  "success": true,
  "data": {
    "quiz_id": "f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c",
    "topic_name": "BCNF & Lossless Decomposition",
    "difficulty": "MEDIUM",
    "question_count": 5,
    "questions": [
      {
        "id": "q1-uuid",
        "question": "Which of the following conditions is necessary for a relation R to be in Boyce-Codd Normal Form (BCNF)?",
        "options": [
          "Every determinant is a candidate key",
          "Every non-prime attribute is fully dependent on the primary key",
          "There are no multi-valued dependencies",
          "No attribute is transitively dependent on the primary key"
        ]
      }
    ]
  }
}
```

---

#### 8. Submit Quiz & Receive Detailed Evaluation
* **Route:** `POST /api/quizzes/:id/submit`
* **Auth:** Required
* **Request Body:**
```json
{
  "answers": [
    { "question_id": "q1-uuid", "selected_answer": 0 },
    { "question_id": "q2-uuid", "selected_answer": 1 },
    { "question_id": "q3-uuid", "selected_answer": 3 },
    { "question_id": "q4-uuid", "selected_answer": 2 },
    { "question_id": "q5-uuid", "selected_answer": 0 }
  ]
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "attempt_id": "att-1234-uuid",
    "score": 4,
    "total": 5,
    "percentage": 80.00,
    "mastery_tier": "STRONG",
    "review": [
      {
        "question_id": "q1-uuid",
        "question": "Which of the following conditions is necessary for a relation R to be in Boyce-Codd Normal Form (BCNF)?",
        "selected_answer": 0,
        "correct_answer": 0,
        "is_correct": true,
        "explanation": "A relation is in BCNF if and only if for every non-trivial functional dependency X -> Y, X is a superkey (candidate key)."
      }
    ]
  }
}
```

---

#### 9. Contextual AI Tutor Query
* **Route:** `POST /api/ai/tutor`
* **Auth:** Required
* **Rate Limit:** 15 requests / 10 minutes
* **Request Body:**
```json
{
  "topic_id": "7f8b9a10-234c-412d-8a90-b1c2d3e4f5a6",
  "message": "Can you give me a simple table example where 3NF holds but BCNF is violated?"
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "topic": "BCNF & Lossless Decomposition",
    "reply": "### 3NF vs BCNF: The Classic Professor-Student-Course Example\n\nConsider a relation `Teaching(Student, Course, Instructor)` where:\n1. A student takes a course taught by one instructor.\n2. Each instructor teaches only ONE course.\n3. Each course can be taught by MULTIPLE instructors.\n\n**Functional Dependencies (FDs):**\n* `(Student, Course) -> Instructor` (Candidate Key: `{Student, Course}`)\n* `Instructor -> Course`\n\n**Why it is in 3NF:**\nIn `Instructor -> Course`, `Course` is a prime attribute (part of candidate key `{Student, Course}`). Thus, 3NF is satisfied!\n\n**Why BCNF is Violated:**\nIn `Instructor -> Course`, `Instructor` is NOT a superkey. Therefore, BCNF is violated."
  }
}
```

---

#### 10. Natural Language Study Log Parser
* **Route:** `POST /api/ai/parse-study-log`
* **Auth:** Required
* **Rate Limit:** 10 requests / 10 minutes
* **Request Body:**
```json
{
  "log_text": "Aaj maine 90 minutes Operating Systems padha. Paging aur Virtual memory clear ho gaya lekin Page Fault handling me thoda confusion hai."
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "matched_subject": "Operating Systems",
    "subject_id": "e4b52c03-51bf-4b0d-9b55-a83e0ef88f01",
    "matched_topic": "Virtual Memory & Paging",
    "action_prompt": "Would you like to log this as a completed 90-minute session and schedule a 20-minute revision on Page Faults?"
  }
}
```

---

# 14. Deterministic Planner Engine Algorithm

The core study timetable generator is **100% deterministic**, reproducible, and mathematical. It guarantees that a student is never over-scheduled, subjects are well-balanced, and urgent deadlines are automatically prioritized without relying on unpredictable AI generation.

### 14.1 Priority Score Mathematical Model

Every pending topic $t$ across all active subjects is assigned a normalized **Priority Score** $P_t \in [0.00, 100.00]$:

$$P_t = \left( w_E \cdot E_t \right) + \left( w_W \cdot W_t \right) + \left( w_S \cdot S_t \right) + \left( w_D \cdot D_t \right) + \left( w_R \cdot R_t \right)$$

Where the weights satisfy $\sum w_i = 1.00$:
* $w_E = 0.30$ — **Exam Urgency Weight** (Most critical factor)
* $w_W = 0.25$ — **Topic Weakness Weight** (Historical struggle/low quiz scores)
* $w_S = 0.20$ — **Syllabus Completion Deficit Weight** (Unstudied syllabus)
* $w_D = 0.15$ — **Topic Inherent Difficulty Weight** (Cognitive complexity)
* $w_R = 0.10$ — **Spaced Repetition & Recency Weight** (Memory decay counter)

---

### 14.2 Sub-Component Mathematical Formulations

#### 1. Exam Urgency Function $E_t \in [10.00, 100.00]$
Let $d$ be the number of days remaining until the subject's final exam:
$$d = \max\left(0, \text{exam\_date} - \text{current\_date}\right)$$

$E_t$ is computed using a tiered urgency curve that accelerates exponentially as the exam approaches:

$$E_t = \begin{cases} 
100.00 & \text{if } d \le 2 \text{ days (Critical Exam Horizon)} \\
90.00 - (d - 2) \cdot 4.00 & \text{if } 2 < d \le 7 \text{ days (High Urgency: } [70.00, 90.00]\text{)} \\
70.00 - (d - 7) \cdot 2.50 & \text{if } 7 < d \le 15 \text{ days (Moderate Urgency: } [50.00, 70.00]\text{)} \\
50.00 - (d - 15) \cdot 1.50 & \text{if } 15 < d \le 30 \text{ days (Low Urgency: } [27.50, 50.00]\text{)} \\
\max\left(10.00, 27.50 - (d - 30) \cdot 0.25\right) & \text{if } d > 30 \text{ days (Baseline Pacing)}
\end{cases}$$

---

#### 2. Topic Weakness Function $W_t \in [0.00, 100.00]$
Weakness is derived from objective quiz history and student self-rated confidence:
* Let $Q_{latest}$ be the percentage on the most recent quiz ($0 - 100$).
* Let $Q_{hist}$ be the historical average percentage across all previous attempts.
* Let $C \in [1, 5]$ be the student's average self-rated confidence level.

If no quizzes have been attempted yet ($N_{attempts} = 0$):
$$W_t = \begin{cases} 
50.00 & \text{if } C \text{ is undefined} \\
100.00 - (C - 1) \cdot 25.00 & \text{if } C \text{ is recorded}
\end{cases}$$

When quiz attempts exist:
$$Q_{weighted} = \left(0.60 \cdot Q_{latest}\right) + \left(0.40 \cdot Q_{hist}\right)$$
$$W_t = 0.70 \cdot \left(100.00 - Q_{weighted}\right) + 0.30 \cdot \left(100.00 - (C - 1) \cdot 25.00\right)$$

*Example:* A student scoring $40\%$ on their latest quiz with confidence rating 2 ($C=2$) yields:
$Q_{weighted} = 40\%$, $W_t = 0.70(60) + 0.30(75) = 42 + 22.5 = \mathbf{64.50}$ (High Weakness).

---

#### 3. Syllabus Completion Deficit $S_t \in [0.00, 100.00]$
Directly reflects unstudied material for the topic:
$$S_t = 100.00 - \text{completion\_percentage}_t$$
If a topic is completely untouched ($0\%$), $S_t = 100.00$. If $75\%$ completed, $S_t = 25.00$.

---

#### 4. Topic Difficulty Metric $D_t \in [30.00, 100.00]$
Reflects inherent cognitive load assigned to the topic:
$$D_t = \begin{cases}
30.00 & \text{if difficulty is 'EASY'} \\
65.00 & \text{if difficulty is 'MEDIUM'} \\
100.00 & \text{if difficulty is 'HARD'}
\end{cases}$$

---

#### 5. Recency / Memory Decay Metric $R_t \in [0.00, 100.00]$
Calculates spaced-repetition necessity based on days elapsed since the topic was last studied ($\Delta t_{days}$):
$$R_t = \min\left(100.00, \Delta t_{days} \cdot 10.00\right)$$
If not studied for 10 or more days, $R_t = 100.00$.

---

### 14.3 Capacity Constraint & Slot Allocation Algorithm

Once every topic receives its Priority Score $P_t$, the planner allocates study slots into the daily calendar using a **Greedy Multi-Constraint Bin-Packing Algorithm**:

```
Algorithm: DeterministicSlotAllocation
Inputs:
  - User: daily_available_hours (H_daily), preferred_start (T_start), preferred_end (T_end)
  - Candidates: Array of all topics with status != 'COMPLETED', sorted by P_t DESC
  - DaysAhead: Number of days to plan (e.g. 7)

Output:
  - Array of scheduled StudyPlans matching daily capacity exactly.

Procedure:
1. For each day in range [today, today + DaysAhead - 1]:
     available_minutes = H_daily * 60
     current_slot_start = T_start
     scheduled_subjects_today = Set()

2.   For each topic in Candidates:
       If available_minutes < 30:
           Break to next day (Daily capacity saturated)

       // Prevent subject monotony: Max 2 consecutive slots per subject unless exam is <= 3 days
       If topic.subject_id in scheduled_subjects_today AND exam_days > 3:
           Continue to next candidate

       // Allocate slot duration (Default: 45 to 60 min blocks)
       slot_duration = min(topic.estimated_remaining_minutes, 60, available_minutes)
       slot_end = current_slot_start + slot_duration

       Create StudyPlan(
           date = current_day,
           start_time = current_slot_start,
           end_time = slot_end,
           planned_minutes = slot_duration,
           priority_score = topic.P_t,
           reason = FormatReason(topic),
           source = 'RULE_ENGINE'
       )

       available_minutes -= slot_duration
       current_slot_start = slot_end + 15 minutes (Pomodoro Rest Interval)
       scheduled_subjects_today.add(topic.subject_id)
```

---

# 15. Adaptive Planning Algorithm (The Feedback Loop)

The Adaptive Engine is the core differentiator of this system. Rather than leaving outdated tasks unattended, it acts as an **event-driven state machine** that monitors live study activity and dynamically recalibrates the future schedule.

### 15.1 Adaptive State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> PlannedSlot: Deterministic Engine creates slot

    PlannedSlot --> SessionStarted: Student clicks Start Study
    PlannedSlot --> MissedDetected: Due date passed & slot still PENDING

    SessionStarted --> SessionCompleted: Student finishes session
    SessionStarted --> Interrupted: Student cancels or abandons

    SessionCompleted --> CheckDuration: Evaluate actual vs planned minutes
    CheckDuration --> FullStudy: Duration >= 70%
    CheckDuration --> PartialStudy: Duration < 70%

    PartialStudy --> AdaptiveReschedule: Carryover remaining minutes to next slot
    MissedDetected --> AdaptiveReschedule: Re-queue with elevated Priority

    FullStudy --> TakeQuiz: Optional / Scheduled Quiz
    TakeQuiz --> HighScore: Score >= 80%
    TakeQuiz --> LowScore: Score < 50%
    TakeQuiz --> AverageScore: Score 50% - 79%

    LowScore --> FlagRevision: Mark topic NEEDS_REVISION (Weakness = 100)
    FlagRevision --> AdaptiveReschedule: Inject immediate Revision Slot in 24-48h

    HighScore --> MarkMastered: Mark COMPLETED (Weakness <= 20)
    MarkMastered --> SpacedRepetition: Schedule light review in 7 days

    AdaptiveReschedule --> [*]: Updated StudyPlans committed to DB
```

---

### 15.2 Five Reactive Adaptive Triggers

#### Trigger 1: Missed Study Session
* **Condition:** A scheduled study plan slot has `plan_date < CURRENT_DATE` and `status == 'PENDING'`.
* **State Mutation:**
  * Slot status is updated to `MISSED`.
  * Topic's priority urgency increases ($E_t$ increased by $15\%$).
* **Adaptive Action:**
  * Searches for the next available unfilled slot in the student's preferred window within 48 hours.
  * Reinserts a new `study_plans` record with `source = 'ADAPTIVE_ENGINE'` and `reason = 'Rescheduled: Previous session was missed'`.

---

#### Trigger 2: Partial Session Completion ($< 70\%$ Planned Duration)
* **Condition:** Student logs a study session where `duration_minutes < 0.70 * planned_minutes` (e.g. studied only 25 minutes of a 60-minute planned block).
* **State Mutation:**
  * Logs actual 25 minutes in `study_sessions`.
  * Computes $\Delta t_{remaining} = \text{planned\_minutes} - \text{duration\_minutes}$ (e.g. 35 minutes).
  * Increments `topics.completion_percentage` only by the partial ratio.
* **Adaptive Action:**
  * Automatically schedules a follow-up 35-minute completion block within the next 24–48 hours to complete the unfinished syllabus objectives.

---

#### Trigger 3: Poor Quiz Performance ($< 50\%$)
* **Condition:** Student completes a topic quiz and receives a score $< 50\%$.
* **State Mutation:**
  * `topic_performance.mastery_tier` is downgraded to `WEAK`.
  * `topics.status` is transitioned to `NEEDS_REVISION`.
  * Topic Weakness variable $W_t$ is elevated to $100.00$.
* **Adaptive Action:**
  * Overrides normal pacing: injects an **Emergency 45-minute Conceptual Revision Slot** within the next 48 hours.
  * The reason string is logged as: *"Adaptive Revision: Scored [X]% on recent quiz; review foundational concepts"*.

---

#### Trigger 4: High Mastery & Early Completion ($\ge 80\%$)
* **Condition:** Student achieves $\ge 80\%$ on quiz attempts and records high confidence ($C \ge 4$).
* **State Mutation:**
  * `topic_performance.mastery_tier` is upgraded to `STRONG`.
  * `topics.status` is set to `COMPLETED`.
  * $W_t$ is lowered to $10.00$.
* **Adaptive Action:**
  * Removes pending unstarted first-pass study slots for this topic.
  * Replaces them with the next pending high-priority topic in the syllabus.
  * Automatically inserts a low-intensity 30-minute **Spaced Repetition Slot** 7 days later to solidify retention.

---

#### Trigger 5: Approaching Exam Horizon Alert ($d \le 3\text{ Days}$)
* **Condition:** Any subject reaches an exam countdown $d \le 3$ days.
* **State Mutation:**
  * Puts planner into **"Crunch Mode"**.
* **Adaptive Action:**
  * Automatically pauses study slots for distant subjects ($d > 30$ days).
  * Reallocates $80\%$ of daily available hours exclusively to the urgent subject's `WEAK` and `NEEDS_REVISION` topics.
  * Generates high-yield practice quiz blocks.

---

# 16. Gemini AI Integration Architecture

Artificial Intelligence in this application is strictly designed as an **advisory and natural language parsing layer**. The AI does not manage the database, make scheduling decisions, or replace core business logic.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI ISOLATION BOUNDARY                           │
│                                                                        │
│   Client Request (Topic ID, Query)                                     │
│        ↓                                                               │
│   Node.js Backend (Verifies user, fetches sanitized academic context)   │
│        ↓                                                               │
│   PII Sanitization Gateway (Strips name, email, personal identifiers)  │
│        ↓                                                               │
│   Google Gemini API (Official SDK: gemini-1.5-flash)                   │
│        ↓                                                               │
│   Raw AI Output (JSON / Markdown String)                               │
│        ↓                                                               │
│   Zod Schema Validation Guardrail (Validates structure & types)        │
│        ↓                                                               │
│   Database Mutation (Only Node.js writes to PostgreSQL)                │
└────────────────────────────────────────────────────────────────────────┘
```

### 16.1 Strict Data Sanitization & Privacy Boundaries

To comply with data privacy best practices and prevent unnecessary token consumption:

| Data Category | Sent to Gemini? | Justification |
|---|---|---|
| Student Full Name & Email | ❌ **NEVER** | Zero pedagogical relevance; privacy violation. |
| User ID / UUIDs | ❌ **NEVER** | Internal database implementation detail. |
| Password Hashes / Auth Tokens | ❌ **NEVER** | Extreme security violation. |
| Subject Name & Topic Title | ✅ **YES** | Essential for contextual question answering & quizzes. |
| Topic Difficulty Level | ✅ **YES** | Allows Gemini to calibrate question complexity. |
| Aggregated Performance % | ✅ **YES** | Needed for personalized weekly strategy synthesis. |
| Raw Unstructured Study Notes | ✅ **YES** | Needed by Natural Language Parser to extract metrics. |

---

### 16.2 AI Resilience & Graceful Fallback Strategy

The core application must continue operating seamlessly when the Gemini API is rate-limited, experiencing latency spikes, or unreachable.

```mermaid
flowchart TD
    Req[AI Service Request: e.g. Quiz Generation] --> CallGemini[Call gemini-1.5-flash with Timeout: 8000ms]
    CallGemini --> CheckStatus{Success within 8s?}
    
    CheckStatus -- Yes --> ValidateJSON{Passes Zod Schema?}
    ValidateJSON -- Valid --> CommitDB[Save Quiz to PostgreSQL] --> ReturnClient[200 OK Return Quiz]
    
    CheckStatus -- No / Error --> CatchError[Catch API Error / Timeout]
    ValidateJSON -- Malformed --> CatchError
    
    CatchError --> LogIncident[Log incident to Server Logger]
    LogIncident --> TriggerFallback{Feature Type}
    
    TriggerFallback -- Quiz Generation --> FallbackQuiz[Return Pre-seeded Static Question Bank]
    TriggerFallback -- Planner / Scheduler --> FallbackPlan[Run 100% Deterministic Rule Engine]
    TriggerFallback -- AI Tutor --> FallbackTutor[Return 503 with friendly retry message]
    
    FallbackQuiz --> ReturnClient
    FallbackPlan --> ReturnClient
    FallbackTutor --> ReturnClient
```

1. **Timeout Protection:** Every external Gemini call is wrapped with an `AbortController` timeout of $8,000\text{ ms}$.
2. **Deterministic Planner Independence:** Generating a study timetable **never** requires Gemini. The rule engine runs in pure JavaScript using PostgreSQL queries.
3. **Static Question Bank Backup:** If the quiz generator fails, the backend falls back to a curated pool of standard foundational questions for common CS topics.
4. **Transparent Degradation:** If the AI Tutor is unreachable, the client displays an alert: *"AI Tutor is temporarily experiencing high traffic. Your study timer and schedule remain fully operational."*

---

# 17. AI Prompt Engineering & Strict Structured Schemas

To prevent hallucinations and guarantee type safety, all structured AI interactions utilize **Gemini's Structured Outputs (`responseSchema` & `responseMimeType: "application/json"`)**.

### 17.1 AI Quiz Generation Service

* **Endpoint:** `POST /api/quizzes/generate`
* **System Prompt:**
  ```text
  You are an expert university professor and examination author in Computer Science and Engineering.
  Your task is to generate high-quality, concept-testing multiple-choice questions for undergraduate students.

  Rules:
  1. Questions must test conceptual understanding, analysis, and problem-solving, NOT rote memorization.
  2. Exactly 4 distinct options must be provided for every question.
  3. Exactly one option must be unambiguously correct.
  4. Provide a detailed, pedagogical explanation justifying why the correct answer is right and why distractors are wrong.
  5. The difficulty must strictly match the requested level (EASY, MEDIUM, HARD).
  6. Return your response exclusively adhering to the requested JSON schema.
  ```
* **User Context Payload:**
  ```json
  {
    "subject": "Database Management Systems",
    "topic": "BCNF & Lossless Decomposition",
    "difficulty": "HARD",
    "question_count": 5
  }
  ```
* **Gemini JSON Schema Specification:**
  ```json
  {
    "type": "OBJECT",
    "properties": {
      "questions": {
        "type": "ARRAY",
        "items": {
          "type": "OBJECT",
          "properties": {
            "question": { "type": "STRING" },
            "options": {
              "type": "ARRAY",
              "items": { "type": "STRING" },
              "minItems": 4,
              "maxItems": 4
            },
            "correct_answer_index": { "type": "INTEGER", "description": "0-indexed integer (0 to 3)" },
            "explanation": { "type": "STRING" }
          },
          "required": ["question", "options", "correct_answer_index", "explanation"]
        }
      }
    },
    "required": ["questions"]
  }
  ```

---

### 17.2 Natural Language Study Log Parser

* **Endpoint:** `POST /api/ai/parse-study-log`
* **System Prompt:**
  ```text
  You are an intelligent study assistant for engineering students.
  Students will input informal, natural-language notes describing what they studied today (in English, Hindi, or Hinglish).
  Your task is to extract structured academic study metrics from their unstructured input.

  Matching Strategy:
  - Match their mention of subjects and topics against the provided list of registered subjects/topics.
  - If duration is mentioned in hours (e.g. '2 ghante'), convert it to integer minutes (120).
  - Infer confidence_level (1 to 5) and difficulty_feedback (EASY, MEDIUM, HARD) based on their sentiment.
  - Formulate an actionable, friendly next step recommendation.
  ```
* **User Context Payload:**
  ```json
  {
    "input_text": "Aaj maine 90 minutes Operating Systems padha. Paging aur Virtual memory clear ho gaya lekin Page Fault handling me thoda confusion hai.",
    "registered_subjects": [
      { "id": "sub-1", "name": "Operating Systems", "topics": ["Virtual Memory & Paging", "CPU Scheduling", "Deadlocks"] }
    ]
  }
  ```
* **Gemini JSON Schema Specification:**
  ```json
  {
    "type": "OBJECT",
    "properties": {
      "matched_subject_name": { "type": "STRING" },
      "matched_topic_name": { "type": "STRING" },
      "extracted_minutes": { "type": "INTEGER" },
      "confidence_level": { "type": "INTEGER", "description": "1 to 5 scale" },
      "difficulty_feedback": { "type": "STRING", "enum": ["EASY", "MEDIUM", "HARD"] },
      "notes": { "type": "STRING" },
      "action_prompt": { "type": "STRING" }
    },
    "required": ["matched_subject_name", "matched_topic_name", "extracted_minutes", "confidence_level", "difficulty_feedback", "notes", "action_prompt"]
  }
  ```

---

### 17.3 Weekly AI Academic Mentor Summary

* **Endpoint:** `GET /api/analytics/weekly-summary`
* **System Prompt:**
  ```text
  You are an empathetic, highly rigorous academic mentor for computer engineering students.
  Review the provided 7-day study metrics. Provide a motivational, constructive 3-paragraph summary:
  1. Celebrate specific achievements (hours studied, topics completed, streak).
  2. Offer critical, honest guidance on weak topics or missed sessions.
  3. Provide 2 concrete tactical study tips for the upcoming week based on their upcoming exam dates.
  Keep the tone encouraging, professional, and clear.
  ```
* **User Context Payload:**
  ```json
  {
    "total_hours_studied": 18.5,
    "planned_hours": 21.0,
    "completion_rate": 88.1,
    "active_streak_days": 6,
    "strongest_topics": ["SQL Queries (90%)", "CPU Scheduling (85%)"],
    "weakest_topics": ["BCNF Decomposition (40%)", "Transactions & Concurrency (48%)"],
    "upcoming_exams": [
      { "subject": "Database Management Systems", "days_left": 11 }
    ]
  }
  ```

---

# 21. Token & AI Cost Optimization Strategies

Uncontrolled LLM usage can rapidly cause API quota exhaustion and unsustainable operational expenses. The application implements **five strict engineering controls** to optimize token efficiency:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI COST CONTROL MATRIX                          │
├──────────────────────┬─────────────────────────────────────────────────┤
│ Rule 1: No Math in AI│ Arithmetic, countdowns, and priority scoring    │
│                      │ are calculated 100% deterministically in Node.  │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Rule 2: Model Choice │ Use gemini-1.5-flash by default (85% cheaper    │
│                      │ and 3x faster than Pro models).                 │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Rule 3: Strict Cache │ Cache weekly summaries (7 days) and static      │
│                      │ topic explanations in memory.                   │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Rule 4: Context Prune│ Never pass the entire database history in the   │
│                      │ prompt; send only the targeted topic and score. │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Rule 5: User Quotas  │ Express rate limiting caps abuse (Max 15 tutor  │
│                      │ queries / 10m, 5 quizzes / 10m per student).    │
└──────────────────────┴─────────────────────────────────────────────────┘
```

1. **Deterministic Pre-Filtering:** 
   Before any AI recommendation is generated, the Node.js backend filters candidate topics down to the top 3 high-priority items. Gemini never receives a raw list of 100 topics to sort.
2. **Weekly Summary Caching:** 
   A student's weekly summary is generated once on Sunday or upon explicit request and persisted in `ai_interaction_logs`. Subsequent views for that week read directly from the database, eliminating redundant LLM queries.
3. **Short System Prompts with Few-Shot Removal:**
   By leveraging Gemini's native `responseSchema`, verbose few-shot text examples are eliminated from prompts, reducing prompt token overhead by over $60\%$.
4. **Token Usage Telemetry:**
   Every call records `tokens_used` in the database `ai_interaction_logs` table, allowing real-time tracking of token consumption patterns per student and per endpoint.

---

# 18. Standardized Error Handling Architecture

The application enforces a **Centralized Error Handling Pipeline**. Uncaught exceptions never crash the server, database internal errors are never leaked to clients, and all HTTP errors return uniform JSON envelopes.

### 18.1 Centralized Error Middleware (`error.middleware.js`)

```javascript
// middleware/error.middleware.js
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.isOperational ? err.message : 'An unexpected internal error occurred';

  // Log error stack internally for debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: err.details || null
    }
  });
};
```

---

### 18.2 HTTP Status Code Matrix

| Status Code | Code Identifier | When Used | Example Scenario |
|---|---|---|---|
| `400` | `BAD_REQUEST` | Malformed request syntax or unparseable JSON | Malformed ISO date format in query params |
| `401` | `UNAUTHORIZED` | Missing, malformed, or expired Bearer JWT | Missing `Authorization: Bearer <token>` header |
| `403` | `FORBIDDEN` | Authenticated student lacks access to target resource | Student A attempts to delete Student B's subject |
| `404` | `NOT_FOUND` | Requested entity ID does not exist | Invalid `topic_id` passed to start study session |
| `409` | `CONFLICT` | Violates unique database constraint | Student attempts to register with already existing email |
| `422` | `UNPROCESSABLE_ENTITY` | Input validation failure (Zod schema rejection) | `daily_available_hours` is set to 25.0 (exceeds 16 max) |
| `429` | `RATE_LIMIT_EXCEEDED` | Exceeded endpoint rate limit quota | Student makes 20 AI tutor requests in 5 minutes |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected application crash or database drop | Uncaught JavaScript exception or Supabase connection timeout |
| `503` | `SERVICE_UNAVAILABLE` | External dependency down (Gemini API offline) | Gemini API timed out after 8s and fallback pool depleted |

---

# 19. Security Architecture & Hardening

Security is integrated from the ground up across all system layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DEFENSE-IN-DEPTH MATRIX                         │
├──────────────────────┬─────────────────────────────────────────────────┤
│ Transport Layer      │ Strict TLS / HTTPS, CORS Whitelist              │
├──────────────────────┼─────────────────────────────────────────────────┤
│ HTTP Gateway         │ Helmet Security Headers, Express Rate Limiter   │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Identity Layer       │ Supabase Auth JWTs, 1-Hour Expiry, Refresh Flow │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Application Layer    │ Zod Request Sanitization, Dumb Controllers      │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Database Engine      │ Hardware-Enforced PostgreSQL Row Level Security │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Artificial Intel.    │ Server-Only Key, Zero PII Sanitization Gateway  │
└──────────────────────┴─────────────────────────────────────────────────┘
```

### 19.1 Strict Secret Isolation
* **Client Environment (`client/.env`):**
  Contains only public, non-sensitive configuration:
  * `VITE_SUPABASE_URL` — Public Supabase project endpoint
  * `VITE_SUPABASE_ANON_KEY` — Public client key (safeguarded by RLS)
  * `VITE_API_URL` — Backend REST API URL
* **Server Environment (`server/.env`):**
  Contains high-privilege credentials that are **never bundled in client builds**:
  * `SUPABASE_SERVICE_ROLE_KEY` — Administrative database key
  * `GEMINI_API_KEY` — Private Google AI secret

### 19.2 Rate Limiting Policies
Implemented using `express-rate-limit`:
1. **General API Limiter:** $120\text{ requests / minute}$ per IP address.
2. **Auth & Profile Limiter:** $10\text{ requests / minute}$ per IP (prevents brute-force credential stuffing).
3. **AI Generation Limiter:** $15\text{ requests / 10 minutes}$ per user ID (prevents LLM quota exhaustion).

### 19.3 SQL Injection & XSS Immunity
* **No Raw SQL Strings:** All database queries are executed via the Supabase PostgREST client, which utilizes parameterized prepared statements, rendering SQL injection mathematically impossible.
* **XSS Sanitization:** All user notes and chat messages are sanitized before database storage and rendered safely through React's native JSX escaping.

---

# 20. Database Indexing & Performance Optimization

To ensure instantaneous sub-50ms query responses as study history accumulates over an entire semester, high-frequency query paths are reinforced with **PostgreSQL B-Tree Indexes**.

### 20.1 Index Specifications Script

```sql
-- ============================================================================
-- AI STUDY PLANNER: PRODUCTION PERFORMANCE INDEXES
-- ============================================================================

-- 1. Subject lookups by user
CREATE INDEX IF NOT EXISTS idx_subjects_user_id 
ON public.subjects (user_id);

-- 2. Topic lookups by subject and status
CREATE INDEX IF NOT EXISTS idx_topics_subject_id_status 
ON public.topics (subject_id, status);

-- 3. Study session history lookups by user and timestamp
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_started 
ON public.study_sessions (user_id, started_at DESC);

-- 4. Active session tracking
CREATE INDEX IF NOT EXISTS idx_study_sessions_active 
ON public.study_sessions (user_id, status) 
WHERE status = 'IN_PROGRESS';

-- 5. Timetable queries by user, date, and status (Hot query path for Planner)
CREATE INDEX IF NOT EXISTS idx_study_plans_user_date_status 
ON public.study_plans (user_id, plan_date, status);

-- 6. Quiz attempts lookup by user and quiz
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz 
ON public.quiz_attempts (user_id, quiz_id);

-- 7. Topic performance lookup by user and mastery tier (Hot path for weak topics)
CREATE INDEX IF NOT EXISTS idx_topic_performance_user_tier 
ON public.topic_performance (user_id, mastery_tier);

-- 8. Unread notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, is_read, scheduled_for DESC) 
WHERE is_read = FALSE;
```

### 20.2 Query Optimization Principles
1. **Selective Field Projection:** Every controller explicitly specifies needed fields (`.select('id, name, exam_date')`) instead of querying `SELECT *`.
2. **Paginated Historical Data:** Endpoints returning study sessions or quiz attempts enforce default pagination (`limit: 20, page: 1`) to prevent megabyte-sized JSON payloads.

---

# 22. Complete Project Directory Structure

```
ai-study-planner/
├── client/                                # React 18 + Vite Frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/                        # SVG icons, alert audio chimes
│   │   ├── components/
│   │   │   ├── common/                    # Button, Input, Modal, Badge, Card, Spinner
│   │   │   ├── layout/                    # Navbar, Sidebar, PageHeader, NotificationBell
│   │   │   ├── planner/                   # DailyTimeline, WeeklyGrid, TaskCard, RescheduleModal
│   │   │   ├── study/                     # StopwatchTimer, SoundControls, ReflectionModal
│   │   │   ├── quiz/                      # QuestionCard, OptionSelector, ScoreReviewModal
│   │   │   ├── analytics/                 # StudyBarChart, SubjectPieChart, TrendLine
│   │   │   └── tutor/                     # ChatMessage, TopicContextDrawer, PromptChips
│   │   ├── context/
│   │   │   ├── AuthContext.jsx            # Supabase session, profile, login/logout
│   │   │   ├── StudyContext.jsx           # Live timer state with web-worker persistence
│   │   │   └── ToastContext.jsx           # Animated alert toasts
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useTimer.js
│   │   │   ├── usePlanner.js
│   │   │   └── useQuiz.js
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx             # Minimalist shell for /login & /register
│   │   │   └── AppLayout.jsx              # Navigation sidebar, topbar, container
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── PlannerPage.jsx
│   │   │   ├── SubjectsPage.jsx
│   │   │   ├── SubjectDetailPage.jsx
│   │   │   ├── StudyPage.jsx
│   │   │   ├── QuizPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── AITutorPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── services/
│   │   │   ├── api.js                     # Axios instance + JWT interceptor
│   │   │   ├── auth.service.js
│   │   │   ├── planner.service.js
│   │   │   ├── study.service.js
│   │   │   ├── quiz.service.js
│   │   │   └── ai.service.js
│   │   ├── utils/
│   │   │   ├── timeFormatter.js
│   │   │   └── priorityColors.js
│   │   ├── App.jsx                        # Route definitions & protected guards
│   │   ├── index.css                      # Tailwind design tokens
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                                # Node.js + Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                     # Zod-validated process.env loader
│   │   │   ├── supabase.js                # Supabase Admin client
│   │   │   └── gemini.js                  # Google Generative AI client
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── subject.controller.js
│   │   │   ├── study.controller.js
│   │   │   ├── planner.controller.js
│   │   │   ├── quiz.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   └── ai.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js         # Supabase JWT verifier
│   │   │   ├── validate.middleware.js     # Zod payload validator
│   │   │   ├── rateLimiter.middleware.js  # Express rate limiters
│   │   │   └── error.middleware.js        # Global error catcher
│   │   ├── routes/
│   │   │   ├── index.js                   # Master router mounting /api/v1/*
│   │   │   ├── auth.routes.js
│   │   │   ├── subject.routes.js
│   │   │   ├── study.routes.js
│   │   │   ├── planner.routes.js
│   │   │   ├── quiz.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   └── ai.routes.js
│   │   ├── services/
│   │   │   ├── profile.service.js
│   │   │   ├── subject.service.js
│   │   │   ├── topic.service.js
│   │   │   ├── study.service.js
│   │   │   ├── planner.engine.js          # Deterministic priority engine
│   │   │   ├── adaptive.engine.js         # Event-driven rescheduling
│   │   │   ├── quiz.service.js            # Objective quiz scoring
│   │   │   ├── performance.service.js     # Topic mastery calculations
│   │   │   ├── analytics.service.js       # Timeseries aggregations
│   │   │   └── gemini.service.js          # AI gateway & JSON schemas
│   │   ├── validators/
│   │   │   ├── subject.validator.js
│   │   │   ├── study.validator.js
│   │   │   ├── planner.validator.js
│   │   │   └── quiz.validator.js
│   │   └── server.js                      # Express app listener & shutdown hooks
│   ├── .env.example
│   └── package.json
│
├── docs/                                  # Architectural documentation & Blueprints
│   └── PHASE_0_ARCHITECTURE_BLUEPRINT.md  # Single Source of Truth
└── README.md
```

---

# 23. Environment Variables Specification

### 23.1 Frontend (`client/.env.example`)
```bash
# =============================================================================
# AI STUDY PLANNER: CLIENT ENVIRONMENT CONFIGURATION
# Notice: Only public variables with VITE_ prefix are exposed to the browser.
# =============================================================================

# Public Supabase Project Endpoint
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Public Supabase Anon API Key (Restricted by PostgreSQL Row Level Security)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend Node.js Express REST API Base URL
VITE_API_URL=http://localhost:5000/api
```

---

### 23.2 Backend (`server/.env.example`)
```bash
# =============================================================================
# AI STUDY PLANNER: BACKEND SERVER CONFIGURATION
# WARNING: NEVER COMMIT THIS FILE OR SECRETS TO REPOSITORIES.
# =============================================================================

# Server Port & Runtime Environment
PORT=5000
NODE_ENV=development

# Allowed CORS Origin (Frontend SPA URL)
CLIENT_URL=http://localhost:5173

# Supabase Admin Configuration
SUPABASE_URL=https://your-project-id.supabase.co
# High-privilege key: Strictly kept on server to bypass RLS for administrative jobs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini AI Secret Key
# Obtained from Google AI Studio (Strictly isolated to backend AI Gateway)
GEMINI_API_KEY=AIzaSyD-your-secure-gemini-api-key-here
```

---

# 24. Implementation Roadmap (Phases 1–12)

The execution of this application is structured into twelve disciplined, sequential phases. Each phase builds upon the verified foundation of previous phases and enforces clear entry and exit criteria.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASES 1–12 ROADMAP                             │
│                                                                        │
│   Phase 1: Project Setup (Vite + React + Express + Supabase Client)    │
│        ↓                                                               │
│   Phase 2: Authentication & Student Profile Management                │
│        ↓                                                               │
│   Phase 3: Subjects & Topics Syllabus Hierarchy                        │
│        ↓                                                               │
│   Phase 4: Focus Mode & Live Study Session Stopwatch                   │
│        ↓                                                               │
│   Phase 5: Deterministic Priority & Rule-Based Timetable Engine        │
│   ────────── [ MILESTONE: PRODUCTION CORE MVP REACHED ] ────────────   │
│        ↓                                                               │
│   Phase 6: Gemini AI Gateway & Secure Integration                      │
│        ↓                                                               │
│   Phase 7: AI Quiz Generation & Objective Mastery Evaluation           │
│        ↓                                                               │
│   Phase 8: Adaptive Replanning & Event-Driven Rescheduling             │
│        ↓                                                               │
│   Phase 9: Analytics Dashboard (Recharts Visualizations)               │
│        ↓                                                               │
│   Phase 10: Contextual AI Tutor & Natural Language Study Log Parser    │
│        ↓                                                               │
│   Phase 11: Multi-Tier Testing, Security Audits & Optimization         │
│        ↓                                                               │
│   Phase 12: Production Deployment, CI/CD & Final Capstone Demo         │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Phase Specifications

* **Phase 1 — React + Node + Supabase Scaffolding:**
  * Initialize `client/` using Vite + React 18 + Tailwind CSS.
  * Initialize `server/` with Express.js, CORS, Helmet, dotenv.
  * Connect to Supabase Cloud; execute migration script for all 12 tables and RLS policies.
  * Verify client-to-server healthcheck (`GET /api/health`).
* **Phase 2 — Authentication & Profile Onboarding:**
  * Implement Supabase Auth email/password signup and login pages.
  * Build `AuthContext` on frontend and `authMiddleware` on backend.
  * Create profile onboarding flow to capture `daily_available_hours`, preferred time window, branch, and semester.
* **Phase 3 — Subjects & Syllabus Management:**
  * Build CRUD endpoints and UI for subjects (name, exam date, target marks, theme color).
  * Build topic hierarchy management (difficulty, estimated duration, status).
  * Implement exam countdown timers and syllabus completion percentage meters.
* **Phase 4 — Focus Mode & Live Study Session Tracking:**
  * Implement full-screen Focus Mode study room with web-worker stopwatch.
  * Add session start/pause/complete API endpoints.
  * Post-session reflection modal to collect actual minutes, difficulty feedback, and confidence ratings ($1 - 5$).
* **Phase 5 — Deterministic Rule-Based Planner Engine:**
  * Implement the Priority Score algorithm ($P_t = 0.30E + 0.25W + 0.20S + 0.15D + 0.10R$).
  * Implement the greedy bin-packing slot allocation adhering to daily capacity $H_{daily}$.
  * Render interactive Daily Timeline and Weekly Calendar views on the React frontend.
* **Phase 6 — Server-Side Gemini AI Gateway Integration:**
  * Setup `@google/genai` SDK on Node.js server.
  * Implement PII sanitization layer and timeout guardrails ($8,000\text{ ms}$).
  * Implement token usage logging in `ai_interaction_logs`.
* **Phase 7 — AI Quiz Engine & Weak Topic Detection:**
  * Implement `POST /api/quizzes/generate` using Gemini structured output schemas.
  * Build interactive Quiz UI with timed questions.
  * Implement deterministic answer evaluator and update `topic_performance` mastery tiers (`STRONG`, `MEDIUM`, `WEAK`).
* **Phase 8 — Adaptive Replanning Engine:**
  * Implement the reactive state machine listening for: Missed Sessions, Partial Duration ($<70\%$), and Low Quiz Scores ($<50\%$).
  * Automatically recalculate priorities and re-queue revision slots into upcoming calendar days.
  * Display adaptive notification banners on frontend.
* **Phase 9 — Analytics & Visual Progress Dashboard:**
  * Build Recharts analytics dashboard: Daily study duration bar charts, subject distribution pie chart, and quiz score timelines.
  * Implement study streak counter and weekly study volume comparisons.
* **Phase 10 — Contextual AI Tutor & Natural Language Study Log Parser:**
  * Implement topic-grounded conversational AI tutor drawer with prompt suggestions.
  * Implement Natural Language Study Log parser supporting English, Hindi, and Hinglish.
  * Weekly AI Academic Mentor summary cards.
* **Phase 11 — Comprehensive Testing & Performance Benchmarking:**
  * Write unit tests for Priority algorithms and adaptive state transitions.
  * Conduct integration testing with Supertest.
  * Run PostgreSQL indexing and EXPLAIN ANALYZE checks to guarantee sub-50ms queries.
* **Phase 12 — Production Deployment & Capstone Presentation:**
  * Deploy React client to Vercel/Netlify.
  * Deploy Node.js server to Render/Railway.
  * Setup production environment variables.
  * Conduct final end-to-end demo and generate Capstone project documentation.

---

# 25. Minimum Viable Product (MVP) Scope Definition

To ensure rapid delivery of a functional core application, the feature set is strictly demarcated into **Core MVP** and **Advanced AI Enhancements**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MVP FEATURE BOUNDARY                            │
├───────────────────────────────────┬────────────────────────────────────┤
│ CORE MVP (Phases 1–5)             │ ADVANCED AI LAYER (Phases 6–10)    │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Supabase Email Auth & Session   │ • Gemini AI Quiz Generation        │
│ • Student Profile & Availability  │ • Automated Weak Topic Detection   │
│ • Subjects & Exam Date Countdowns │ • Event-Driven Adaptive Reschedule │
│ • Syllabus Topics & Difficulty    │ • Contextual AI Chat Tutor         │
│ • Focus Mode Stopwatch Timer      │ • Multilingual Study Log Parser    │
│ • Deterministic Daily Timetable   │ • Weekly AI Mentor Strategy Cards  │
│ • Basic Completion Progress Meters│ • Recharts In-Depth Analytics      │
└───────────────────────────────────┴────────────────────────────────────┘
```

The Core MVP delivers a complete, production-ready study planning tool that operates 100% deterministically. If AI quotas or external API issues occur, the student experience remains intact and fully functional.

---

# 26. Multi-Tier Testing Strategy

The application undergoes verification across five dedicated testing tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TESTING PYRAMID                                 │
│                                                                        │
│                      /   Tier 5: E2E Smoke Tests   \                   │
│                     /───────────────────────────────\                  │
│                    /  Tier 4: Gemini Mock Resiliency \                 │
│                   /───────────────────────────────────\                │
│                  /    Tier 3: Supabase RLS Security    \               │
│                 /───────────────────────────────────────\              │
│                /     Tier 2: REST API Supertest Suites   \             │
│               /───────────────────────────────────────────\            │
│              /    Tier 1: Deterministic Engine Unit Tests  \           │
│             └───────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Tier 1: Deterministic Algorithm Unit Tests (Jest / Vitest)
* Test Priority Score bounds ($0.00 \le P_t \le 100.00$).
* Test Exam Urgency piecewise curve ($d = 0, 2, 7, 15, 45\text{ days}$).
* Test slot allocation: Verify total scheduled minutes never exceed `daily_available_hours * 60`.

### 2. Tier 2: REST API Integration Tests (Supertest)
* Validate request payload rejections ($422\text{ Unprocessable Entity}$ on negative durations).
* Validate unauthorized access without JWT ($401\text{ Unauthorized}$).
* Test subject and topic cascading deletions.

### 3. Tier 3: Supabase RLS Multi-Tenancy Security Tests
* Attempt to query Student B's topics using Student A's JWT: Verify zero rows returned.
* Attempt to update Student B's study plans using Student A's JWT: Verify update rejected.

### 4. Tier 4: Gemini AI Gateway Mocking & Resiliency Tests
* Mock Gemini API timeouts ($>8000\text{ms}$): Verify fallback to static quiz pool.
* Mock malformed/incomplete JSON from Gemini: Verify Zod schema interceptor catches error without server crash.

### 5. Tier 5: Frontend E2E / Smoke Tests
* Verify complete user journey: Register ➔ Add Subject ➔ Add Topic ➔ Generate Plan ➔ Complete 15-min Study Session ➔ View Dashboard Streak.

---

# 27. Technical Risk Analysis & Mitigation Matrix

| # | Technical Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|---|
| **R1** | **Gemini API Outage / High Latency** | High | Medium | Deterministic core runs with zero AI dependence. Calls timeout after 8s; quiz falls back to curated static question pool. |
| **R2** | **Malformed AI JSON Output** | High | Low | Native `responseSchema` forces strict JSON output. Server-side Zod validation verifies all fields before writing to PostgreSQL. |
| **R3** | **API Rate Limits Exceeded (429)** | Medium | Medium | Express rate-limiting per student IP/ID. Weekly AI summaries cached for 7 days in DB to eliminate redundant calls. |
| **R4** | **Student Over-Scheduling / Burnout** | High | Medium | Mathematical daily capacity cap strictly enforces $\sum \text{planned\_minutes} \le H_{daily} \times 60$ with mandatory Pomodoro breaks. |
| **R5** | **Timezone Drift in Timetables** | Medium | Low | All database timestamps stored in UTC (`TIMESTAMPTZ`). Student timezone stored in `profiles` and converted client-side using `date-fns`/Intl. |
| **R6** | **Database Cross-Tenant Data Leaks** | Critical | Very Low | Dual-layer security: Controllers verify `req.user.id` + PostgreSQL hardware-enforced Row Level Security (RLS) on all 12 tables. |
| **R7** | **Inconsistent Quiz Scoring** | High | Low | Objective evaluation is handled **100% deterministically on Node.js backend**; AI is never asked to score quiz answers. |

---

# 28. Final Architectural Commandments & Governance Rules

All future development phases (Phases 1 through 12) must strictly adhere to these sixteen non-negotiable architectural commandments:

1. **Deterministic Core Integrity:** Never use Gemini for date math, timers, countdowns, percentage scoring, or calendar slot bin-packing.
2. **AI Sandboxing:** Gemini must **never** connect directly to the database or execute database writes. All AI outputs must be validated by the Node.js backend before storage.
3. **Zero Secret Leakage:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must never exist in client-side code, git commits, or Vite builds.
4. **Hardware Multi-Tenancy:** Row Level Security (RLS) must remain enabled on all 12 PostgreSQL tables at all times.
5. **Dumb Controllers, Pure Services:** Route controllers must only parse requests and return HTTP status codes. All business logic belongs in domain services.
6. **Strict Input Validation:** All API inputs must be validated with Zod schemas before reaching service logic.
7. **Uniform Error Envelopes:** All endpoints must return standard JSON envelopes (`{ success: true, data }` or `{ success: false, error }`).
8. **Stateless API:** The Express server must remain completely stateless; user identity is derived exclusively from Supabase JWT verification.
9. **Capacity Safety:** The planner must physically never schedule more minutes than the student's declared `daily_available_hours`.
10. **Adaptive Feedback Loop:** The study timetable must never remain static; it must actively react to missed sessions, partial durations, and quiz failures.
11. **Graceful Degradation:** The application must remain 100% usable for scheduling and timer tracking even if the Gemini API is entirely offline.
12. **PII Sanitization:** Never transmit student names, emails, auth IDs, or personal notes to Google Gemini.
13. **Relational Integrity:** Foreign key constraints with `ON DELETE CASCADE` must be maintained to prevent orphaned database records.
14. **Token Cost Optimization:** Always prefer `gemini-1.5-flash` for high-frequency tasks and aggressively cache long-term summaries.
15. **Performance Standards:** Frequently queried fields must utilize B-Tree indexes to ensure API responses remain below 50ms.
16. **Incremental Phase Discipline:** Never jump ahead or build future phase features prematurely. Verify each phase before progressing.

---

### The Capstone Interview Master Statement

When presenting this project to university faculty, external examiners, or technical recruiters, the system architecture is described with complete technical fidelity as:

> *"The AI Study Planner combines rigorous deterministic software engineering with targeted Large Language Model capabilities. The Node.js and PostgreSQL backend deterministically governs authentication, relational data integrity, stopwatch session logging, capacity constraints, and mathematical priority calculations. Google Gemini is utilized strictly as an isolated advisory service for natural language study log extraction, contextual tutoring, and dynamic quiz authoring. The adaptive engine dynamically closes the feedback loop between student performance and schedule regeneration, ensuring the study plan continuously evolves based on actual study behavior rather than static calendar assumptions."*









