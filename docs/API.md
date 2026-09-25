# AI Study Planner — REST API Specification

> **Phase 12 Production API Documentation**  
> *Base URL:* `http://localhost:5000/api` (or configured `VITE_API_URL`)  
> *Authentication Scheme:* `Bearer <JWT_ACCESS_TOKEN>` in HTTP `Authorization` header.

---

## 1. System Health & Probes

### 1.1 Liveness Probe
- **Endpoint:** `GET /health` or `GET /api/health`
- **Auth:** None (Public)
- **Description:** Verifies that the HTTP gateway process is active and accepting connections.
- **Success Response (200 OK):**
```json
{
  "status": "ok",
  "service": "ai-study-planner-api",
  "timestamp": "2026-09-25T14:40:00.000Z",
  "uptime": 124.56,
  "node_version": "v20.18.0"
}
```

### 1.2 Readiness Probe
- **Endpoint:** `GET /health/ready` or `GET /api/health/ready`
- **Auth:** None (Public)
- **Description:** Deep health check testing PostgreSQL connection pool, query execution, latency, and memory consumption.
- **Success Response (200 OK):**
```json
{
  "status": "ok",
  "service": "ai-study-planner-api",
  "timestamp": "2026-09-25T14:40:00.000Z",
  "details": {
    "database": {
      "status": "connected",
      "latency_ms": 1,
      "pool": {
        "total_connections": 10,
        "idle_connections": 9,
        "waiting_clients": 0
      }
    },
    "memory": {
      "rss_mb": 64.21,
      "heap_used_mb": 38.15
    }
  }
}
```

---

## 2. Authentication

### 2.1 Student Registration
- **Endpoint:** `POST /api/auth/register`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "student@gmail.com",
  "password": "Student@123",
  "fullName": "Student User"
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "c969e36f-5861-4909-aabb-892d7f049cd6",
      "email": "student@gmail.com",
      "full_name": "Student User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.2 Student Login
- **Endpoint:** `POST /api/auth/login`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "student@gmail.com",
  "password": "Student@123"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c969e36f-5861-4909-aabb-892d7f049cd6",
      "email": "student@gmail.com",
      "full_name": "Student User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3. Subjects & Syllabus Topics

### 3.1 Get Enrolled Subjects
- **Endpoint:** `GET /api/subjects`
- **Auth:** Bearer Token
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "id": "18f0a2e7-0105-4c07-b244-6725ea0335e2",
        "name": "Operating Systems",
        "category": "CORE",
        "target_score": 90,
        "exam_date": "2026-10-08T18:30:00.000Z",
        "total_topics": 4,
        "completed_topics": 1
      }
    ]
  }
}
```

### 3.2 Get Subject Topics
- **Endpoint:** `GET /api/subjects/:id/topics`
- **Auth:** Bearer Token
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "a1b2c3d4-0001-4000-8000-000000000001",
        "subject_id": "18f0a2e7-0105-4c07-b244-6725ea0335e2",
        "title": "Process Synchronization & Semaphores",
        "difficulty_level": "HARD",
        "estimated_hours": 3.0,
        "mastery_score": 38.5,
        "status": "IN_PROGRESS"
      }
    ]
  }
}
```

---

## 4. Academic Analytics

### 4.1 Get Overview Telemetry
- **Endpoint:** `GET /api/analytics/overview`
- **Auth:** Bearer Token
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "avg_mastery": 64.2,
      "total_study_minutes": 275,
      "completed_sessions": 7,
      "active_streak_days": 4
    },
    "subject_performance": [],
    "recent_sessions": []
  }
}
```

---

## 5. Phase 10 Smart Recommendations Engine

### 5.1 Get Active Recommendations
- **Endpoint:** `GET /api/recommendations`
- **Auth:** Bearer Token
- **Query Parameters:**
  - `limit` (optional, default: 5): Max records to retrieve.
  - `priority` (optional): `HIGH` | `MEDIUM` | `LOW`.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "recommendations": [
    {
      "id": "rec-001-uuid",
      "title": "High Priority: Remediate TCP Congestion Control",
      "message": "Weak quiz score (35%) detected. Exam is in 27 days.",
      "score": 95.0,
      "priority": "HIGH",
      "status": "ACTIVE"
    }
  ]
}
```

### 5.2 Refresh Recommendations On-Demand
- **Endpoint:** `POST /api/recommendations/refresh`
- **Auth:** Bearer Token
- **Rate Limit:** 20 requests per minute
- **Success Response (200 OK):** Returns fresh array of dynamically computed recommendation records.

---

## 6. Phase 11 Intelligent Horizon Scheduler

