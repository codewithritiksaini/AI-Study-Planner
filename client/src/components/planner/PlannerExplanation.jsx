import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Lightbulb, ChevronDown, ChevronUp, Brain } from 'lucide-react';

/**
 * PlannerExplanation
 * Renders verifiable schedule explanation cards with deterministic facts and AI coaching advice.
 */
export const PlannerExplanation = ({ explanation }) => {
  const [expanded, setExpanded] = useState(false);

  if (!explanation) return null;

  const {
    summary,
    bullets = [],
    coach_tip,
    source = 'DETERMINISTIC'
  } = explanation;

  const isAiEnhanced = source === 'AI_ENHANCED';

  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <Sparkles className="h-5 w-5 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Why This Study Schedule?</h4>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isAiEnhanced
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-indigo-50 text-indigo-700'
              }`}>
                {isAiEnhanced ? (
                  <>
                    <Brain className="h-3 w-3" />
                    AI Optimized
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Adaptive Schedule
                  </>
                )}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
              {summary}
            </p>
          </div>
        </div>

        {bullets.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
          >
            <span>{expanded ? 'Hide Details' : 'View Factors'}</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Expanded Deterministic Factor Bullets */}
      {expanded && bullets.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Mathematical Scheduling Rules Applied:
          </p>
          <ul className="space-y-1 text-xs text-slate-600">
            {bullets.map((b, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Coaching Tip */}
      {coach_tip && (
        <div className="mt-3 rounded-lg bg-indigo-50/70 border border-indigo-100/80 p-2.5 flex items-start gap-2 text-xs text-indigo-900">
          <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-indigo-950">Study Coach Tip: </strong>
            <span>{coach_tip}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerExplanation;
