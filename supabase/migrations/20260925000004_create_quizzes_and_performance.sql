-- ==============================================================================
-- Migration: 20260925000004_create_quizzes_and_performance.sql
-- Description: Creates tables for Phase 7: quizzes, quiz_questions, 
--              quiz_attempts, quiz_answers, and topic_performance with 
--              foreign keys, check constraints, indexes, triggers, and RLS.
-- ==============================================================================

-- ==============================================================================
-- 1. QUIZZES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    question_count INTEGER NOT NULL CHECK (question_count > 0),
    source TEXT NOT NULL DEFAULT 'AI' CHECK (source IN ('AI', 'MANUAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. QUIZ QUESTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'MCQ' CHECK (question_type IN ('MCQ')),
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
    question_order INTEGER NOT NULL DEFAULT 1 CHECK (question_order >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. QUIZ ATTEMPTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    score NUMERIC NOT NULL DEFAULT 0 CHECK (score >= 0),
    max_score NUMERIC NOT NULL DEFAULT 0 CHECK (max_score >= 0),
    percentage NUMERIC NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
    correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    incorrect_count INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
    unanswered_count INTEGER NOT NULL DEFAULT 0 CHECK (unanswered_count >= 0),
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- ==============================================================================
-- 4. QUIZ ANSWERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_earned NUMERIC NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

-- ==============================================================================
-- 5. TOPIC PERFORMANCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.topic_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
    correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
    average_percentage NUMERIC NOT NULL DEFAULT 0 CHECK (average_percentage >= 0 AND average_percentage <= 100),
    recent_percentage NUMERIC CHECK (recent_percentage IS NULL OR (recent_percentage >= 0 AND recent_percentage <= 100)),
    performance_level TEXT NOT NULL DEFAULT 'AVERAGE' CHECK (performance_level IN ('WEAK', 'NEEDS_PRACTICE', 'AVERAGE', 'STRONG')),
    confidence_score NUMERIC CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
    last_attempted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_topic_performance UNIQUE (user_id, topic_id)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Quizzes indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_user_topic ON public.quizzes(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(created_at DESC);

-- Quiz questions indexes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order ON public.quiz_questions(quiz_id, question_order);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_status ON public.quiz_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON public.quiz_attempts(created_at DESC);

-- Quiz answers indexes
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question ON public.quiz_answers(question_id);

-- Topic performance indexes
CREATE INDEX IF NOT EXISTS idx_topic_perf_user_topic ON public.topic_performance(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_perf_user_level ON public.topic_performance(user_id, performance_level);
CREATE INDEX IF NOT EXISTS idx_topic_perf_subject ON public.topic_performance(subject_id);

-- ==============================================================================
-- TRIGGERS FOR updated_at
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER trg_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_quiz_attempts_updated_at ON public.quiz_attempts;
CREATE TRIGGER trg_quiz_attempts_updated_at
    BEFORE UPDATE ON public.quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_topic_performance_updated_at ON public.topic_performance;
CREATE TRIGGER trg_topic_performance_updated_at
    BEFORE UPDATE ON public.topic_performance
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_performance ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. quizzes RLS policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS quizzes_select_own ON public.quizzes;
CREATE POLICY quizzes_select_own ON public.quizzes
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS quizzes_insert_own ON public.quizzes;
CREATE POLICY quizzes_insert_own ON public.quizzes
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS quizzes_update_own ON public.quizzes;
CREATE POLICY quizzes_update_own ON public.quizzes
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS quizzes_delete_own ON public.quizzes;
CREATE POLICY quizzes_delete_own ON public.quizzes
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 2. quiz_questions RLS policies (Enforced via parent quiz ownership)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS quiz_questions_select_own ON public.quiz_questions;
CREATE POLICY quiz_questions_select_own ON public.quiz_questions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_questions.quiz_id
            AND q.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS quiz_questions_insert_own ON public.quiz_questions;
CREATE POLICY quiz_questions_insert_own ON public.quiz_questions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_questions.quiz_id
            AND q.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS quiz_questions_update_own ON public.quiz_questions;
CREATE POLICY quiz_questions_update_own ON public.quiz_questions
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_questions.quiz_id
            AND q.user_id = (select auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_questions.quiz_id
            AND q.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS quiz_questions_delete_own ON public.quiz_questions;
CREATE POLICY quiz_questions_delete_own ON public.quiz_questions
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_questions.quiz_id
            AND q.user_id = (select auth.uid())
        )
    );

-- ------------------------------------------------------------------------------
-- 3. quiz_attempts RLS policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS quiz_attempts_select_own ON public.quiz_attempts;
CREATE POLICY quiz_attempts_select_own ON public.quiz_attempts
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS quiz_attempts_insert_own ON public.quiz_attempts;
CREATE POLICY quiz_attempts_insert_own ON public.quiz_attempts
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS quiz_attempts_update_own ON public.quiz_attempts;
CREATE POLICY quiz_attempts_update_own ON public.quiz_attempts
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS quiz_attempts_delete_own ON public.quiz_attempts;
CREATE POLICY quiz_attempts_delete_own ON public.quiz_attempts
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 4. quiz_answers RLS policies (Enforced via attempt parent ownership)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS quiz_answers_select_own ON public.quiz_answers;
CREATE POLICY quiz_answers_select_own ON public.quiz_answers
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts a
            WHERE a.id = quiz_answers.attempt_id
            AND a.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS quiz_answers_insert_own ON public.quiz_answers;
CREATE POLICY quiz_answers_insert_own ON public.quiz_answers
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts a
            WHERE a.id = quiz_answers.attempt_id
            AND a.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS quiz_answers_update_own ON public.quiz_answers;
CREATE POLICY quiz_answers_update_own ON public.quiz_answers
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts a
            WHERE a.id = quiz_answers.attempt_id
            AND a.user_id = (select auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts a
            WHERE a.id = quiz_answers.attempt_id
            AND a.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS quiz_answers_delete_own ON public.quiz_answers;
CREATE POLICY quiz_answers_delete_own ON public.quiz_answers
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts a
            WHERE a.id = quiz_answers.attempt_id
            AND a.user_id = (select auth.uid())
        )
    );

-- ------------------------------------------------------------------------------
-- 5. topic_performance RLS policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS topic_performance_select_own ON public.topic_performance;
CREATE POLICY topic_performance_select_own ON public.topic_performance
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS topic_performance_insert_own ON public.topic_performance;
CREATE POLICY topic_performance_insert_own ON public.topic_performance
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS topic_performance_update_own ON public.topic_performance;
CREATE POLICY topic_performance_update_own ON public.topic_performance
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS topic_performance_delete_own ON public.topic_performance;
CREATE POLICY topic_performance_delete_own ON public.topic_performance
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);
