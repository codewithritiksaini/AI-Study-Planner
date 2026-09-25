import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Calendar, BookOpen, AlertTriangle, Flame, Sparkles, ArrowRight, Play } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';

export const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Track your daily study velocity, upcoming exam deadlines, and adaptive recommendations."
        badge={<Badge variant="primary">Phase 1 Preview</Badge>}
        action={
          <Button icon={Play} onClick={() => navigate('/study')}>
            Start Studying
          </Button>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Today's Study Time</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">0h 45m</span>
                <span className="text-[11px] text-slate-400">/ 3h 00m</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Upcoming Exam</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">12 Days</span>
                <span className="text-[11px] text-emerald-600 font-medium">DBMS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Syllabus Progress</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">62.5%</span>
                <span className="text-[11px] text-purple-600 font-medium">Overall</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Study Streak</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">5 Days</span>
                <span className="text-[11px] text-amber-600 font-medium">🔥 Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Today's Tasks vs AI Recommendation & Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Scheduled Tasks</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Determined by Priority Scoring Engine</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/planner')}>
                Full Planner
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Task Item 1 */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-10 rounded-full bg-blue-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Database Management Systems</span>
                      <Badge variant="primary" size="sm">Priority: 88</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">BCNF & Lossless Decomposition &bull; 60 mins</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/study')}>
                  Study
                </Button>
              </div>

              {/* Task Item 2 */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-10 rounded-full bg-indigo-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Operating Systems</span>
                      <Badge variant="warning" size="sm">Priority: 74</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Virtual Memory & Paging &bull; 45 mins</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/study')}>
                  Study
                </Button>
              </div>

              <p className="text-[11px] text-center text-slate-400 pt-1">
                * Dynamic calendar slotting will connect to real database in Phase 5.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Advice Card & Weak Topics */}
        <div className="space-y-4">
          {/* AI Recommendation Card Placeholder */}
          <Card className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border-indigo-100">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Insight</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                "Based on your recent quiz scores, Normalization has a 40% accuracy rate with your DBMS exam in 12 days. An adaptive revision block is recommended."
              </p>
              <div className="mt-3">
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigate('/ai-tutor')}>
                  Ask AI Tutor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weak Topics Card Placeholder */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm">Attention Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-50/60 border border-amber-200/60">
                <span className="font-medium text-amber-900">BCNF Decomposition</span>
                <span className="text-amber-700 font-semibold">40% Quiz</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-50/60 border border-amber-200/60">
                <span className="font-medium text-amber-900">Page Replacement Algorithms</span>
                <span className="text-amber-700 font-semibold">48% Quiz</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
