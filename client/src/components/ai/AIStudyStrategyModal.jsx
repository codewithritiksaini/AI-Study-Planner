import React from 'react';
import { X, Sparkles, Clock, CheckCircle2, Lightbulb } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

/**
 * AIStudyStrategyModal
 * Displays a tactical step-by-step timed study roadmap for a specific syllabus topic.
 */
export const AIStudyStrategyModal = ({
  isOpen,
  onClose,
  strategyData,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                AI Study Strategy
                <Badge variant={strategyData?.source === 'GEMINI_AI' ? 'primary' : 'neutral'} size="sm">
                  {strategyData?.source === 'GEMINI_AI' ? 'Gemini 2.5 Flash' : 'Tactical Roadmap'}
                </Badge>
              </h3>
              <p className="text-xs text-slate-500">
                {strategyData?.topic ? `${strategyData.subject || 'Course'} • ${strategyData.topic}` : 'Step-by-step study roadmap'}
              </p>
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
            <p className="text-xs text-slate-500 mt-3 font-medium">Formulating timed tactical phases...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Target Duration Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">Recommended Session Length:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                {strategyData?.recommended_duration_minutes || 60} Minutes
              </span>
            </div>

            {/* Timed Phases Roadmap */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Study Execution Phases
              </p>
              <div className="space-y-2">
                {(strategyData?.phases || []).map((phase, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {idx + 1}. {phase.phase_name}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {phase.duration_minutes}m
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {phase.instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tips */}
            {strategyData?.pro_tips && strategyData.pro_tips.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  High-Yield Pro Tips
                </p>
                <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                  {strategyData.pro_tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
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

export default AIStudyStrategyModal;
