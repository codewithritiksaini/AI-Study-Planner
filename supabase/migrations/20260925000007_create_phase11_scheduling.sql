-- ==============================================================================
-- Migration: 20260925000007_create_phase11_scheduling.sql
-- Description: Phase 11 Intelligent Adaptive Study Scheduling & Daily Plan Optimization.
--              Creates study_availability, blocked_periods, plan_generations,
--              topic_prerequisites, and extends study_plans with locking & generation metadata.
-- ==============================================================================

-- 1. Study Availability (Weekly recurring study windows)
CREATE TABLE IF NOT EXISTS public.study_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday ... 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_study_availability_window CHECK (end_time > start_time)
);

-- 2. Blocked Periods (Recurring or single-date blocked commitments)
CREATE TABLE IF NOT EXISTS public.blocked_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week SMALLINT NULL CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
    date DATE NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_blocked_periods_window CHECK (end_time > start_time),
    CONSTRAINT chk_blocked_periods_target CHECK (day_of_week IS NOT NULL OR date IS NOT NULL)
);

-- 3. Plan Generations (Snapshots of plan optimization runs)
CREATE TABLE IF NOT EXISTS public.plan_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    algorithm_version TEXT NOT NULL DEFAULT 'v1',
    total_planned_minutes INTEGER NOT NULL DEFAULT 0 CHECK (total_planned_minutes >= 0),
    available_minutes INTEGER NOT NULL DEFAULT 0 CHECK (available_minutes >= 0),
    overloaded BOOLEAN NOT NULL DEFAULT false,
    generation_metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Topic Prerequisites (Curriculum dependency graph)
CREATE TABLE IF NOT EXISTS public.topic_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    prerequisite_topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_prerequisite_distinct CHECK (topic_id <> prerequisite_topic_id),
    CONSTRAINT uq_topic_prerequisite UNIQUE (topic_id, prerequisite_topic_id)
);

-- 5. Extend public.study_plans with Phase 11 fields
ALTER TABLE public.study_plans
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS generation_id UUID NULL REFERENCES public.plan_generations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS plan_version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS custom_title TEXT NULL,
    ADD COLUMN IF NOT EXISTS task_source TEXT NOT NULL DEFAULT 'PLANNER';

-- Allow topic_id and subject_id to be nullable for custom/manual tasks
ALTER TABLE public.study_plans
    ALTER COLUMN topic_id DROP NOT NULL,
    ALTER COLUMN subject_id DROP NOT NULL;

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_study_availability_user_day 
    ON public.study_availability (user_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_blocked_periods_user_date 
    ON public.blocked_periods (user_id, date);

CREATE INDEX IF NOT EXISTS idx_blocked_periods_user_day 
    ON public.blocked_periods (user_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_plan_generations_user_created 
    ON public.plan_generations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_topic_prerequisites_topic 
    ON public.topic_prerequisites (topic_id);

CREATE INDEX IF NOT EXISTS idx_topic_prerequisites_prereq 
    ON public.topic_prerequisites (prerequisite_topic_id);

CREATE INDEX IF NOT EXISTS idx_study_plans_user_locked 
    ON public.study_plans (user_id, is_locked);

CREATE INDEX IF NOT EXISTS idx_study_plans_generation 
    ON public.study_plans (generation_id);

-- ==============================================================================
-- TRIGGERS FOR updated_at
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_study_availability_updated_at ON public.study_availability;
CREATE TRIGGER trg_study_availability_updated_at
    BEFORE UPDATE ON public.study_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_blocked_periods_updated_at ON public.blocked_periods;
CREATE TRIGGER trg_blocked_periods_updated_at
    BEFORE UPDATE ON public.blocked_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. study_availability
ALTER TABLE public.study_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS study_availability_select_own ON public.study_availability;
CREATE POLICY study_availability_select_own ON public.study_availability
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS study_availability_insert_own ON public.study_availability;
CREATE POLICY study_availability_insert_own ON public.study_availability
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS study_availability_update_own ON public.study_availability;
CREATE POLICY study_availability_update_own ON public.study_availability
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS study_availability_delete_own ON public.study_availability;
CREATE POLICY study_availability_delete_own ON public.study_availability
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- 2. blocked_periods
ALTER TABLE public.blocked_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blocked_periods_select_own ON public.blocked_periods;
CREATE POLICY blocked_periods_select_own ON public.blocked_periods
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS blocked_periods_insert_own ON public.blocked_periods;
CREATE POLICY blocked_periods_insert_own ON public.blocked_periods
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS blocked_periods_update_own ON public.blocked_periods;
CREATE POLICY blocked_periods_update_own ON public.blocked_periods
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS blocked_periods_delete_own ON public.blocked_periods;
CREATE POLICY blocked_periods_delete_own ON public.blocked_periods
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- 3. plan_generations
ALTER TABLE public.plan_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_generations_select_own ON public.plan_generations;
CREATE POLICY plan_generations_select_own ON public.plan_generations
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS plan_generations_insert_own ON public.plan_generations;
CREATE POLICY plan_generations_insert_own ON public.plan_generations
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS plan_generations_update_own ON public.plan_generations;
CREATE POLICY plan_generations_update_own ON public.plan_generations
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS plan_generations_delete_own ON public.plan_generations;
CREATE POLICY plan_generations_delete_own ON public.plan_generations
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- 4. topic_prerequisites
ALTER TABLE public.topic_prerequisites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS topic_prerequisites_select_own ON public.topic_prerequisites;
CREATE POLICY topic_prerequisites_select_own ON public.topic_prerequisites
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.topics t
        JOIN public.subjects s ON t.subject_id = s.id
        WHERE t.id = topic_prerequisites.topic_id AND s.user_id = (select auth.uid())
    ));

DROP POLICY IF EXISTS topic_prerequisites_insert_own ON public.topic_prerequisites;
CREATE POLICY topic_prerequisites_insert_own ON public.topic_prerequisites
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.topics t
        JOIN public.subjects s ON t.subject_id = s.id
        WHERE t.id = topic_prerequisites.topic_id AND s.user_id = (select auth.uid())
    ));

DROP POLICY IF EXISTS topic_prerequisites_delete_own ON public.topic_prerequisites;
CREATE POLICY topic_prerequisites_delete_own ON public.topic_prerequisites
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.topics t
        JOIN public.subjects s ON t.subject_id = s.id
        WHERE t.id = topic_prerequisites.topic_id AND s.user_id = (select auth.uid())
    ));
