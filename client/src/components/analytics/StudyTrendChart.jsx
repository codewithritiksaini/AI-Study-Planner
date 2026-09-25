import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Clock, BarChart3 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';

/**
 * Custom light-theme tooltip for Study Trend chart.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const mins = payload[0].value;
    const hours = (mins / 60).toFixed(1);
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1">
        <p className="font-bold text-slate-800">{label}</p>
        <p className="text-indigo-600 font-semibold flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{mins} mins ({hours}h)</span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * StudyTrendChart
 * Recharts BarChart visualizing daily study duration across the chosen period.
 */
export const StudyTrendChart = ({ data = [], days = 30 }) => {
  const hasData = data && data.some(d => d.minutes > 0);

  // Format short date for XAxis (e.g. "Sep 20")
  const formattedData = data.map(d => {
    try {
      const parts = d.date.split('-');
      const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { ...d, label };
    } catch {
      return { ...d, label: d.date };
    }
  });

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Study Time Trend</CardTitle>
            <p className="text-xs text-slate-500">Daily focus duration over the last {days} days</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400">
            <Clock className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            <p className="font-semibold text-slate-600">No study sessions logged yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Start focus sessions from the Study page to build your daily trend</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  dataKey="minutes"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={days <= 14 ? 28 : 14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyTrendChart;
