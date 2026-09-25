import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Select from '../common/Select.jsx';
import { subjectService } from '../../services/subjects.js';
import quizService from '../../services/quizzes.js';

export const QuizGeneratorForm = ({
  onQuizGenerated,
  initialSubjectId = '',
  initialTopicId = '',
  className = ''
}) => {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || '');
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId || '');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(5);

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Load student's enrolled subjects
  useEffect(() => {
    let isMounted = true;
    async function loadSubjects() {
      try {
        setLoadingSubjects(true);
        const data = await subjectService.getSubjects();
        if (isMounted) {
          setSubjects(data || []);
          if (data && data.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(data[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load enrolled subjects. Please refresh.');
        }
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    }
    loadSubjects();
    return () => { isMounted = false; };
  }, []);

  // Update selectedSubjectId if initialSubjectId prop changes
  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);

  // Load syllabus topics whenever selected subject changes
  useEffect(() => {
    let isMounted = true;
    async function loadTopics() {
      if (!selectedSubjectId) {
        setTopics([]);
        setSelectedTopicId('');
        return;
      }
      try {
        setLoadingTopics(true);
        const subjectDetails = await subjectService.getSubject(selectedSubjectId);
        if (isMounted) {
          const loadedTopics = subjectDetails?.topics || [];
          setTopics(loadedTopics);
          if (loadedTopics.length > 0) {
            // Keep initialTopicId if it belongs to this subject, otherwise pick first
            const hasInitial = loadedTopics.some(t => t.id === initialTopicId);
            setSelectedTopicId(hasInitial ? initialTopicId : loadedTopics[0].id);
          } else {
            setSelectedTopicId('');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load topics for subject:', err.message);
          setTopics([]);
        }
      } finally {
        if (isMounted) setLoadingTopics(false);
      }
    }
    loadTopics();
    return () => { isMounted = false; };
  }, [selectedSubjectId, initialTopicId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedTopicId) {
      setError('Please select both a subject and a topic to generate a quiz.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      
      // 1. Generate quiz with Gemini AI via backend
      const quiz = await quizService.generateQuiz({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        difficulty,
        questionCount: Number(questionCount)
      });

      // 2. Start attempt session
      const attempt = await quizService.startAttempt(quiz.id);

      // 3. Notify parent callback
      if (onQuizGenerated) {
        onQuizGenerated(quiz, attempt);
      }
    } catch (err) {
      console.error('Quiz generation error:', err);
      const msg = err.response?.data?.message || err.message || 'Quiz generation is temporarily unavailable.';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const subjectOptions = subjects.map(s => ({
    value: s.id,
    label: s.name
  }));

  const topicOptions = topics.map(t => ({
    value: t.id,
    label: `${t.name} (${t.difficulty || 'Medium'})`
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base text-slate-900">Configure AI Quiz</CardTitle>
            <p className="text-xs text-slate-500">Synthesize conceptual MCQs tailored to your syllabus</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Subject */}
          <Select
            label="Select Subject"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={loadingSubjects || generating}
            options={
              loadingSubjects
                ? [{ value: '', label: 'Loading enrolled subjects...' }]
                : subjectOptions.length > 0
                ? subjectOptions
                : [{ value: '', label: 'No enrolled subjects found' }]
            }
          />

          {/* Select Topic */}
          <Select
            label="Select Topic"
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            disabled={loadingTopics || generating || topics.length === 0}
            options={
              loadingTopics
                ? [{ value: '', label: 'Loading syllabus modules...' }]
                : topicOptions.length > 0
                ? topicOptions
                : [{ value: '', label: 'No topics found for this course' }]
            }
          />

          {/* Difficulty */}
          <Select
            label="Assessment Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={generating}
            options={[
              { value: 'EASY', label: 'Easy — Foundational Recall & Terminology' },
              { value: 'MEDIUM', label: 'Medium — Conceptual Application & Analysis' },
              { value: 'HARD', label: 'Hard — Deep Edge Cases & Technical Nuance' }
            ]}
          />

          {/* Number of Questions */}
          <Select
            label="Question Count"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            disabled={generating}
            options={[
              { value: 3, label: '3 Questions (Quick Knowledge Check ~ 3 mins)' },
              { value: 5, label: '5 Questions (Standard Chapter Quiz ~ 5 mins)' },
              { value: 8, label: '8 Questions (Comprehensive Review ~ 8 mins)' },
              { value: 10, label: '10 Questions (Intensive Mastery Test ~ 12 mins)' }
            ]}
          />

          <div className="pt-2">
            <Button
              type="submit"
              icon={generating ? RefreshCw : Sparkles}
              disabled={generating || !selectedSubjectId || !selectedTopicId || topics.length === 0}
              className="w-full justify-center"
            >
              {generating ? 'Synthesizing Quiz with Gemini...' : `Generate ${questionCount}-Question AI Quiz`}
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            * Generated questions are evaluated deterministically on the server. Answer keys remain strictly confidential until submission.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuizGeneratorForm;
