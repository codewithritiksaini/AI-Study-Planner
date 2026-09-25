import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import Button from '../common/Button.jsx';

export const SmartOptimizationModal = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading = false,
  defaultStartDate = null
}) => {
  const [startDate, setStartDate] = useState(
    defaultStartDate || new Date().toISOString().split('T')[0]
  );
  const [days, setDays] = useState(7);
  const [preferredMinutes, setPreferredMinutes] = useState(45);
  const [maxDailyMinutes, setMaxDailyMinutes] = useState(180);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      startDate,
      days: Number(days),
      preferredMinutes: Number(preferredMinutes),
      maxDailyMinutes: Number(maxDailyMinutes)
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-optimizer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 id="smart-optimizer-title" className="text-base sm:text-lg font-bold text-slate-900">
                  Smart Schedule Optimizer
                </h3>
                <p className="text-xs text-slate-500">Configure parameters for automated allocation</p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body (Scrollable) */}
          <form id="smart-optimizer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-indigo-950">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Non-Destructive Optimization
              </p>
              <p className="text-indigo-800 text-[11px] leading-relaxed">
                Generating a preview will not overwrite your active schedule. You can inspect all proposed sessions, overload alerts, and locked tasks before applying.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Planning Horizon</label>
                <select
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Preferred Session Duration</label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {preferredMinutes} mins
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={preferredMinutes}
                onChange={(e) => setPreferredMinutes(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                <span>20m (Quick)</span>
                <span>45m (Optimal)</span>
                <span>90m (Deep Work)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Max Daily Study Limit</label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {maxDailyMinutes} mins ({(maxDailyMinutes / 60).toFixed(1)}h)
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="360"
                step="15"
                value={maxDailyMinutes}
                onChange={(e) => setMaxDailyMinutes(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                <span>1 hr</span>
                <span>3 hrs</span>
                <span>6 hrs</span>
              </div>
            </div>
          </form>

          {/* Footer Actions (Sticky) */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-700"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              form="smart-optimizer-form"
              icon={Sparkles}
              disabled={isLoading}
              className="shadow-sm"
            >
              {isLoading ? 'Generating Preview...' : 'Generate Preview'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SmartOptimizationModal;
