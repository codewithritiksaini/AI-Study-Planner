import React, { useState } from 'react';
import { ShieldAlert, Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import Button from '../common/Button.jsx';

const DAYS = [
  { value: 0, label: 'Every Sunday' },
  { value: 1, label: 'Every Monday' },
  { value: 2, label: 'Every Tuesday' },
  { value: 3, label: 'Every Wednesday' },
  { value: 4, label: 'Every Thursday' },
  { value: 5, label: 'Every Friday' },
  { value: 6, label: 'Every Saturday' }
];

/**
 * BlockedTimeEditor
 * Allows students to specify unavailable periods (e.g. dinner, sports, work, commitments).
 */
export const BlockedTimeEditor = ({
  blockedPeriods = [],
  onAdd,
  onDelete,
  isLoading = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetType, setTargetType] = useState('recurring'); // 'recurring' | 'specific_date'
  const [selectedDay, setSelectedDay] = useState(1);
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('19:30');
  const [endTime, setEndTime] = useState('20:00');
  const [reason, setReason] = useState('Dinner & Break');
  const [error, setError] = useState(null);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      setError('End time must be later than start time.');
      return;
    }

    try {
      await onAdd({
        day_of_week: targetType === 'recurring' ? Number(selectedDay) : null,
        date: targetType === 'specific_date' ? specificDate : null,
        start_time: startTime,
        end_time: endTime,
        reason: reason.trim() || 'Blocked Time'
      });
      setShowAddForm(false);
      setReason('Dinner & Break');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save blocked period.');
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Blocked Hours & Commitments</h3>
            <span className="text-xs font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
              {blockedPeriods.length} Blackout Period(s)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Reservations, meals, classes, or downtime. The scheduler will never place study tasks inside these intervals.
          </p>
        </div>

        <Button
          icon={Plus}
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={isLoading}
        >
          {showAddForm ? 'Cancel' : 'Block Time'}
        </Button>
      </div>

      {/* Add Block Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 space-y-3">
          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
            Add Blocked Commitment
          </h4>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recurrence</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('recurring')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                    targetType === 'recurring'
                      ? 'bg-rose-100 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  Weekly Recurring
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('specific_date')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                    targetType === 'specific_date'
                      ? 'bg-rose-100 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  Specific Date
                </button>
              </div>
            </div>

            {targetType === 'recurring' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {DAYS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Label</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Dinner, Gym, Class..."
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={isLoading}
            >
              Save Blackout Period
            </Button>
          </div>
        </form>
      )}

      {/* Blocked Periods List */}
      {blockedPeriods.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500">No blocked commitments registered. All configured availability windows are open for study.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {blockedPeriods.map((period) => {
            const isRecurring = period.day_of_week !== null && period.day_of_week !== undefined;
            const dayLabel = isRecurring ? DAYS.find(d => d.value === Number(period.day_of_week))?.label : period.date;

            return (
              <div
                key={period.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{period.reason || 'Blocked Time'}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isRecurring ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {isRecurring ? 'Weekly' : 'One-Time'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {dayLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {period.start_time.slice(0, 5)} - {period.end_time.slice(0, 5)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDelete(period.id)}
                  title="Remove blackout period"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BlockedTimeEditor;
