# AI Study Planner — Mathematical Scheduling & Rescheduling Engine Specification

> **Phase 12 Production Scheduler Documentation**  
> *Engine:* Deterministic Interval Arithmetic & Greedy Constraint Satisfaction (Node.js)  
> *Service Files:* `server/src/services/planner/slot.service.js`, `horizon.service.js`, `reschedule.service.js`  
> *Guarantee:* Zero slot overlaps, zero arithmetic hallucinations, mathematical capacity preservation

---

## 1. Mathematical Formalization

### 1.1 Time Interval Arithmetic
A study window is defined as a continuous time interval:

$$I = [t_{start}, t_{end}] \quad \text{where } t \in [0, 1439] \text{ (minutes from midnight)}$$

For any target calendar date $d$, the student defines a set of active base availability intervals:

$$\mathcal{A}_d = \bigcup_{i} [a_{i}^{start}, a_{i}^{end}]$$

The student may also have scheduled blackout windows (extracurriculars, lab exams) $\mathcal{B}_d$ and user-locked immutable study sessions $\mathcal{L}_d$:

$$\mathcal{B}_d = \bigcup_{j} [b_{j}^{start}, b_{j}^{end}], \quad \mathcal{L}_d = \bigcup_{k} [l_{k}^{start}, l_{k}^{end}]$$

The total busy interval set $\mathcal{O}_d$ is the union:

$$\mathcal{O}_d = \mathcal{B}_d \cup \mathcal{L}_d$$

The set of open, schedulable free study slots $\mathcal{F}_d$ is obtained via exact **interval subtraction**:

$$\mathcal{F}_d = \mathcal{A}_d \setminus \mathcal{O}_d$$

### 1.2 Constraint Filtering
Any interval $f \in \mathcal{F}_d$ is retained only if it satisfies the minimum cognitive duration threshold:

$$\text{duration}(f) = t_{end} - t_{start} \ge \tau_{min} \quad (\tau_{min} = 25 \text{ minutes})$$

A cognitive recovery break buffer $\beta$ ($10$ minutes) is automatically inserted between adjacent back-to-back study sessions.

---

## 2. Capacity Model & Fatigue Prevention

### 2.1 Daily Capacity Cap
To prevent student burnout, the total scheduled minutes on date $d$ cannot exceed the student's daily cognitive limit:

$$\sum_{s \in \mathcal{S}_d} \text{planned\_minutes}(s) \le C_{daily}^{max} \quad (C_{daily}^{max} = 180 \text{ minutes})$$

### 2.2 Shortfall & Overload Detection
If the sum of pending topic workloads $\sum W_i$ exceeds the total schedulable horizon capacity $\sum_{d=1}^{7} C_d$, the scheduler **does not invent phantom hours or compress sessions below $\tau_{min}$**. Instead, it generates a structured `shortfall_detected` alert:

$$\text{Shortfall Minutes} = \max\left(0, \sum W_{needed} - \sum C_{schedulable}\right)$$

Unscheduled topics are returned in an `unscheduled_topics` queue with actionable recommendations to expand weekly availability or prioritize top-tier exam topics.

---

## 3. Topic Prioritization & Queue Construction

Topics are ordered in a greedy priority queue based on their Phase 10 composite score:

$$\text{Priority} = 0.40 \cdot \text{ExamUrgency} + 0.30 \cdot \text{MasteryDeficit} + 0.20 \cdot \text{DAGDepth} + 0.10 \cdot \text{Inactivity}$$

### DAG Prerequisite Enforcement:
A topic $T$ cannot be scheduled if any of its prerequisites $P \in \text{Prereqs}(T)$ remain uncompleted. The scheduler traverses the dependency graph and schedules prerequisites in earlier time slots.

---

## 4. Non-Destructive Two-Phase Optimization

To ensure student trust and agency, schedule generation is strictly non-destructive:

```text
Step 1: Student Requests Optimization
    ↓
POST /api/planner/preview
    ↓
Calculates Ephemeral Horizon (Generation ID: uuid)
    ↓
Renders Diff Viewer in UI (Sessions, Breaks, Shortfall)
    ↓
Step 2: Student Reviews & Decides
    ├── Rejects / Closes Modal -> Zero Database Changes
    └── Clicks Commit -> POST /api/planner/apply
            ↓
Persists Slots to public.study_plans (Preserves Locked Sessions)
```

---

## 5. Adaptive Targeted Rescheduling (Missed Sessions)

When a student misses a planned session (e.g. session marked `MISSED` or expired):
1. **No Cascading Calendar Reshuffle:** The scheduler does **not** wipe or reorder the entire week. Reordering the entire calendar causes cognitive disorientation for the student.
2. **Targeted Insertion:** The rescheduling service searches sequentially through candidate dates $d \in [d_{today}, d_{today + 7}]$.
3. **Nearest Capacity Slot:** It finds the first day with remaining capacity $\ge \text{session duration}$ and an open free slot $\ge \text{session duration}$.
4. **Relocation & Audit:** The missed session is inserted into the new slot with `task_source = 'BACKLOG'`, and the original session record is preserved for academic analytics telemetry.
