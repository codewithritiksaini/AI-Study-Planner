import React, { useEffect } from 'react';
import { RefreshCw, X, ShieldCheck } from 'lucide-react';
import Button from '../common/Button.jsx';

/**
 * PlanRegenerationModal
 * Reassures the student about safe plan recalibration:
 * - Completed sessions are preserved
 * - Incomplete/missed tasks are rescheduled based on recent quiz scores and exam urgency
 */
export const PlanRegenerationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isRegenerating = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isRegenerating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRegenerating, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Light backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => !isRegenerating && onClose()}
      />

      {/* Light modal container */}
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Recalibrate Study Plan</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isRegenerating}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 leading-relaxed">
              <p className="font-bold text-indigo-950">Safe Recalibration Guarantee</p>
              <p className="mt-1">
                Your completed study history and currently in-progress sessions are <strong>never deleted</strong>.
                Only future pending, skipped, and missed tasks in your 7-day window will be re-budgeted.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">What happens during recalibration:</p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600 pl-1">
              <li>Incorporates your latest quiz performance & weak topics</li>
              <li>Re-evaluates urgency against approaching exam deadlines</li>
              <li>Adapts daily workloads to match your observed study pace</li>
              <li>Inserts mandatory rest intervals between intensive study blocks</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isRegenerating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={onConfirm}
              disabled={isRegenerating}
            >
              {isRegenerating ? 'Recalibrating Plan...' : 'Recalibrate My Plan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanRegenerationModal;
