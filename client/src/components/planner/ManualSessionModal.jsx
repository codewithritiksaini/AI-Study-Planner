import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, Lock, AlertCircle, BookOpen } from 'lucide-react';
import Button from '../common/Button.jsx';
import { plannerService } from '../../services/planner.js';

export const ManualSessionModal = ({
  isOpen,
  onClose,
  onSuccess,
  subjects = [],
  defaultDate = null
}) => {
  const [customTitle, setCustomTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate]);

  if (!isOpen) return null;

  const calculateMinutes = (start, end) => {
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  };

  const plannedMinutes = calculateMinutes(startTime, endTime);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customTitle.trim()) {
      setError('Session title is required.');
      return;
    }

    if (plannedMinutes <= 0) {
      setError('End time must be later than start time.');
      return;
    }

    try {
      setIsLoading(true);
      await plannerService.createManualSession({
        custom_title: customTitle.trim(),
        subject_id: subjectId || null,
        scheduled_date: date,
        start_time: startTime,
        end_time: endTime,
        planned_duration_minutes: plannedMinutes,
        is_locked: isLocked
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create manual session:', err);
      setError(err.response?.data?.error?.message || 'Failed to schedule custom session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
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
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Add Custom Session</h3>
                <p className="text-xs text-slate-500">Schedule a dedicated study block</p>
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

          {/* Body Form (Scrollable) */}
          <form id="manual-session-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Session Title *</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Chapter 4 Practice Problems"
                required
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Subject (Optional)</span>
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="">General Study</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Start Time</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>End Time</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Session Duration:</span>
              <span className={`font-bold ${plannedMinutes > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {plannedMinutes > 0 ? `${plannedMinutes} minutes` : 'Invalid interval'}
              </span>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div>
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Lock session
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Protects this session against automated schedule updates and re-planning.
                </span>
              </div>
            </label>
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
              form="manual-session-form"
              disabled={isLoading || plannedMinutes <= 0}
              className="shadow-sm"
            >
              {isLoading ? 'Saving...' : 'Add Session'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManualSessionModal;
