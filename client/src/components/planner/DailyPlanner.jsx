import React from 'react';
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Button from '../common/Button.jsx';
import PlannerSessionCard from './PlannerSessionCard.jsx';
import OverloadWarning from './OverloadWarning.jsx';
import PlannerExplanation from './PlannerExplanation.jsx';

/**
 * DailyPlanner
 * Interactive daily timeline view with capacity meters, overload alerts,
 * and scheduled sessions.
 */
export const DailyPlanner = ({
  dailyData,
  selectedDate,
  onDateChange,
  onStartSession,
  onCompleteSession,
  onSkipSession,
  onToggleLock,
  onRescheduleSession,
  onDeleteSession,
  onOpenManualModal,
  onOpenGeneratorModal,
  isProcessingId = null
}) => {
  const sessions = dailyData?.sessions || [];
  const capacity = dailyData?.capacity || {};
  const overloadInfo = dailyData?.overload_info || null;
  const explanation = dailyData?.explanation || null;

  const availableMinutes = capacity.available_minutes || 0;
  const plannedMinutes = capacity.planned_minutes || 0;
  const bufferMinutes = capacity.buffer_minutes || 0;
  const freeMinutes = Math.max(0, availableMinutes - plannedMinutes);

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Date Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="ml-2">
            <h3 className="text-sm font-bold text-slate-900">{formattedDate}</h3>
            <span className="text-[11px] text-slate-400 font-medium">Daily Study Schedule</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={Plus}
            onClick={onOpenManualModal}
          >
            Add Task
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Sparkles}
            onClick={onOpenGeneratorModal}
          >
            Smart Optimize
          </Button>
        </div>
      </div>

      {/* Daily Capacity Breakdown Meter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daily Capacity & Available Time Windows
            </h4>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {availableMinutes > 0 ? `${availableMinutes}m Total Window Configured` : 'No study windows set for this day'}
          </span>
        </div>

        {/* Stacked Capacity Progress Bar */}
        {availableMinutes > 0 ? (
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
              {/* Planned Minutes Bar */}
              <div
                style={{ width: `${Math.min(100, (plannedMinutes / availableMinutes) * 100)}%` }}
                className="h-full bg-indigo-600 transition-all duration-300"
                title={`Planned: ${plannedMinutes}m`}
              />
              {/* Buffer Minutes Bar */}
              <div
                style={{ width: `${Math.min(100, (bufferMinutes / availableMinutes) * 100)}%` }}
                className="h-full bg-emerald-400 transition-all duration-300"
                title={`Buffer: ${bufferMinutes}m`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <strong className="text-slate-900">{plannedMinutes}m</strong> Planned
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <strong className="text-slate-900">{bufferMinutes}m</strong> Buffer
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <strong className="text-slate-900">{freeMinutes}m</strong> Free Window
                </span>
              </div>

              {capacity.adherence_rate !== undefined && (
                <span className="text-[11px] text-slate-400">
                  Adaptive Adherence: {Math.round(capacity.adherence_rate * 100)}%
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
            <span>You have no active study availability windows on this day of the week.</span>
            <span className="text-xs font-semibold text-indigo-600">Rest Day</span>
          </div>
        )}
      </div>

      {/* Overload Alert (if any) */}
      {overloadInfo?.is_overloaded && (
        <OverloadWarning overloadInfo={overloadInfo} />
      )}

      {/* Verifiable Explanation Card */}
      {explanation && (
        <PlannerExplanation explanation={explanation} />
      )}

      {/* Sessions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Scheduled Study Sessions ({sessions.length})
          </h4>
          <span className="text-xs text-slate-400 font-medium">
            Time-Aware Allocation
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Study Sessions Scheduled for Today</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use Smart Optimize to generate time-slot sessions from your active recommendations and syllabus, or add a custom task.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="primary"
                icon={Sparkles}
                onClick={onOpenGeneratorModal}
              >
                Smart Optimize
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={onOpenManualModal}
              >
                Custom Task
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <PlannerSessionCard
                key={sess.id}
                session={sess}
                onStart={onStartSession}
                onComplete={onCompleteSession}
                onSkip={onSkipSession}
                onToggleLock={onToggleLock}
                onReschedule={onRescheduleSession}
                onDelete={onDeleteSession}
                isProcessing={isProcessingId === sess.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPlanner;
