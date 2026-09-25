import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  ArrowLeft, 
  Award, 
  Clock, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Calendar
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import PerformanceBadge from './PerformanceBadge.jsx';
import quizService from '../../services/quizzes.js';

export const QuizResultCard = ({
  result,
  quiz,
  onRetake,
  onBackToList,
  className = ''
}) => {
  const navigate = useNavigate();
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [aiExplanations, setAiExplanations] = useState({});
  const [loadingAi, setLoadingAi] = useState({});
  const [errorAi, setErrorAi] = useState({});

  if (!result) return null;

  const {
    score = 0,
    max_score = 0,
    percentage = 0,
    correct_count = 0,
    incorrect_count = 0,
    unanswered_count = 0,
    review = [],
    performance,
    quiz_id,
    attempt_id
  } = result;

  const targetQuizId = quiz_id || quiz?.id || result?.quiz_id;

  const toggleExpand = (qId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleFetchAiExplanation = async (q) => {
    const qId = q.question_id;
    if (aiExplanations[qId]) return;

    setLoadingAi(prev => ({ ...prev, [qId]: true }));
    setErrorAi(prev => ({ ...prev, [qId]: null }));

    try {
      const data = await quizService.explainQuestion(
        targetQuizId,
        qId,
        q.selected_answer
      );
      setAiExplanations(prev => ({
        ...prev,
        [qId]: data
      }));
    } catch (err) {
      console.error('Failed to fetch AI explanation:', err);
      setErrorAi(prev => ({
        ...prev,
        [qId]: err.response?.data?.message || 'Failed to generate explanation. Please try again.'
      }));
    } finally {
      setLoadingAi(prev => ({ ...prev, [qId]: false }));
    }
  };

  // Performance category styling based on percentage
  const getScoreTheme = (pct) => {
    if (pct >= 85) {
      return {
        badge: 'STRONG',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        message: 'Outstanding Mastery! You have a solid grasp of this topic.'
      };
    }
    if (pct >= 70) {
      return {
        badge: 'AVERAGE',
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        message: 'Good performance. A few concepts can be reinforced.'
      };
    }
    if (pct >= 50) {
      return {
        badge: 'NEEDS_PRACTICE',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        message: 'Needs Practice. Review the incorrect answers and try again.'
      };
    }
    return {
      badge: 'WEAK',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      message: 'Foundational Gaps Detected. Focus on core concepts before advancing.'
    };
  };

  const theme = getScoreTheme(percentage);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Score Summary Hero Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className={`p-6 sm:p-8 ${theme.bg} border-b ${theme.border}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quiz Completed
                </span>
                {performance?.level ? (
                  <PerformanceBadge level={performance.level} size="sm" />
                ) : (
                  <PerformanceBadge level={theme.badge} size="sm" />
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {quiz?.title || result?.quiz_title || 'Assessment Results'}
              </h1>
              <p className={`text-sm font-medium ${theme.color}`}>
                {theme.message}
              </p>
            </div>

            {/* Score Radial / Metric Circle */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border-2 border-slate-200 shadow-sm p-4">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {Math.round(percentage)}%
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase mt-0.5">
                  {score} / {max_score} Pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed KPI counters */}
        <CardContent className="p-4 sm:p-6 bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Correct</p>
                <p className="text-lg font-bold text-slate-900">{correct_count}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Incorrect</p>
                <p className="text-lg font-bold text-slate-900">{incorrect_count}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Unanswered</p>
                <p className="text-lg font-bold text-slate-900">{unanswered_count}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Attempts</p>
                <p className="text-lg font-bold text-slate-900">
                  {performance?.attempt_count || 1}
                </p>
              </div>
            </div>
          </div>

          {/* Phase 8 Adaptive Timetable Feedback Prompt */}
          <div className="mt-5 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">Topic Mastery Updated!</p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Recalibrate your study planner to adapt your future study sessions based on this score.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={Calendar}
              onClick={() => navigate('/planner')}
              className="shrink-0"
            >
              Update Study Plan
            </Button>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-100">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={onBackToList}
            >
              Back to Quizzes
            </Button>
            {onRetake && (
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={onRetake}
              >
                Retake Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Question-by-Question Review Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-900">
            Review Questions ({review.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click any question to view in-depth AI explanations
          </span>
        </div>

        {review.map((q, idx) => {
          const qId = q.question_id;
          const isCorrect = q.is_correct === true;
          const isUnanswered = !q.selected_answer || q.selected_answer.trim() === '';
          const isExpanded = expandedQuestions[qId] !== false; // Default expanded
          const aiData = aiExplanations[qId];
          const isAiLoading = loadingAi[qId];
          const aiErr = errorAi[qId];

          return (
            <Card 
              key={qId || idx}
              className={`border transition-all duration-200 ${
                isCorrect 
                  ? 'border-emerald-200 bg-white' 
                  : isUnanswered 
                    ? 'border-amber-200 bg-white'
                    : 'border-rose-200 bg-white'
              }`}
            >
              <CardHeader 
                className="cursor-pointer select-none py-3.5 px-4 sm:px-5 flex flex-row items-center justify-between"
                onClick={() => toggleExpand(qId)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isCorrect 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : isUnanswered
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-500 mr-2">
                      QUESTION {idx + 1}
                    </span>
                    <span className={`text-xs font-semibold ${
                      isCorrect 
                        ? 'text-emerald-700' 
                        : isUnanswered 
                          ? 'text-amber-700' 
                          : 'text-rose-700'
                    }`}>
                      {isCorrect ? 'Correct (+1 pt)' : isUnanswered ? 'Unanswered (0 pts)' : 'Incorrect (0 pts)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="px-4 sm:px-5 pb-5 pt-0 space-y-4">
                  {/* Question Text */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {q.question_text}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {Array.isArray(q.options) && q.options.map((option, optIdx) => {
                      const isStudentChoice = q.selected_answer?.trim().toLowerCase() === option?.trim().toLowerCase();
                      const isCorrectChoice = q.correct_answer?.trim().toLowerCase() === option?.trim().toLowerCase();

                      let optionStyle = 'border-slate-200 bg-white text-slate-700';
                      let label = null;

                      if (isCorrectChoice) {
                        optionStyle = 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-semibold';
                        label = (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 ml-auto">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                          </span>
                        );
                      } else if (isStudentChoice && !isCorrectChoice) {
                        optionStyle = 'border-rose-400 bg-rose-50/60 text-rose-900 font-semibold';
                        label = (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 ml-auto">
                            <XCircle className="w-3.5 h-3.5" /> Your Answer
                          </span>
                        );
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${optionStyle}`}
                        >
                          <span className="leading-snug">{option}</span>
                          {label}
                        </div>
                      );
                    })}
                  </div>

                  {/* Standard Explanation */}
                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-950">Explanation: </span>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}

                  {/* On-Demand AI Explanation Trigger / View */}
                  <div className="pt-2">
                    {!aiData ? (
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Sparkles}
                          loading={isAiLoading}
                          onClick={() => handleFetchAiExplanation(q)}
                          className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        >
                          {isAiLoading ? 'Analyzing with AI...' : 'Explain with AI'}
                        </Button>
                        {aiErr && (
                          <span className="text-xs text-rose-600">{aiErr}</span>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                              AI Conceptual Breakdown
                            </h4>
                          </div>
                          <Badge variant="purple" size="sm">Gemini AI</Badge>
                        </div>

                        {/* Why Correct / Conceptual Breakdown */}
                        {aiData.conceptual_breakdown && (
                          <div className="text-xs text-slate-800 leading-relaxed space-y-1">
                            <p className="font-bold text-slate-900">Concept Explanation:</p>
                            <p className="whitespace-pre-line">{aiData.conceptual_breakdown}</p>
                          </div>
                        )}

                        {/* Distractor Analysis */}
                        {aiData.distractor_analysis && (
                          <div className="text-xs text-slate-700 leading-relaxed space-y-1 bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="font-bold text-slate-900">Distractor & Option Analysis:</p>
                            <p className="whitespace-pre-line text-slate-600">{aiData.distractor_analysis}</p>
                          </div>
                        )}

                        {/* Key Takeaway */}
                        {aiData.key_takeaway && (
                          <div className="text-xs font-medium text-indigo-900 bg-indigo-100/60 p-2.5 rounded-lg border border-indigo-200">
                            <span className="font-bold">Key Takeaway: </span>
                            {aiData.key_takeaway}
                          </div>
                        )}

                        {/* Recommended Review Topics */}
                        {Array.isArray(aiData.recommended_review_topics) && aiData.recommended_review_topics.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-500">Related topics to review:</span>
                            {aiData.recommended_review_topics.map((t, tIdx) => (
                              <span 
                                key={tIdx} 
                                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white border border-slate-200 text-slate-700"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuizResultCard;
