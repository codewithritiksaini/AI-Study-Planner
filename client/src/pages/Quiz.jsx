import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Sparkles, 
  History, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import QuizGeneratorForm from '../components/quiz/QuizGeneratorForm.jsx';
import QuizLoadingCard from '../components/quiz/QuizLoadingCard.jsx';
import QuizTakingCard from '../components/quiz/QuizTakingCard.jsx';
import QuizResultCard from '../components/quiz/QuizResultCard.jsx';
import QuizHistoryTable from '../components/quiz/QuizHistoryTable.jsx';
import quizService from '../services/quizzes.js';

export const Quiz = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectedSubjectId = searchParams.get('subjectId');
  const preselectedTopicId = searchParams.get('topicId');
  const attemptIdParam = searchParams.get('attemptId');

  // Modes: 'PRACTICE' | 'TAKING' | 'RESULT' | 'HISTORY'
  const [activeTab, setActiveTab] = useState('PRACTICE');
  const [currentMode, setCurrentMode] = useState('PRACTICE');

  // Active quiz & attempt states
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [activeResult, setActiveResult] = useState(null);
  const [generatingMetadata, setGeneratingMetadata] = useState(null);

  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [loadingAttemptReview, setLoadingAttemptReview] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // If URL has attemptId param, load that review directly
  useEffect(() => {
    if (attemptIdParam) {
      loadAttemptReview(attemptIdParam);
    }
  }, [attemptIdParam]);

  const loadAttemptReview = async (attemptId) => {
    setLoadingAttemptReview(true);
    setGlobalError(null);
    try {
      const reviewData = await quizService.getAttemptReview(attemptId);
      setActiveResult(reviewData);
      setActiveQuiz({
        id: reviewData.quiz_id,
        title: reviewData.quiz_title,
        difficulty: reviewData.quiz_difficulty
      });
      setCurrentMode('RESULT');
    } catch (err) {
      console.error('Failed to load attempt review:', err);
      setGlobalError('Could not load quiz attempt review.');
    } finally {
      setLoadingAttemptReview(false);
    }
  };

  // Called when AI quiz generator finishes generating quiz & starting attempt
  const handleQuizGenerated = (quiz, attempt) => {
    setGeneratingMetadata(null);
    setActiveQuiz(quiz);
    const attemptId = attempt?.id || attempt?.attempt_id;
    setActiveAttemptId(attemptId);
    setActiveResult(null);
    setGlobalError(null);
    setCurrentMode('TAKING');
  };

  // Submits the attempt to the deterministic backend evaluation engine
  const handleSubmitAttempt = async (answers) => {
    let attemptId = activeAttemptId;
    if (!activeQuiz?.id) {
      setGlobalError('Quiz session not found. Please try generating a quiz.');
      return;
    }

    setSubmittingAttempt(true);
    setGlobalError(null);

    try {
      if (!attemptId) {
        console.warn('activeAttemptId was missing during submit; starting a fresh attempt session...');
        const newAttempt = await quizService.startAttempt(activeQuiz.id);
        attemptId = newAttempt?.id || newAttempt?.attempt_id;
        setActiveAttemptId(attemptId);
      }

      const resultData = await quizService.submitAttempt(
        activeQuiz.id,
        attemptId,
        answers
      );
      setActiveResult(resultData);
      setCurrentMode('RESULT');
      setHistoryRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to submit quiz attempt:', err);
      const msg = err.message || err.response?.data?.message || 'Failed to submit quiz. Please try again.';
      setGlobalError(msg);
    } finally {
      setSubmittingAttempt(false);
    }
  };

  // Starts a fresh attempt on the same quiz
  const handleRetakeQuiz = async () => {
    if (!activeQuiz?.id) {
      setCurrentMode('PRACTICE');
      return;
    }

    try {
      const newAttempt = await quizService.startAttempt(activeQuiz.id);
      const attemptId = newAttempt?.id || newAttempt?.attempt_id;
      setActiveAttemptId(attemptId);
      setActiveResult(null);
      setCurrentMode('TAKING');
    } catch (err) {
      console.error('Failed to start new attempt:', err);
      setGlobalError('Failed to retake quiz. Please try generating a new one.');
    }
  };

  const handleReviewAttempt = async (attemptId) => {
    await loadAttemptReview(attemptId);
  };

  const handleBackToList = () => {
    setCurrentMode('PRACTICE');
    setActiveQuiz(null);
    setActiveAttemptId(null);
    setActiveResult(null);
    setGlobalError(null);
    // Remove attemptId query param if present
    if (searchParams.has('attemptId')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('attemptId');
      setSearchParams(newParams);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="AI Quiz & Topic Mastery"
        subtitle="Challenge your conceptual understanding with AI-generated multiple-choice questions & on-demand pedagogical explanations."
        badge={
          <Badge variant="purple" size="sm">
            <Sparkles className="w-3 h-3 inline mr-1" />
            AI Powered
          </Badge>
        }
      />

      {globalError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{globalError}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setGlobalError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Navigation Tabs (Only visible when NOT actively taking or generating a quiz) */}
      {currentMode !== 'TAKING' && currentMode !== 'RESULT' && currentMode !== 'GENERATING' && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('PRACTICE')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
              activeTab === 'PRACTICE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Brain className="w-4 h-4" />
            Generate & Practice
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition-colors ${
              activeTab === 'HISTORY'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Quiz History
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 border-transparent text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Mastery Analytics
          </button>
        </div>
      )}

      {/* VIEW 0: FULL-PAGE QUIZ GENERATING ANIMATION (Same full-width layout as Taking MCQs) */}
      {currentMode === 'GENERATING' && generatingMetadata && (
        <QuizLoadingCard
          subjectName={generatingMetadata.subjectName}
          topicName={generatingMetadata.topicName}
          difficulty={generatingMetadata.difficulty}
          questionCount={generatingMetadata.questionCount}
        />
      )}

      {/* VIEW 1: ACTIVE QUIZ TAKING */}
      {currentMode === 'TAKING' && activeQuiz && (
        <QuizTakingCard
          quiz={activeQuiz}
          attemptId={activeAttemptId}
          onSubmitAttempt={handleSubmitAttempt}
          submitting={submittingAttempt}
        />
      )}

      {/* VIEW 2: QUIZ RESULT & DETAILED REVIEW */}
      {currentMode === 'RESULT' && activeResult && (
        <QuizResultCard
          result={activeResult}
          quiz={activeQuiz}
          onRetake={handleRetakeQuiz}
          onBackToList={handleBackToList}
        />
      )}

      {/* VIEW 3: PRACTICE GENERATOR TAB */}
      {currentMode === 'PRACTICE' && activeTab === 'PRACTICE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <QuizGeneratorForm
              onQuizGenerated={handleQuizGenerated}
              onGeneratingStart={(meta) => {
                setGeneratingMetadata(meta);
                setCurrentMode('GENERATING');
              }}
              onGeneratingError={(err) => {
                setGeneratingMetadata(null);
                setCurrentMode('PRACTICE');
                setGlobalError(err);
              }}
              initialSubjectId={preselectedSubjectId}
              initialTopicId={preselectedTopicId}
            />
          </div>

          {/* Right Column: Educational Feature Overview Card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">How AI Topic Mastery Works</h3>
                  <p className="text-xs text-slate-500">Conceptual recall, edge cases & instant grading</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <p className="text-xs font-bold text-slate-800">Syllabus-Aligned MCQs</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    AI synthesizes questions strictly from your subject syllabus topics.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <p className="text-xs font-bold text-slate-800">Secure Backend Grading</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Answer keys are hidden from the browser during taking and scored server-side.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  <p className="text-xs font-bold text-slate-800">Weak Topic Tracking</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Composite score recalculates topic mastery level (Weak, Needs Practice, Strong).
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Past Attempts Preview */}
            <QuizHistoryTable
              onReviewAttempt={handleReviewAttempt}
              onStartNewQuiz={() => setActiveTab('PRACTICE')}
              refreshTrigger={historyRefreshKey}
            />
          </div>
        </div>
      )}

      {/* VIEW 4: QUIZ HISTORY TAB */}
      {currentMode === 'PRACTICE' && activeTab === 'HISTORY' && (
        <QuizHistoryTable
          onReviewAttempt={handleReviewAttempt}
          onStartNewQuiz={() => setActiveTab('PRACTICE')}
          refreshTrigger={historyRefreshKey}
        />
      )}
    </div>
  );
};

export default Quiz;
