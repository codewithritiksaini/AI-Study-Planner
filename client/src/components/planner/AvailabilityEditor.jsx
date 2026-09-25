import React, { useState } from 'react';
import { Clock, Plus, Trash2, Calendar, Check, AlertCircle } from 'lucide-react';
import Button from '../common/Button.jsx';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

/**
 * AvailabilityEditor
 * Component to configure student's recurring weekly study windows.
 */
export const AvailabilityEditor = ({
  availability = [],
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
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
        day_of_week: Number(selectedDay),
        start_time: startTime,
        end_time: endTime,
        is_active: true
      });
      setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save availability slot.');
    }
  };

  // Calculate total weekly available hours
  const totalWeeklyMinutes = availability
    .filter(a => a.is_active)
    .reduce((sum, a) => {
      const [sh, sm] = a.start_time.split(':').map(Number);
      const [eh, em] = a.end_time.split(':').map(Number);
      return sum + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Weekly Study Windows</h3>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              {(totalWeeklyMinutes / 60).toFixed(1)} hrs / week
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your regular daily study times. The scheduler will allocate tasks only within these windows.
          </p>
        </div>

        <Button
          icon={Plus}
          size="sm"
          variant="primary"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={isLoading}
        >
          {showAddForm ? 'Cancel' : 'Add Study Window'}
        </Button>
      </div>

      {/* Add Window Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            New Recurring Window
          </h4>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DAYS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              Save Window
            </Button>
          </div>
        </form>
      )}

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DAYS.map(day => {
          const daySlots = availability.filter(a => Number(a.day_of_week) === day.value);

          return (
            <div
              key={day.value}
              className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                daySlots.length > 0 ? 'bg-white border-slate-200' : 'bg-slate-50/60 border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{day.label}</span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {daySlots.length > 0 ? `${daySlots.length} window(s)` : 'No hours'}
                </span>
              </div>

              {daySlots.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No study windows set</p>
              ) : (
                <div className="space-y-1.5">
                  {daySlots.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdate(slot.id, { is_active: !slot.is_active })}
                          title={slot.is_active ? 'Active (click to pause)' : 'Paused (click to activate)'}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            slot.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {slot.is_active ? 'Active' : 'Paused'}
                        </button>

                        <button
                          onClick={() => onDelete(slot.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailabilityEditor;
