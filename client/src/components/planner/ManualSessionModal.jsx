import React, { useState } from 'react';
import { Plus, X, Lock, BookOpen, Clock, Calendar, AlertCircle } from 'lucide-react';
import Button from '../common/Button.jsx';

/**
 * ManualSessionModal
 * Allows a student to schedule an ad-hoc custom or general study task.
 */
export const ManualSessionModal = ({
  isOpen,
  onClose,
  onSubmit,
  subjects = [],
  initialDate = null,
  isLoading = false
}) => {
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('18:45');
  const [subjectId, setSubjectId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const calculateMinutes = () => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    } catch {
      return 0;
    }
  };

  const plannedMinutes = calculateMinutes();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (plannedMinutes <= 0) {
      setError('End time must be after start time.');
      return;
    }

    if (!customTitle.trim()) {
      setError('Please provide a title for this session.');
      return;
    }

    try {
      await onSubmit({
        date,
        start_time: startTime,
        end_time: endTime,
        planned_minutes: plannedMinutes,
        subject_id: subjectId || null,
        custom_title: customTitle.trim(),
        is_locked: isLocked
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to schedule custom session.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Custom Session</h3>
              <p className="text-[11px] text-slate-500">Schedule a dedicated study block</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Title *</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Practice Problems"
              required
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject (Optional)</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">General Study</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Session Duration:</span>
            <span className={`font-bold ${plannedMinutes > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {plannedMinutes > 0 ? `${plannedMinutes} minutes` : 'Invalid interval'}
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Lock session (protect against automated schedule updates)
            </span>
          </label>

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
              disabled={isLoading || plannedMinutes <= 0}
            >
              {isLoading ? 'Saving...' : 'Add Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualSessionModal;
