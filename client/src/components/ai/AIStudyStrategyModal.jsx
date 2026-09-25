import React, { useEffect } from 'react';
import { X, Sparkles, Clock, CheckCircle2, Lightbulb, Brain, BookOpen, Target, Loader2 } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

/**
 * AIStudyStrategyModal (Slide-Over Drawer)
 * Displays a tactical step-by-step timed study roadmap for a specific syllabus topic.
 * Sliding in from the right per the platform's drawer design standard.
 */
export const AIStudyStrategyModal = ({
  isOpen,
  onClose,
  strategyData,
  isLoading = false
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Fallback phases if strategyData is still loading or partially empty
  const defaultPhases = [
    {
      phase_name: 'Concept Priming & Theoretical Foundations',
      duration_minutes: 15,
      instruction: 'Review fundamental definitions, core theorems, and annotated lecture diagrams.'
    },
    {
      phase_name: 'Core Problem Solving & Applied Practice',
      duration_minutes: 25,
      instruction: 'Work through standard textbook derivations, algorithm dry-runs, or past exam problems.'
    },
    {
      phase_name: 'Active Recall & Self-Assessment',
      duration_minutes: 15,
      instruction: 'Write out key formulas and architecture summaries from memory without looking at notes.'
    }
  ];

  const defaultProTips = [
    'Break complex derivations into smaller logical sub-steps before solving.',
    'Use the Pomodoro Focus Room timer to maintain strict distraction-free blocks.',
    'Formulate a 30-second spoken summary of the concept after finishing your session.'
  ];

  const phases = strategyData?.phases && strategyData.phases.length > 0
    ? strategyData.phases
    : defaultPhases;

  const proTips = strategyData?.pro_tips && strategyData.pro_tips.length > 0
    ? strategyData.pro_tips
    : defaultProTips;

  const totalDuration = strategyData?.recommended_duration_minutes || 60;
  const topicTitle = strategyData?.topic || strategyData?.topic_name || 'Curriculum Topic';
  const subjectTitle = strategyData?.subject || strategyData?.subject_name || 'Course';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Brain className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      AI Study Strategy
                    </h2>
                    <Badge variant={strategyData?.source === 'GEMINI_AI' ? 'primary' : 'neutral'} size="sm">
                      {strategyData?.source === 'GEMINI_AI' ? 'Gemini AI' : 'Tactical Roadmap'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                    {subjectTitle} • {topicTitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Close strategy drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                <p className="text-sm font-semibold text-slate-800">Formulating Tactical Study Roadmap...</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Analyzing topic complexity and synthesizing time-boxed study phases.
                </p>
              </div>
            ) : (
              <>
                {/* Duration & Overview Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/50 border border-indigo-100/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
                      Recommended Focus Block
                    </span>
                    <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                      {totalDuration} Minutes Planned
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                {/* Phased Roadmap */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Step-by-Step Study Phases
                    </h3>
                    <span className="text-xs font-medium text-slate-400">
                      {phases.length} Phases
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {phases.map((phase, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            {phase.phase_name}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-md">
                            {phase.duration_minutes}m
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-6 font-medium">
                          {phase.instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tips Section */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Mastery & Retention Tips
                    </h4>
                  </div>
                  <ul className="text-xs text-amber-800 space-y-1.5 pl-5 list-disc">
                    {proTips.map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Done / Close
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIStudyStrategyModal;