### 6.1 Get Daily Schedule
- **Endpoint:** `GET /api/planner/daily`
- **Auth:** Bearer Token
- **Query Parameters:** `date` (YYYY-MM-DD, e.g. `2026-09-25`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "date": "2026-09-25",
    "capacity": {
      "available_minutes": 180,
      "planned_minutes": 90,
      "completed_minutes": 45,
      "remaining_capacity_minutes": 90
    },
    "sessions": []
  }
}
```

### 6.2 Get 7-Day Timetable Horizon
- **Endpoint:** `GET /api/planner/weekly`
- **Auth:** Bearer Token
- **Query Parameters:** `startDate` (YYYY-MM-DD)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "start_date": "2026-09-25",
    "days": [
      {
        "date": "2026-09-25",
        "day_of_week": 5,
        "available_minutes": 180,
        "planned_minutes": 90,
        "sessions": []
      }
    ]
  }
}
```

### 6.3 Non-Destructive Schedule Preview
- **Endpoint:** `POST /api/planner/preview`
- **Auth:** Bearer Token
- **Rate Limit:** 20 requests per minute
- **Request Body:**
```json
{
  "start_date": "2026-09-25",
  "days": 7,
  "preferred_session_minutes": 45,
  "max_daily_minutes": 180
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "generation_id": "412b1925-6867-4cf9-873a-5579febf4ff1",
    "start_date": "2026-09-25",
    "days": 7,
    "scheduled_sessions": [
      {
        "date": "2026-09-26",
        "start_time": "18:00",
        "end_time": "18:45",
        "planned_minutes": 45,
        "subject_name": "Operating Systems",
        "topic_title": "Process Synchronization & Semaphores",
        "priority_score": 88.0,
        "is_locked": false
      }
    ],
    "unscheduled_topics": [],
    "metrics": {
      "total_planned_minutes": 315,
      "slots_allocated": 7,
      "shortfall_detected": false
    }
  }
}
```

### 6.4 Apply & Persist Generated Plan
- **Endpoint:** `POST /api/planner/apply`
- **Auth:** Bearer Token
- **Rate Limit:** 20 requests per minute
- **Request Body:**
```json
{
  "generation_id": "412b1925-6867-4cf9-873a-5579febf4ff1",
  "preserve_locked": true
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions_created": 7,
    "generation_id": "412b1925-6867-4cf9-873a-5579febf4ff1",
    "message": "Study plan successfully persisted into your active calendar."
  }
}
```

### 6.5 Toggle Session Hard Lock
- **Endpoint:** `POST /api/planner/sessions/:id/lock`
- **Auth:** Bearer Token
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "7e211586-7fbc-4b92-ae2c-52f0407770f9",
    "is_locked": true,
    "message": "Session locked: Protected from automated rescheduling."
  }
}
```

### 6.6 Adaptive Targeted Rescheduling
- **Endpoint:** `POST /api/planner/sessions/:id/reschedule`
- **Auth:** Bearer Token
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "original_session_id": "7e211586-7fbc-4b92-ae2c-52f0407770f9",
    "rescheduled_session": {
      "id": "99b3ca12-1111-4444-8888-000000000000",
      "plan_date": "2026-09-26",
      "start_time": "2026-09-26T15:20:00.000Z",
      "end_time": "2026-09-26T16:05:00.000Z",
      "planned_minutes": 45,
      "status": "PENDING"
    },
    "message": "Missed session successfully rescheduled to nearest open slot."
  }
}
```

---

## 7. Isolated AI Coaching Subsystem

### 7.1 Ask AI Study Coach
- **Endpoint:** `POST /api/ai/ask`
- **Auth:** Bearer Token
- **Rate Limit:** 20 requests per minute
- **Request Body:**
```json
{
  "message": "How should I structure my revision for Database Management Systems Normalization?"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "answer": "Focus on the progression of functional dependencies: 1NF eliminates repeating groups, 2NF removes partial key dependencies, and 3NF/BCNF removes transitive dependencies...",
    "model": "gemini-2.5-flash",
    "source": "AI_COACH"
  }
}
```

---

## 8. Standardized Error Response Taxonomy

All non-2xx responses conform to the following schema:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format provided for start_date",
    "details": null
  }
}
```

### Error Code Reference:
| Error Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Malformed JSON body or invalid parameter type |
| `UNAUTHORIZED` | 401 | Missing or expired Bearer JWT token |
| `FORBIDDEN` | 403 | Attempted access to another student's record (IDOR) |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Unique constraint violation |
| `RATE_LIMIT_EXCEEDED` | 429 | IP address exceeded request allotment |
| `AI_SERVICE_UNAVAILABLE` | 503 | Gemini API timeout or quota exhaustion |
| `INTERNAL_ERROR` | 500 | Unhandled exception (sanitized in production) |
