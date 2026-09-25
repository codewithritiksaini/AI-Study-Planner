import React from 'react';
import { Clock, Activity, Flame, Target } from 'lucide-react';
import Card, { CardContent } from '../common/Card.jsx';

/**
 * OverviewMetrics
 * 4 High-contrast light metric cards summarizing total study volume,
 * consistency percentage, current streak, and plan adherence.
 */
export const OverviewMetrics = ({ study = {}, planner = {}, period = {} }) => {
  const totalHours = study?.total_hours || 0;
  const sessionCount = study?.session_count || 0;
  const avgSessionMins = study?.average_session_minutes || 0;

  const activeDays = study?.active_days || 0;
  const totalDays = period?.days || study?.total_days || 30;
  const consistencyPct = study?.consistency_percentage || 0;

  const currentStreak = study?.current_streak || 0;
  const longestStreak = study?.longest_streak || 0;

  const adherencePct = planner?.adherence_percentage || 0;
  const plannedHours = planner?.planned_hours || 0;
  const actualHours = planner?.actual_hours || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Study Time */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Total Study Time</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {totalHours}h
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {sessionCount} sessions &bull; {avgSessionMins}m avg
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metric 2: Active Days & Consistency */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Active Study Days</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {activeDays} <span className="text-sm font-semibold text-slate-400">/ {totalDays}d</span>
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold truncate mt-0.5">
              {consistencyPct}% consistency rate
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metric 3: Study Streak */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Current Streak</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
            </p>
            <p className="text-[11px] text-amber-700 font-medium truncate mt-0.5">
              Longest: {longestStreak} consecutive days
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metric 4: Plan Adherence */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100">
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Plan Adherence</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              {adherencePct}%
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {actualHours}h actual vs {plannedHours}h planned
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewMetrics;
