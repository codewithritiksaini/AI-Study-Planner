-- ==============================================================================
-- Migration: 20260925000006_create_recommendations_and_feedback.sql
-- Description: Creates the recommendations and recommendation_feedback tables
--              with constraints, indexes, updated_at trigger, and Row Level Security (RLS).
-- ==============================================================================

-- 1. Create recommendations table
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL 
        CHECK (type IN (
            'WEAK_TOPIC',
            'UNFINISHED_TOPIC',
            'EXAM_PREPARATION',
            'REVISION',
            'QUIZ_PRACTICE',
            'BACKLOG',
            'STUDY_BALANCE',
            'PLAN_ADJUSTMENT',
            'CONSISTENCY',
            'TOPIC_REVIEW',
            'SUBJECT_REVIEW'
        )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    priority_score NUMERIC(5,2) NOT NULL DEFAULT 0.00
        CHECK (priority_score >= 0),
    subject_id UUID NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    estimated_minutes INTEGER NOT NULL DEFAULT 30
        CHECK (estimated_minutes > 0),
    reason_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISMISSED', 'EXPIRED')),
    rule_version VARCHAR(20) NOT NULL DEFAULT 'v1',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create recommendation_feedback table
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback VARCHAR(20) NOT NULL 
        CHECK (feedback IN ('HELPFUL', 'NOT_HELPFUL', 'DISMISS', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_recommendation_feedback UNIQUE (user_id, recommendation_id, feedback)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Recommendations indexes for user query patterns
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status 
    ON public.recommendations (user_id, status);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_generated 
    ON public.recommendations (user_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_priority 
    ON public.recommendations (user_id, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_subject_id 
    ON public.recommendations (subject_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_topic_id 
    ON public.recommendations (topic_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_type 
    ON public.recommendations (user_id, type);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user 
    ON public.recommendation_feedback (user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_rec 
    ON public.recommendation_feedback (recommendation_id);

-- ==============================================================================
-- TRIGGER FOR updated_at
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_recommendations_updated_at ON public.recommendations;
CREATE TRIGGER trg_recommendations_updated_at
    BEFORE UPDATE ON public.recommendations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Recommendations RLS Policies
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.recommendations;
CREATE POLICY "Users can view own recommendations"
    ON public.recommendations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own recommendations" ON public.recommendations;
CREATE POLICY "Users can create own recommendations"
    ON public.recommendations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendations" ON public.recommendations;
CREATE POLICY "Users can update own recommendations"
    ON public.recommendations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recommendations" ON public.recommendations;
CREATE POLICY "Users can delete own recommendations"
    ON public.recommendations FOR DELETE
    USING (auth.uid() = user_id);

-- Recommendation Feedback RLS Policies
DROP POLICY IF EXISTS "Users can view own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Users can view own recommendation feedback"
    ON public.recommendation_feedback FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Users can insert own recommendation feedback"
    ON public.recommendation_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Users can update own recommendation feedback"
    ON public.recommendation_feedback FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recommendation feedback" ON public.recommendation_feedback;
CREATE POLICY "Users can delete own recommendation feedback"
    ON public.recommendation_feedback FOR DELETE
    USING (auth.uid() = user_id);
