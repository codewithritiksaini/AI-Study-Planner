-- ==============================================================================
-- Migration: 20260925000005_add_adaptive_planner_metadata.sql
-- Description: Adds adaptation_metadata JSONB to public.study_plans for Phase 8
--              adaptive signal explainability, and index for source-based queries.
-- ==============================================================================

-- 1. Add adaptation_metadata JSONB column if not exists
ALTER TABLE public.study_plans 
ADD COLUMN IF NOT EXISTS adaptation_metadata JSONB NULL;

-- 2. Index for filtering and updating plans by source (e.g. ADAPTIVE_ENGINE)
CREATE INDEX IF NOT EXISTS idx_study_plans_user_source 
ON public.study_plans (user_id, source);
