import React from 'react';
import { CheckCircle2, TrendingUp, Award, Clock } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';

export const Progress = () => {
  return (
    <div>
      <PageHeader
        title="Academic Progress"
        subtitle="Track your curriculum coverage, syllabus completion rates, and learning consistency."
        badge={<Badge variant="primary">Phase 1 Preview</Badge>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card hover>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Completed Topics</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">18 / 30</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">60% of total curriculum</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Study Logged</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">34.5 Hrs</h3>
              <p className="text-[11px] text-indigo-600 mt-0.5 font-medium">Over 22 study sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Average Quiz Score</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">76.8%</h3>
              <p className="text-[11px] text-purple-600 mt-0.5 font-medium">Across 14 attempted quizzes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject-Wise Completion Breakdown</CardTitle>
          <p className="text-xs text-slate-500">Curriculum coverage per enrolled course</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: 'Database Management Systems', pct: 65, color: 'bg-blue-600' },
            { name: 'Operating Systems', pct: 50, color: 'bg-indigo-600' },
            { name: 'Computer Networks', pct: 30, color: 'bg-emerald-600' }
          ].map((item) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{item.name}</span>
                <span>{item.pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`${item.color} h-2.5 rounded-full transition-all duration-300`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Progress;
