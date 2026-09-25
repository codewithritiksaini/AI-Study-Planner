import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Target, Brain, Calendar, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * AdaptiveExplainerCard
 * Light-theme educational card breaking down the 6 multi-factor feedback signals
 * powering the Phase 8 Adaptive Planner.
 */
export const AdaptiveExplainerCard = () => {
  const [isOpen, setIsOpen] = useState(false);

  const signals = [
    {
      icon: Calendar,
      title: 'Exam Urgency (30%)',
      desc: 'Topics with imminent exam dates receive highest priority and are prioritized earlier in the day.',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      icon: Brain,
      title: 'Quiz Performance & Weakness (25%)',
      desc: 'Topics identified as WEAK or with recent quiz score drops (<70%) are scheduled for reinforcement.',
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      icon: Target,
      title: 'Syllabus Need (15%)',
      desc: 'Prioritizes unstudied or partially completed topics (0%–50%) over topics near full completion.',
      color: 'text-violet-600 bg-violet-50 border-violet-200'
    },
    {
      icon: Clock,
      title: 'Inactivity & Forgetting Curve (10%)',
      desc: 'Topics untouched for >5 days are resurfaced before retention drops below the critical threshold.',
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      icon: AlertTriangle,
      title: 'Topic Difficulty (10%)',
      desc: 'Hard conceptual topics are paired with sufficient planned focus blocks and required breaks.',
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    },
    {
      icon: RefreshCw,
      title: 'Missed Task Recovery (10%)',
      desc: 'Tasks skipped or missed in past sessions are gracefully re-inserted without cascading overload.',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              How Your Plan Adapts
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Adaptive Feedback Engine
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Your timetable automatically recalibrates based on real quiz accuracy, study duration, and exam deadlines.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {signals.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`p-1.5 rounded-lg border ${s.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-900">{s.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
            <span>
              <strong>Safe Recalibration Guarantee:</strong> Completed study sessions are permanently preserved in your learning history.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveExplainerCard;
