import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Calendar,
  Clock,
  TrendingDown,
  Target
} from 'lucide-react';
import Badge from '../common/Badge.jsx';

/**
 * RecommendationReason
 *
 * Renders the verifiable factual basis behind a recommendation,
 * displaying deterministic metric pills and optional Gemini coach explanations.
 */
export const RecommendationReason = ({ recommendation, compact = false }) => {
  if (!recommendation) return null;

  const {
    reason,
    reason_details = {},
    ai_explanation,
    explanation_source,
    metrics_snapshot = {}
  } = recommendation;

  const metrics = reason_details.metrics || metrics_snapshot || {};
  const bullets = reason_details.reason_bullets || [];

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3 ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Primary Reason Headline */}
      <div className="flex items-start gap-2 text-slate-800">
        <Target className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <span className="font-semibold text-slate-900">{reason}</span>
      </div>

      {/* Verified Metric Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {metrics.quiz_accuracy_pct !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <TrendingDown className="w-3 h-3" />
            Accuracy: {Math.round(metrics.quiz_accuracy_pct)}%
          </span>
        )}
        {metrics.completion_pct !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            Progress: {Math.round(metrics.completion_pct)}%
          </span>
        )}
        {metrics.days_until_exam !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Calendar className="w-3 h-3" />
            Exam in {metrics.days_until_exam} {metrics.days_until_exam === 1 ? 'day' : 'days'}
          </span>
        )}
        {metrics.days_since_last_studied !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            Last studied: {metrics.days_since_last_studied}d ago
          </span>
        )}
        {metrics.missed_tasks_count !== undefined && metrics.missed_tasks_count > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            {metrics.missed_tasks_count} missed tasks
          </span>
        )}
        {metrics.study_share_pct !== undefined && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Focus: {Math.round(metrics.study_share_pct)}% time
          </span>
        )}
      </div>

      {/* Verifiable Reason Bullets */}
      {bullets.length > 0 && (
        <ul className="space-y-1.5 pt-1 text-slate-700">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      {/* AI Explanation Coach Card (if available) */}
      {ai_explanation && (
        <div className="mt-2.5 p-3 rounded-lg bg-white border border-indigo-100 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Study Coach</span>
            </div>
            <Badge
              variant={explanation_source === 'AI_ENHANCED' ? 'primary' : 'neutral'}
              size="sm"
              className="text-[10px]"
            >
              {explanation_source === 'AI_ENHANCED' ? 'AI Coach' : 'Smart System'}
            </Badge>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed italic">
            "{ai_explanation}"
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationReason;
