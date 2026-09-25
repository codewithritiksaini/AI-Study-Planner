import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Award, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';

/**
 * Custom light-theme tooltip for Quiz Trend chart.
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1 max-w-xs">
        <p className="font-bold text-slate-800">{data.quiz_title || 'Quiz Assessment'}</p>
        {data.topic_name && (
          <p className="text-slate-500 text-[11px] truncate">Topic: {data.topic_name}</p>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
          <span className="text-slate-500 font-medium">Score:</span>
          <span className="font-bold text-indigo-600 text-sm">{data.score}%</span>
        </div>
        <p className="text-[10px] text-slate-400">{data.label || data.date}</p>
      </div>
    );
  }
  return null;
};

/**
 * QuizTrendChart
 * Visualizes quiz score trajectory over time with trajectory badges and statistics.
 */
export const QuizTrendChart = ({ data = {}, days = 30 }) => {
  const points = data?.daily || [];
  const hasData = data?.available && points.length > 0;

  // Format short date for XAxis
  const formattedData = points.map(p => {
    try {
      const parts = p.date.split('-');
      const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { ...p, label };
    } catch {
      return { ...p, label: p.date };
    }
  });

  const getTrendBadge = (trend) => {
    switch (trend) {
      case 'IMPROVING':
        return (
          <Badge variant="success" size="sm" className="gap-1 font-semibold">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            Improving (+{data.difference}%)
          </Badge>
        );
      case 'DECLINING':
        return (
          <Badge variant="danger" size="sm" className="gap-1 font-semibold">
            <TrendingDown className="w-3 h-3 text-red-600" />
            Declining ({data.difference}%)
          </Badge>
        );
      case 'STABLE':
        return (
          <Badge variant="neutral" size="sm" className="gap-1 font-semibold">
            <Minus className="w-3 h-3 text-slate-500" />
            Stable
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm" className="gap-1 text-slate-400">
            <HelpCircle className="w-3 h-3" />
            Baseline
          </Badge>
        );
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Quiz Performance Trend</CardTitle>
            <p className="text-xs text-slate-500">Assessment mastery & trajectory</p>
          </div>
        </div>
        {hasData && (
          <div className="flex items-center gap-2">
            {getTrendBadge(data.trend)}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400">
            <Award className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            <p className="font-semibold text-slate-600">No quiz assessments completed yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Take practice quizzes to unlock mastery trajectories and score trends
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2.5 text-center border border-slate-100">
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Average</p>
                <p className="text-base font-bold text-slate-900">{data.average_score}%</p>
              </div>
              <div className="border-x border-slate-200">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Highest</p>
                <p className="text-base font-bold text-emerald-600">{data.highest_score}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Quizzes</p>
                <p className="text-base font-bold text-indigo-600">{data.total_quizzes}</p>
              </div>
            </div>

            {/* Line Chart */}
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    unit="%"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 3.5, strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#059669' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizTrendChart;
