-- ============================================================================
-- Migration: 20260925000008_optimize_indexes_phase12.sql
-- Description: Phase 12 - Database Performance Optimization, Compound Indexes
--              and Query Hardening for High-Throughput Endpoints
-- ============================================================================

-- 1. Study Plans: Compound index for schedule retrieval and adaptive rescheduling
-- Optimizes queries filtering by user_id, status, and range/sorting on plan_date
CREATE INDEX IF NOT EXISTS idx_study_plans_user_status_date 
  ON public.study_plans (user_id, status, plan_date ASC);

-- 2. Study Sessions: Compound indexes for user session history and status filtering
-- Optimizes queries retrieving recent user study sessions and active timers
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_created 
  ON public.study_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status_created 
  ON public.study_sessions (user_id, status, created_at DESC);

-- 3. Recommendations: Compound index for active recommendation priority ranking
-- Optimizes recommendations dashboard and scheduler recommendation ingestion
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status_score 
  ON public.recommendations (user_id, status, priority_score DESC);

-- 4. Study Availability: Compound index for active availability slots by day of week
-- Optimizes capacity calculation during schedule generation
CREATE INDEX IF NOT EXISTS idx_study_availability_user_active_day 
  ON public.study_availability (user_id, is_active, day_of_week ASC);

-- 5. Blocked Periods: Compound index for user date and time windows
-- Optimizes capacity subtraction during slot arithmetic
CREATE INDEX IF NOT EXISTS idx_blocked_periods_user_date_window 
  ON public.blocked_periods (user_id, date, start_time, end_time);

-- 6. Quiz Attempts: Compound indexes for user attempts history and analytics
-- Optimizes analytics dashboard and quiz completion lookups
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_created 
  ON public.quiz_attempts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_status_created 
  ON public.quiz_attempts (user_id, status, created_at DESC);

-- 7. Topic Performance: Compound indexes for user mastery and subject grouping
-- Optimizes analytics dashboard and weak-topic detection in recommendation engine
CREATE INDEX IF NOT EXISTS idx_topic_performance_user_updated 
  ON public.topic_performance (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_topic_performance_user_subject 
  ON public.topic_performance (user_id, subject_id);

-- 8. Topics: Compound indexes for subject topic listing and ordered sequencing
-- Optimizes topic tree traversal and curriculum sequencing
CREATE INDEX IF NOT EXISTS idx_topics_subject_status 
  ON public.topics (subject_id, status);

CREATE INDEX IF NOT EXISTS idx_topics_subject_created 
  ON public.topics (subject_id, created_at ASC);
