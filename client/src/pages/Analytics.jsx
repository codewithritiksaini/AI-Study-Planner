import React from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';

export const Analytics = () => {
  return (
    <div>
      <PageHeader
        title="Study Analytics & Insights"
        subtitle="Visual analytics comparing planned vs actual study time and subject distribution."
        badge={<Badge variant="primary">Phase 1 Preview</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Study Volume Trends Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base">Weekly Study Volume (Planned vs Actual)</CardTitle>
              </div>
              <Badge variant="neutral" size="sm">Last 7 Days</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-b-xl border-t border-slate-100">
            <div className="flex items-end gap-3 h-36">
              {[
                { day: 'Mon', h: 60, actual: 50 },
                { day: 'Tue', h: 80, actual: 75 },
                { day: 'Wed', h: 45, actual: 30 },
                { day: 'Thu', h: 90, actual: 85 },
                { day: 'Fri', h: 70, actual: 60 },
                { day: 'Sat', h: 100, actual: 95 },
                { day: 'Sun', h: 40, actual: 40 }
              ].map((bar) => (
                <div key={bar.day} className="flex flex-col items-center gap-1.5">
                  <div className="flex items-end gap-1">
                    <div className="w-3.5 bg-slate-200 rounded-t-xs" style={{ height: `${bar.h}px` }} />
                    <div className="w-3.5 bg-indigo-600 rounded-t-xs" style={{ height: `${bar.actual}px` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{bar.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-200" /> Planned
              </span>
              <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" /> Actual Studied
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Subject Time Allocation Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-base">Subject Time Allocation</CardTitle>
              </div>
              <Badge variant="purple" size="sm">34.5 Total Hours</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-center space-y-3 bg-slate-50/50 rounded-b-xl border-t border-slate-100 p-6">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700">Database Management Systems</span>
                  <span className="font-bold text-slate-900">16.0 hrs (46%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '46%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700">Operating Systems</span>
                  <span className="font-bold text-slate-900">12.5 hrs (36%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '36%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700">Computer Networks</span>
                  <span className="font-bold text-slate-900">6.0 hrs (18%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '18%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-center text-slate-400">
        * Interactive Recharts SVG charts and time-series aggregations will be connected in Phase 9.
      </p>
    </div>
  );
};

export default Analytics;
