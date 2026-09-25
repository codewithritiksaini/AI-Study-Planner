import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  XCircle,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { aiService } from '../../services/ai.js';
import Button from '../common/Button.jsx';

// Inline Markdown & Formatter for Stack Overflow / Technical Docs prose
const formatInlineText = (text) => {
  if (!text) return '';
  // match **bold** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-indigo-700 border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const renderMarkdownProse = (content) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="list-disc pl-5 space-y-1.5 my-3 text-slate-700 text-sm sm:text-[15px]"
        >
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3
          key={`h3-${index}`}
          className="text-base sm:text-lg font-bold text-slate-900 mt-6 mb-2"
        >
          {formatInlineText(trimmed.replace(/^###\s*/, ''))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2
          key={`h2-${index}`}
          className="text-lg sm:text-xl font-bold text-slate-900 mt-7 mb-3 border-b border-slate-200 pb-1.5"
        >
          {formatInlineText(trimmed.replace(/^##\s*/, ''))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1
          key={`h1-${index}`}
          className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-8 mb-3"
        >
          {formatInlineText(trimmed.replace(/^#\s*/, ''))}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.replace(/^[-*]\s*/, ''));
    } else {
      flushList();
      elements.push(
        <p
          key={`p-${index}`}
          className="text-sm sm:text-[15px] text-slate-700 leading-relaxed my-2.5 font-normal"
        >
          {formatInlineText(trimmed)}
        </p>
      );
    }
  });

  flushList();
  return elements;
};

export const AIStudyGuideCompanion = ({
  topicId,
  subjectId,
  topicName,
  subjectName,
  estimatedMinutes = 20,
  showTitle = true,
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
        setError('Study material could not be generated for this topic.');
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
  const correctCount =
    guide?.self_check_questions?.reduce((acc, q) => {
      return selectedAnswers[q.id] === q.correct_index ? acc + 1 : acc;
    }, 0) || 0;

  // ---------------------------------------------------------------------------
  // SKELETON LOADER (CLEAN STACK OVERFLOW READING STYLE)
  // ---------------------------------------------------------------------------
  if (loading && !guide) {
    return (
      <div className={`bg-white border border-slate-200 rounded-xl p-6 sm:p-10 max-w-4xl mx-auto space-y-6 animate-pulse ${className}`}>
        <div className="space-y-3 pb-4 border-b border-slate-200">
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-8 w-3/4 bg-slate-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-4 bg-slate-100 rounded w-4/6" />
        </div>
        <div className="h-36 bg-slate-100 rounded-lg mt-6" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR STATE
  // ---------------------------------------------------------------------------
  if (error && !guide) {
    return (
      <div className={`bg-white border border-rose-200 rounded-xl p-8 text-center max-w-xl mx-auto my-8 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2.5">
          <XCircle className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Topic Material Unavailable</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => loadGuide()}
          icon={RotateCw}
          className="mt-3 text-xs"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!guide) return null;

  const { time_budget, concept, worked_examples, worked_example, self_check_questions } = guide;
  const examplesList =
    Array.isArray(worked_examples) && worked_examples.length > 0
      ? worked_examples
      : worked_example
      ? [worked_example]
      : [];

  return (
    <article className={`bg-white border border-slate-200 rounded-xl p-6 sm:p-10 max-w-4xl mx-auto text-slate-800 font-sans leading-relaxed ${className}`}>
      
      {/* ========================================================================= */}
      {/* ARTICLE HEADER (PLAIN STACK OVERFLOW / MDN STYLE) */}
      {/* ========================================================================= */}
      {showTitle && (
        <header className="pb-4 mb-6 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            {guide.topic_name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2.5">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <Tag className="w-3 h-3 text-slate-400" />
              {guide.subject_name}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Est. Reading time: ~{time_budget?.total_minutes || estimatedMinutes} mins
            </span>
          </div>
        </header>
      )}

      {/* ========================================================================= */}
      {/* TOPIC EXPLANATION & THEORY (CONTINUOUS PLAIN READING FLOW) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Intuition Callout (Clean subtle blockquote like Stack Overflow / MDN) */}
        {concept?.one_liner_intuition && (
          <blockquote className="border-l-4 border-slate-300 bg-slate-50 pl-4 py-2.5 text-slate-700 italic text-sm sm:text-[15px] my-3">
            "{concept.one_liner_intuition}"
          </blockquote>
        )}

        {/* Key Rules / Principles in Plain Bullet Points */}
        {concept?.key_takeaways?.length > 0 && (
          <div className="my-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Key Principles & Rules:
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm sm:text-[15px] text-slate-700">
              {concept.key_takeaways.map((takeaway, idx) => (
                <li key={idx} className="leading-relaxed">
                  {formatInlineText(takeaway)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Prose / Markdown content parsed into clean text */}
        {concept?.explanation_markdown && (
          <div className="text-sm sm:text-[15px] text-slate-700 leading-relaxed font-normal">
            {renderMarkdownProse(concept.explanation_markdown)}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* WORKED EXAMPLES (PLAIN INLINE FLOW BELOW EXPLANATION) */}
      {/* ========================================================================= */}
      {examplesList.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-8">
          <h2 className="text-xl font-bold text-slate-900">
            Worked Examples
          </h2>

          <div className="space-y-8">
            {examplesList.map((example, exIdx) => (
              <div key={example.id || exIdx} className="space-y-3">
                
                {/* Example Subheading */}
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-indigo-600 font-mono text-sm">Example {exIdx + 1}:</span>
                  <span>{example.title || 'Standard Implementation'}</span>
                </h3>

                {/* Problem Statement in plain text */}
                {example.problem_statement && (
                  <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 font-medium">Problem: </strong>
                    {example.problem_statement}
                  </p>
                )}

                {/* Stack Overflow Clean Code Block */}
                {example.code_or_steps && (
                  <div className="relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden my-3">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-xs">
                      <span className="font-mono text-[11px] text-slate-500 font-medium">code</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(example.code_or_steps, exIdx)}
                        className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-0.5 px-2 rounded hover:bg-slate-200"
                        title="Copy snippet"
                      >
                        {copiedIndex === exIdx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 font-mono text-xs sm:text-sm text-slate-900 overflow-x-auto leading-relaxed bg-[#f6f8fa]">
                      <code>{example.code_or_steps}</code>
                    </pre>
                  </div>
                )}

                {/* Step-by-Step Breakdown in Plain Numbered List */}
                {example.step_by_step_explanation && example.step_by_step_explanation.length > 0 && (
                  <div className="pl-1 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Step-by-step breakdown:
                    </span>
                    <ol className="list-decimal pl-5 space-y-1 text-sm sm:text-[15px] text-slate-700">
                      {example.step_by_step_explanation.map((step, stepIdx) => (
                        <li key={stepIdx} className="leading-relaxed">
                          {formatInlineText(step)}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRACTICE QUESTIONS & SELF-CHECK (PLAIN FLOW AT THE BOTTOM) */}
      {/* ========================================================================= */}
      {self_check_questions?.length > 0 && (
        <div className="mt-10 pt-6 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Practice Questions
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Score: {correctCount} / {totalQuestions}
            </span>
          </div>

          <div className="space-y-6">
            {self_check_questions.map((q, qIndex) => {
              const selectedIdx = selectedAnswers[q.id];
              const isAnswered = selectedIdx !== undefined;
              const isCorrect = isAnswered && selectedIdx === q.correct_index;
              const isRevealed = revealedExplanations[q.id];

              return (
                <div key={q.id || qIndex} className="space-y-2.5 pb-5 border-b border-slate-100 last:border-b-0">
                  {/* Question Heading */}
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-900 text-sm sm:text-base font-mono shrink-0">
                      Q{qIndex + 1}.
                    </span>
                    <p className="font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                      {q.question}
                    </p>
                  </div>

                  {/* Clean Radio Options (Plain, Stack Overflow style) */}
                  <div className="space-y-1.5 pl-6 pt-1">
                    {q.options?.map((option, optIdx) => {
                      const isOptionSelected = selectedIdx === optIdx;
                      const isOptionCorrect = optIdx === q.correct_index;

                      let rowCls = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700';

                      if (isAnswered) {
                        if (isOptionSelected && isCorrect) {
                          rowCls = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold';
                        } else if (isOptionSelected && !isCorrect) {
                          rowCls = 'border-rose-400 bg-rose-50/70 text-rose-950 font-medium';
                        } else if (isOptionCorrect) {
                          rowCls = 'border-emerald-300 bg-emerald-50/30 text-emerald-900 font-medium';
                        } else {
                          rowCls = 'border-slate-200 text-slate-400 opacity-60';
                        }
                      }

                      return (
                        <label
                          key={optIdx}
                          onClick={() => !isAnswered && handleSelectOption(q.id, optIdx)}
                          className={`w-full flex items-center justify-between gap-3 p-2.5 px-3 rounded-lg border text-sm transition-all cursor-pointer select-none ${rowCls} ${
                            isAnswered ? 'cursor-default' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{option}</span>
                          </div>

                          {isAnswered && isOptionSelected && (
                            <span className="text-xs font-bold shrink-0">
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* Plain Solution Toggle */}
                  <div className="pl-6 pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExplanation(q.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>{isRevealed ? 'Hide Explanation' : 'View Explanation'}</span>
                      {isRevealed ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isRevealed && (
                      <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-normal">
                        <strong className="text-slate-900 block mb-0.5">
                          Correct Answer: Option {String.fromCharCode(65 + q.correct_index)}
                        </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {answeredCount === totalQuestions && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                You completed all questions ({correctCount}/{totalQuestions} correct).
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default AIStudyGuideCompanion;
