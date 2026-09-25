-- ==============================================================================
-- Migration: 20260925000003_create_study_plans.sql
-- Description: Creates the study_plans table with constraints, indexes, 
--              updated_at trigger, and Row Level Security (RLS) policies.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    start_time TIMESTAMPTZ NULL,
    end_time TIMESTAMPTZ NULL,
    planned_minutes INTEGER NOT NULL CHECK (planned_minutes > 0),
    priority_score NUMERIC NOT NULL CHECK (priority_score >= 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED')),
    source TEXT NOT NULL DEFAULT 'RULE_ENGINE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_study_plans_time_window CHECK (start_time IS NULL OR end_time IS NULL OR end_time > start_time)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Primary query pattern: Get plans for a user on a specific date
CREATE INDEX IF NOT EXISTS idx_study_plans_user_date 
    ON public.study_plans (user_id, plan_date);

-- Filter by user and status (e.g. pending vs completed)
CREATE INDEX IF NOT EXISTS idx_study_plans_user_status 
    ON public.study_plans (user_id, status);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_study_plans_subject_id 
    ON public.study_plans (subject_id);

CREATE INDEX IF NOT EXISTS idx_study_plans_topic_id 
    ON public.study_plans (topic_id);

-- ==============================================================================
-- TRIGGER FOR updated_at
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_study_plans_updated_at ON public.study_plans;
CREATE TRIGGER trg_study_plans_updated_at
    BEFORE UPDATE ON public.study_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Students can only view their own study plans
DROP POLICY IF EXISTS study_plans_select_own ON public.study_plans;
CREATE POLICY study_plans_select_own ON public.study_plans
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 2. INSERT: Students can only create study plans for themselves
DROP POLICY IF EXISTS study_plans_insert_own ON public.study_plans;
CREATE POLICY study_plans_insert_own ON public.study_plans
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

-- 3. UPDATE: Students can only update their own study plans
DROP POLICY IF EXISTS study_plans_update_own ON public.study_plans;
CREATE POLICY study_plans_update_own ON public.study_plans
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- 4. DELETE: Students can only delete their own study plans
DROP POLICY IF EXISTS study_plans_delete_own ON public.study_plans;
CREATE POLICY study_plans_delete_own ON public.study_plans
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);
