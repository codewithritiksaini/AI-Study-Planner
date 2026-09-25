import React, { useState } from 'react';
import { Sparkles, X, Calendar, Clock, Sliders, ShieldCheck } from 'lucide-react';
import Button from '../common/Button.jsx';

/**
 * SmartOptimizationModal
 * Configure scheduling parameters before triggering non-destructive preview generation.
 */
export const SmartOptimizationModal = ({
  isOpen,
  onClose,
  onGeneratePreview,
  isLoading = false
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [days, setDays] = useState(7);
  const [preferredMinutes, setPreferredMinutes] = useState(45);
  const [maxDailyMinutes, setMaxDailyMinutes] = useState(180);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onGeneratePreview({
      start_date: startDate,
      days: Number(days),
      preferred_session_minutes: Number(preferredMinutes),
      max_daily_minutes: Number(maxDailyMinutes)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Smart Schedule Optimizer</h3>
              <p className="text-[11px] text-slate-500">Intelligent time-slot allocation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-indigo-950">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Non-Destructive Optimization
            </p>
            <p className="text-indigo-800 text-[11px] leading-relaxed">
              Generating a preview will not overwrite your active schedule. You can inspect all proposed sessions, overload alerts, and locked tasks before applying.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horizon</label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Preferred Session Duration</label>
              <span className="text-xs font-bold text-indigo-600">{preferredMinutes} mins</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={preferredMinutes}
              onChange={(e) => setPreferredMinutes(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>20m (Quick)</span>
              <span>45m (Optimal)</span>
              <span>90m (Deep Work)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Max Daily Study Limit</label>
              <span className="text-xs font-bold text-indigo-600">{maxDailyMinutes} mins ({(maxDailyMinutes / 60).toFixed(1)}h)</span>
            </div>
            <input
              type="range"
              min="60"
              max="360"
              step="15"
              value={maxDailyMinutes}
              onChange={(e) => setMaxDailyMinutes(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 hr</span>
              <span>3 hrs</span>
              <span>6 hrs</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              icon={Sparkles}
              disabled={isLoading}
            >
              {isLoading ? 'Generating Preview...' : 'Generate Preview'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmartOptimizationModal;
