import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { CalendarCheck2, CheckCircle2, XCircle, Clock, Check } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';

/**
 * Custom light-theme tooltip for Planned vs Actual chart.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const planned = payload.find(p => p.dataKey === 'planned_minutes')?.value || 0;
    const actual = payload.find(p => p.dataKey === 'actual_minutes')?.value || 0;

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1.5 min-w-[130px]">
        <p className="font-bold text-slate-800">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
              Planned:
            </span>
            <span className="font-semibold text-slate-700">{planned}m ({(planned / 60).toFixed(1)}h)</span>
          </div>
          <div className="flex items-center justify-between text-indigo-600 font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
              Actual:
            </span>
            <span>{actual}m ({(actual / 60).toFixed(1)}h)</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * PlannerAdherence
 * Visualizes planned vs. actual study execution and task completion rates.
 */
export const PlannerAdherence = ({ data = {}, days = 30 }) => {
  const hasData = data && (data.available || data.total_planned_tasks > 0 || data.actual_minutes > 0);
  const daily = data?.daily || [];
  const statusDist = data?.status_distribution || {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    MISSED: 0,
    SKIPPED: 0,
    PENDING: 0
  };

  // Format short date for XAxis
  const formattedDaily = daily.map(d => {
    try {
      const parts = d.date.split('-');
      const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { ...d, label };
    } catch {
      return { ...d, label: d.date };
    }
  });

  const adherence = data?.adherence_percentage ?? 0;
  const getAdherenceBadge = (score) => {
    if (score >= 80) return <Badge variant="success" size="sm">{score}% High Adherence</Badge>;
    if (score >= 50) return <Badge variant="warning" size="sm">{score}% Moderate Adherence</Badge>;
    return <Badge variant="danger" size="sm">{score}% Low Adherence</Badge>;
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Plan Adherence & Execution</CardTitle>
            <p className="text-xs text-slate-500">Planned allocation vs. actual focus</p>
          </div>
        </div>
        {hasData && getAdherenceBadge(adherence)}
      </CardHeader>

      <CardContent className="pt-4">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400">
            <CalendarCheck2 className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            <p className="font-semibold text-slate-600">No scheduled study plans yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Generate daily plans from the Planner to track your adherence rate
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Stat Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Planned Time</p>
                <p className="text-sm font-bold text-slate-700">{data.planned_hours || 0} hrs</p>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100/70 rounded-lg p-2.5">
                <p className="text-[10px] text-indigo-700 font-medium uppercase tracking-wider">Actual Time</p>
                <p className="text-sm font-bold text-indigo-700">{data.actual_hours || 0} hrs</p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100/70 rounded-lg p-2.5">
                <p className="text-[10px] text-emerald-700 font-medium uppercase tracking-wider">Completed Tasks</p>
                <p className="text-sm font-bold text-emerald-700">{statusDist.COMPLETED || 0} ({data.completion_rate || 0}%)</p>
              </div>

              <div className="bg-red-50/50 border border-red-100/70 rounded-lg p-2.5">
                <p className="text-[10px] text-red-700 font-medium uppercase tracking-wider">Missed Tasks</p>
                <p className="text-sm font-bold text-red-700">{statusDist.MISSED || 0} ({data.miss_rate || 0}%)</p>
              </div>
            </div>

            {/* Planned vs Actual Dual Bar Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedDaily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    interval={days > 30 ? 6 : days > 14 ? 3 : 1}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    unit="m"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="planned_minutes"
                    name="Planned"
                    fill="#cbd5e1"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={days <= 14 ? 14 : 7}
                  />
                  <Bar
                    dataKey="actual_minutes"
                    name="Actual"
                    fill="#4f46e5"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={days <= 14 ? 14 : 7}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Planned Time
              </span>
              <span className="flex items-center gap-1 font-medium text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Actual Time
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {statusDist.COMPLETED} Completed
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" /> {statusDist.MISSED} Missed
              </span>
              {statusDist.PENDING > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {statusDist.PENDING} Pending
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlannerAdherence;
