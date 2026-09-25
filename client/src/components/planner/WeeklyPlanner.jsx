import React from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import Button from '../common/Button.jsx';

/**
 * WeeklyPlanner
 * Multi-day timetable view with week navigation and subject distribution breakdown.
 */
export const WeeklyPlanner = ({
  weeklyData,
  startDate,
  onStartDateChange,
  onSelectDay,
  onOpenGeneratorModal
}) => {
  const days = weeklyData?.days || [];
  const subjectDistribution = weeklyData?.subject_distribution || {};

  // Week navigation helpers
  const handlePrevWeek = () => {
    const d = new Date(startDate + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    onStartDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(startDate + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    onStartDateChange(d.toISOString().split('T')[0]);
  };

  const handleCurrentWeek = () => {
    onStartDateChange(new Date().toISOString().split('T')[0]);
  };

  const totalWeekMinutes = days.reduce((sum, d) => sum + (d.total_planned_minutes || 0), 0);
  const totalWeekCompleted = days.reduce((sum, d) => sum + (d.completed_minutes || 0), 0);
  const totalSessionsCount = days.reduce((sum, d) => sum + (d.sessions?.length || 0), 0);

  const startFormatted = new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const endFormatted = days.length > 0
    ? new Date(days[days.length - 1].date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleCurrentWeek}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Current Week
          </button>

          <button
            onClick={handleNextWeek}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="ml-2">
            <h3 className="text-sm font-bold text-slate-900">
              {startFormatted} – {endFormatted}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">7-Day Study Horizon</span>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Total Planned</span>
            <span className="font-bold text-indigo-600">{(totalWeekMinutes / 60).toFixed(1)} hrs</span>
          </div>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Completed</span>
            <span className="font-bold text-emerald-600">{(totalWeekCompleted / 60).toFixed(1)} hrs</span>
          </div>
          <div className="h-6 w-[1px] bg-slate-200" />
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Sessions</span>
            <span className="font-bold text-slate-800">{totalSessionsCount}</span>
          </div>
        </div>
      </div>

      {/* 7-Day Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((day) => {
          const dateObj = new Date(day.date + 'T00:00:00');
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNumber = dateObj.getDate();
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const sessions = day.sessions || [];
          const plannedMins = day.total_planned_minutes || 0;

          return (
            <div
              key={day.date}
              onClick={() => onSelectDay && onSelectDay(day.date)}
              className={`rounded-xl border p-3 flex flex-col justify-between cursor-pointer transition-all hover:border-indigo-300 hover:shadow-sm ${
                isToday
                  ? 'bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      {dayName}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{dayNumber}</span>
                  </div>
                  {isToday && (
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Day Summary */}
                <div className="py-2">
                  <span className="text-xs font-bold text-slate-800">
                    {plannedMins > 0 ? `${plannedMins}m planned` : 'Rest Day'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {sessions.length} session(s)
                  </span>
                </div>

                {/* Sessions list previews */}
                <div className="space-y-1.5 pt-1">
                  {sessions.slice(0, 3).map((sess) => {
                    const timeLabel = sess.start_time
                      ? new Date(sess.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                      : '--:--';

                    return (
                      <div
                        key={sess.id}
                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-mono font-semibold text-[10px]">{timeLabel}</span>
                          <span className="text-[10px] font-bold text-indigo-700">{sess.planned_minutes}m</span>
                        </div>
                        <p className="font-semibold text-slate-900 truncate">
                          {sess.custom_title || sess.topic_name || 'Study Task'}
                        </p>
                      </div>
                    );
                  })}

                  {sessions.length > 3 && (
                    <span className="text-[10px] text-slate-400 block text-center pt-1 font-medium">
                      +{sessions.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* View Day Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-semibold">
                <span>View Timeline</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Subject Distribution Card */}
      {Object.keys(subjectDistribution).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Weekly Subject Distribution
            </h4>
            <span className="text-xs text-slate-400 font-medium">
              Curriculum Balance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(subjectDistribution).map(([subjName, dist]) => {
              const minutes = dist.planned_minutes || 0;
              const count = dist.sessions_count || 0;
              const percent = totalWeekMinutes > 0 ? Math.round((minutes / totalWeekMinutes) * 100) : 0;

              return (
                <div
                  key={subjName}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">{subjName}</span>
                    <span className="text-indigo-600 font-bold">{percent}%</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-indigo-600 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>{minutes} minutes</span>
                    <span>{count} session(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanner;
