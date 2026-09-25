import React from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

/**
 * AIPlanExplanationModal
 * Modal that renders natural-language explanations of why the rule engine prioritized tasks.
 */
export const AIPlanExplanationModal = ({
  isOpen,
  onClose,
  explanationData,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Why this study plan?
                <Badge variant={explanationData?.source === 'GEMINI_AI' ? 'primary' : 'neutral'} size="sm">
                  {explanationData?.source === 'GEMINI_AI' ? 'Gemini 2.5 Flash' : 'Rule Engine'}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500">Transparent AI explanation of today's timetable</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-500 mt-3 font-medium">Analyzing timetable prioritization factors...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primary Explanation */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {explanationData?.explanation || 'This timetable prioritizes topics with approaching exams, incomplete syllabus modules, and high difficulty ratings.'}
              </p>
            </div>

            {/* Driving Factors */}
            {explanationData?.key_factors && explanationData.key_factors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Key Prioritization Signals
                </p>
                <div className="space-y-1.5">
                  {explanationData.key_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-indigo-50/40 border border-indigo-100 flex items-start gap-2 text-xs text-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encouragement */}
            {explanationData?.encouragement && (
              <p className="text-xs text-slate-500 italic text-center pt-2">
                "{explanationData.encouragement}"
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIPlanExplanationModal;
