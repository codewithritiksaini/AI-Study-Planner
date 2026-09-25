import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Timer, Calendar, BookOpen, AlertTriangle, Flame, Sparkles, Play, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const studentName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const isProfileComplete = profile && profile.full_name && profile.branch && profile.semester && profile.target_cgpa && profile.daily_available_hours;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${studentName} 👋`}
        subtitle="Track your daily study velocity, upcoming exam deadlines, and adaptive recommendations."
        badge={<Badge variant="primary">{profile?.branch ? `${profile.branch} • Sem ${profile.semester || 1}` : 'Phase 2 Active'}</Badge>}
        action={
          <Button icon={Play} onClick={() => navigate('/study')}>
            Start Studying
          </Button>
        }
      />

      {/* Profile Completeness Alert Banner */}
      {!isProfileComplete && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Complete Your Academic Profile</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Set your semester, available daily hours, and target CGPA to enable personalized study scheduling.
              </p>
            </div>
          </div>
          <Link to="/profile">
            <Button size="sm" variant="primary" className="whitespace-nowrap font-medium">
              Complete Profile
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Today's Target</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">
                  {profile?.daily_available_hours ? `${profile.daily_available_hours}h` : '3.0h'}
                </span>
                <span className="text-[11px] text-slate-400">/ Day</span>
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
              <p className="text-xs text-slate-500 font-medium">Target CGPA</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">
                  {profile?.target_cgpa ? Number(profile.target_cgpa).toFixed(2) : '8.50'}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Goal</span>
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
              <p className="text-xs text-slate-500 font-medium">Current Semester</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-slate-900">
                  {profile?.semester ? `Sem ${profile.semester}` : 'Sem 1'}
                </span>
                <span className="text-[11px] text-purple-600 font-medium">{profile?.branch || 'CSE'}</span>
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
                <span className="text-xl font-bold text-slate-900">1 Day</span>
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
                "Profile linked successfully. Once you configure syllabus modules in Phase 3, adaptive revision blocks will populate automatically."
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
