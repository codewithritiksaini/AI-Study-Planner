import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lock,
  X,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import Button from '../common/Button.jsx';
import OverloadWarning from './OverloadWarning.jsx';

/**
 * PlanPreviewModal
 * Displays non-destructive generation preview before persisting into active schedule.
 */
export const PlanPreviewModal = ({
  isOpen,
  onClose,
  previewData,
  onApply,
  isApplying = false
}) => {
  const [preserveLocked, setPreserveLocked] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isApplying) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isApplying, onClose]);

  if (!isOpen || !previewData) return null;

  const {
    generation_id,
    period_start,
    period_end,
    total_planned_minutes = 0,
    available_minutes = 0,
    scheduled_sessions = [],
    unscheduled_tasks = [],
    overload_info = null,
    explanation = null
  } = previewData;

  // Group scheduled sessions by date
  const sessionsByDate = scheduled_sessions.reduce((acc, sess) => {
    const d = sess.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(sess);
    return acc;
  }, {});

  const handleApplyClick = () => {
    if (onApply && generation_id) {
      onApply({
        generation_id,
        preserve_locked: preserveLocked
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Optimized Study Plan Preview
              </h3>
              <p className="text-xs text-slate-500">
                Period: <span className="font-semibold text-slate-700">{period_start}</span> to{' '}
                <span className="font-semibold text-slate-700">{period_end}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isApplying}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Summary Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Available Window</span>
              <span className="text-base font-bold text-slate-900">{(available_minutes / 60).toFixed(1)} hrs</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Planned Work</span>
              <span className="text-base font-bold text-indigo-600">{(total_planned_minutes / 60).toFixed(1)} hrs</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Sessions</span>
              <span className="text-base font-bold text-slate-900">{scheduled_sessions.length} Blocks</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Unscheduled</span>
              <span className={`text-base font-bold ${unscheduled_tasks.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {unscheduled_tasks.length} Tasks
              </span>
            </div>
          </div>

          {/* Overload Alert if exists */}
          {overload_info?.is_overloaded && (
            <OverloadWarning overloadInfo={overload_info} />
          )}

          {/* Explanation if present */}
          {explanation && (
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900">
              <p className="font-semibold text-indigo-950 mb-0.5">Plan Logic Summary:</p>
              <p>{explanation.summary}</p>
            </div>
          )}

          {/* Scheduled Sessions by Date */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Proposed Timetable Schedule ({scheduled_sessions.length} sessions)
            </h4>

            {scheduled_sessions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed rounded-xl">
                No sessions could be scheduled. Ensure you have configured weekly study windows and topics to study.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(sessionsByDate).map(([date, sessions]) => (
                  <div key={date} className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{date}</span>
                      <span className="text-slate-500 font-medium">
                        {sessions.reduce((s, x) => s + (x.planned_minutes || 0), 0)} mins planned
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {sessions.map((sess, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-600 font-semibold">
                              {sess.start_time} - {sess.end_time}
                            </span>
                            <span className="font-bold text-slate-900">
                              {sess.custom_title || sess.topic_id || 'Study Session'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                              {sess.planned_minutes}m
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {sess.priority || 'NORMAL'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unscheduled Tasks if any */}
          {unscheduled_tasks.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs">
              <span className="font-bold text-amber-900 block">
                Deferred / Unscheduled Tasks ({unscheduled_tasks.length}):
              </span>
              <p className="text-amber-800 text-[11px]">
                Due to limited availability windows, these lower-priority tasks could not fit in this cycle:
              </p>
              <ul className="space-y-1">
                {unscheduled_tasks.map((task, idx) => (
                  <li key={idx} className="flex items-center justify-between text-amber-900 bg-white/70 p-2 rounded border border-amber-200/60">
                    <span className="font-medium">{task.custom_title || task.topic_id}</span>
                    <span className="text-[11px] font-semibold">{task.planned_minutes} mins</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preserve Locked Sessions Option */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={preserveLocked}
                onChange={(e) => setPreserveLocked(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                Preserve locked sessions ({scheduled_sessions.filter(s => s.is_locked).length} locked)
              </span>
            </label>
            <p className="text-[11px] text-slate-500 ml-6.5 mt-0.5">
              Keep your existing custom/pinned appointments completely untouched during application.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isApplying}
          >
            Cancel & Discard
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            onClick={handleApplyClick}
            disabled={isApplying || scheduled_sessions.length === 0}
          >
            {isApplying ? 'Applying Plan...' : 'Apply to Active Schedule'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanPreviewModal;
