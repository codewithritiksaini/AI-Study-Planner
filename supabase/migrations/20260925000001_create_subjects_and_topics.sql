-- Migration: 20260925000001_create_subjects_and_topics.sql
-- Description: Create subjects and topics tables with constraints, indexes, cascade delete, and RLS

-- 1. Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exam_date DATE,
  target_score NUMERIC(5, 2) CHECK (target_score >= 0.00 AND target_score <= 100.00),
  color TEXT DEFAULT '#4f46e5',
  icon TEXT DEFAULT 'BookOpen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_subject_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Unique index to prevent duplicate subject names per user (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_user_name_unique
  ON public.subjects(user_id, lower(trim(name)));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_exam_date ON public.subjects(exam_date);

-- Trigger for subjects updated_at
DROP TRIGGER IF EXISTS set_subjects_updated_at ON public.subjects;
CREATE TRIGGER set_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  estimated_minutes INTEGER NOT NULL DEFAULT 60 CHECK (estimated_minutes > 0 AND estimated_minutes <= 1440),
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  completion_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (completion_percentage >= 0.00 AND completion_percentage <= 100.00),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_topic_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Unique index to prevent duplicate topic names within the same subject (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_subject_name_unique
  ON public.topics(subject_id, lower(trim(name)));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON public.topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_difficulty ON public.topics(difficulty);

-- Trigger for topics updated_at
DROP TRIGGER IF EXISTS set_topics_updated_at ON public.topics;
CREATE TRIGGER set_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Subjects
DROP POLICY IF EXISTS "Users can view own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can insert own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can update own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can delete own subjects" ON public.subjects;

CREATE POLICY "Users can view own subjects"
  ON public.subjects
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own subjects"
  ON public.subjects
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own subjects"
  ON public.subjects
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own subjects"
  ON public.subjects
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 5. RLS Policies for Topics (Scoped through parent subject ownership)
DROP POLICY IF EXISTS "Users can view topics of own subjects" ON public.topics;
DROP POLICY IF EXISTS "Users can insert topics into own subjects" ON public.topics;
DROP POLICY IF EXISTS "Users can update topics of own subjects" ON public.topics;
DROP POLICY IF EXISTS "Users can delete topics of own subjects" ON public.topics;

CREATE POLICY "Users can view topics of own subjects"
  ON public.topics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = topics.subject_id AND s.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert topics into own subjects"
  ON public.topics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = topics.subject_id AND s.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update topics of own subjects"
  ON public.topics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = topics.subject_id AND s.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = topics.subject_id AND s.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete topics of own subjects"
  ON public.topics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = topics.subject_id AND s.user_id = (SELECT auth.uid())
    )
  );

-- 6. Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT SELECT ON public.subjects TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO authenticated;
GRANT SELECT ON public.topics TO anon;
