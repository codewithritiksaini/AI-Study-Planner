import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  BookOpen,
  Code2,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RotateCw,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Flame,
  Layers,
  FileCode,
  Compass
} from 'lucide-react';
import { aiService } from '../../services/ai.js';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';

export const AIStudyGuideCompanion = ({
  topicId,
  subjectId,
  topicName,
  subjectName,
  estimatedMinutes = 20,
  className = ''
}) => {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedExplanations, setRevealedExplanations] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);

  // 1. Fetch study guide for the selected or active topic
  const loadGuide = useCallback(async () => {
    if (!topicId && !topicName) return;

    try {
      setLoading(true);
      setError(null);
      const data = await aiService.getTopicStudyGuide({
        topicId: topicId || null,
        subjectId: subjectId || null,
        estimatedMinutes: estimatedMinutes || 20
      });

      if (data) {
        setGuide(data);
        setSelectedAnswers({});
        setRevealedExplanations({});
      } else {
        setError('Study guide could not be generated for this topic.');
      }
    } catch (err) {
      console.error('Failed to load topic study guide:', err);
      setError(err?.message || 'Unable to connect to AI study companion');
    } finally {
      setLoading(false);
    }
  }, [topicId, topicName, subjectId, estimatedMinutes]);

  useEffect(() => {
    loadGuide();
  }, [loadGuide]);

  // Handle Copy Code Snippet
  const handleCopyCode = (text, index) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handle Question Answer Selection
  const handleSelectOption = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Toggle Explanation Accordion
  const toggleExplanation = (questionId) => {
    setRevealedExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Calculate practice score
  const totalQuestions = guide?.self_check_questions?.length || 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = guide?.self_check_questions?.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correct_index ? acc + 1 : acc;
  }, 0) || 0;

  // ---------------------------------------------------------------------------
  // SKELETON LOADER
  // ---------------------------------------------------------------------------
  if (loading && !guide) {
    return (
      <div className={`bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs animate-pulse space-y-6 ${className}`}>
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded-full" />
            <div className="h-6 w-64 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        </div>

        {/* Section 1 Skeleton */}
        <div className="space-y-3">
          <div className="h-20 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="h-16 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>

        {/* Section 2 Skeleton */}
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR STATE
  // ---------------------------------------------------------------------------
  if (error && !guide) {
    return (
      <div className={`bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Study Companion Unavailable</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => loadGuide()}
          icon={RotateCw}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!guide) return null;

  const { time_budget, concept, worked_examples, worked_example, self_check_questions } = guide;
  const examplesList = Array.isArray(worked_examples) && worked_examples.length > 0
    ? worked_examples
    : worked_example
    ? [worked_example]
    : [];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TIME CALIBRATION BAR */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Guided Study Room
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-500 font-medium">
                  {guide.subject_name}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {guide.topic_name}
              </h2>
            </div>
          </div>

          {/* Time Budget Breakdown Chips */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200/80 p-2 px-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pr-2 border-r border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>~{time_budget?.total_minutes || estimatedMinutes}m Total Budget</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 px-2.5 py-1 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
              📖 ~{time_budget?.theory_minutes || 8}m Concept
            </span>
            <span className="text-[11px] font-semibold text-slate-600 px-2.5 py-1 rounded-xl bg-white border border-slate-200/60 shadow-2xs">
              🔍 ~{time_budget?.example_minutes || 7}m Examples ({examplesList.length})
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100 shadow-2xs">
              🎯 ~{time_budget?.practice_minutes || 5}m Practice ({totalQuestions} Questions)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: 💡 CORE CONCEPT & INTUITION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Core Concept & Intuitive Mental Model
              </h3>
              <p className="text-xs text-slate-500">
                Understand the fundamental theory and invariants before looking at code.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
            Estimated ~{time_budget?.theory_minutes || 8} mins
          </span>
        </div>

        {/* Memorable 1-Liner Intuition Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              The "Big Picture" Intuition
            </h4>
            <p className="text-sm sm:text-base font-semibold text-slate-900 mt-1 leading-snug">
              "{concept?.one_liner_intuition}"
            </p>
          </div>
        </div>

        {/* Key Rules & Invariants Grid */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <span>Essential Invariants & Rules</span>
            <span className="text-[10px] text-slate-400 font-normal lowercase">(Read carefully)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {concept?.key_takeaways?.map((takeaway, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-indigo-200 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rule</span>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {takeaway}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* In-Depth Markdown Conceptual Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Conceptual Breakdown & Theory
          </h4>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
            {concept?.explanation_markdown}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: 🔍 WORKED EXAMPLES & DETAILED BREAKDOWN (MULTIPLE EXAMPLES) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                Worked Real-World Examples & Step-by-Step Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Walk through practical problem scenarios, annotated code, and reasoning steps.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
            Estimated ~{time_budget?.example_minutes || 7} mins
          </span>
        </div>

        {/* Multiple Examples List */}
        <div className="space-y-6">
          {examplesList.map((example, exIdx) => (
            <div
              key={example.id || exIdx}
              className="p-5 sm:p-6 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-5 shadow-2xs"
            >
              {/* Example Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase tracking-wider">
                    Example {exIdx + 1} of {examplesList.length}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {example.title || `Worked Scenario ${exIdx + 1}`}
                  </h4>
                </div>
              </div>

              {/* Problem Statement */}
              {example.problem_statement && (
                <div className="p-4 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Problem Scenario / Requirement:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                    {example.problem_statement}
                  </p>
                </div>
              )}

              {/* Annotated Code Block */}
              {example.code_or_steps && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 shadow-xs">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/60 text-xs">
                    <span className="font-mono text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Implementation / Algorithmic Execution
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(example.code_or_steps, exIdx)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-md hover:bg-slate-700/50"
                    >
                      {copiedIndex === exIdx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 sm:p-5 font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre">
                    <code>{example.code_or_steps}</code>
                  </pre>
                </div>
              )}

              {/* Step-by-Step Breakdown */}
              {example.step_by_step_explanation && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    Step-by-Step Reasoning:
                  </h5>
                  <div className="space-y-2">
                    {example.step_by_step_explanation.map((step, stepIdx) => (
                      <div
                        key={stepIdx}
                        className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-3 shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {stepIdx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: 🎯 PRACTICE QUIZ & ACTIVE RECALL ZONE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Practice Zone & Rapid Knowledge Check
              </h3>
              <p className="text-xs text-slate-500">
                Answer these calibrated self-check questions to verify and lock in your active recall.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score:</span>
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-100">
              {correctCount} / {totalQuestions} Correct
            </span>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-5">
          {self_check_questions?.map((q, qIndex) => {
            const selectedIdx = selectedAnswers[q.id];
            const isAnswered = selectedIdx !== undefined;
            const isCorrect = isAnswered && selectedIdx === q.correct_index;
            const isRevealed = revealedExplanations[q.id];

            return (
              <div
                key={q.id || qIndex}
                className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  isAnswered
                    ? isCorrect
                      ? 'bg-emerald-50/30 border-emerald-300'
                      : 'bg-rose-50/30 border-rose-300'
                    : 'bg-slate-50/60 border-slate-200 shadow-2xs'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700">
                      Question {qIndex + 1} of {totalQuestions}
                    </span>
                    {q.type && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        &bull; {q.type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {isAnswered && (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct!
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Incorrect
                        </>
                      )}
                    </span>
                  )}
                </div>

                <h5 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-4">
                  {q.question}
                </h5>

                {/* Options List */}
                <div className="space-y-2.5">
                  {q.options?.map((option, optIdx) => {
                    const isOptionSelected = selectedIdx === optIdx;
                    const isOptionCorrect = optIdx === q.correct_index;

                    let optionStyle = 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50';

                    if (isAnswered) {
                      if (isOptionSelected && isCorrect) {
                        optionStyle = 'bg-emerald-100/80 border-emerald-500 text-emerald-950 font-bold shadow-xs';
                      } else if (isOptionSelected && !isCorrect) {
                        optionStyle = 'bg-rose-100/80 border-rose-400 text-rose-950 font-semibold';
                      } else if (isOptionCorrect) {
                        optionStyle = 'bg-emerald-50/70 border-emerald-400 text-emerald-900 font-semibold';
                      } else {
                        optionStyle = 'bg-slate-100/60 border-slate-200/50 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{option}</span>
                        </div>

                        {isAnswered && isOptionSelected && (
                          <span>
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500" />
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Toggle & Content */}
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => toggleExplanation(q.id)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isRevealed ? 'Hide Detailed Solution & Takeaway' : 'Show Detailed Solution & Takeaway'}</span>
                    {isRevealed ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isRevealed && (
                    <div className="mt-3 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 leading-relaxed font-normal animate-in fade-in duration-150">
                      <span className="font-bold text-amber-900 uppercase tracking-wider block mb-1">
                        💡 Solution Breakdown:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Cheer Banner */}
        {answeredCount === totalQuestions && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h5 className="text-sm font-bold text-emerald-950">
                  Topic Practice Complete!
                </h5>
                <p className="text-xs text-emerald-800 mt-0.5">
                  You scored {correctCount} of {totalQuestions}. You are in the top flow state—click "Finish Session" above to save your verified study time and reflection!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStudyGuideCompanion;
