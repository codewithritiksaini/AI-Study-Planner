-- ==============================================================================
-- Migration: 20260925000002_create_study_sessions.sql
-- Description: Creates the study_sessions table with constraints, indexes, 
--              active-session unique constraint, updated_at trigger, and RLS.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' 
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'INTERRUPTED')),
    notes TEXT NULL,
    confidence_level INTEGER NULL 
        CHECK (confidence_level IS NULL OR (confidence_level BETWEEN 1 AND 5)),
    difficulty_feedback TEXT NULL 
        CHECK (difficulty_feedback IS NULL OR (difficulty_feedback IN ('EASY', 'MEDIUM', 'HARD'))),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_study_sessions_timestamps CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- ==============================================================================
-- INDEXES & CONSTRAINTS
-- ==============================================================================

-- Index for filtering by user and session status
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status 
    ON public.study_sessions (user_id, status);

-- Index for ordering history and today's session lookups
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_started 
    ON public.study_sessions (user_id, started_at DESC);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_id 
    ON public.study_sessions (subject_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_topic_id 
    ON public.study_sessions (topic_id);

-- Unbreakable architectural guarantee: Exactly 1 IN_PROGRESS session per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_user 
    ON public.study_sessions (user_id) 
    WHERE status = 'IN_PROGRESS';

-- ==============================================================================
-- TRIGGER FOR updated_at
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_study_sessions_updated_at ON public.study_sessions;
CREATE TRIGGER trg_study_sessions_updated_at
    BEFORE UPDATE ON public.study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Students can only read their own study sessions
DROP POLICY IF EXISTS study_sessions_select_own ON public.study_sessions;
CREATE POLICY study_sessions_select_own ON public.study_sessions
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 2. INSERT: Students can only insert sessions for themselves
DROP POLICY IF EXISTS study_sessions_insert_own ON public.study_sessions;
CREATE POLICY study_sessions_insert_own ON public.study_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

-- 3. UPDATE: Students can only update their own sessions
DROP POLICY IF EXISTS study_sessions_update_own ON public.study_sessions;
CREATE POLICY study_sessions_update_own ON public.study_sessions
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- 4. DELETE: Students can only delete their own sessions
DROP POLICY IF EXISTS study_sessions_delete_own ON public.study_sessions;
CREATE POLICY study_sessions_delete_own ON public.study_sessions
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);
