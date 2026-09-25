import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Timer,
  Calendar,
  BookOpen,
  AlertTriangle,
  Flame,
  Sparkles,
  Play,
  ArrowRight,
  UserCheck,
  AlertCircle,
  BookMarked,
  TrendingUp,
  Clock,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { subjectService } from '../services/subjects.js';
import { studyService } from '../services/study.js';
import { plannerService } from '../services/planner.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [summary, setSummary] = useState({
    totalSubjects: 0,
    totalTopics: 0,
    overallSyllabusProgress: 0,
    upcomingExam: null
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Phase 4 Study Session metrics
  const [activeSession, setActiveSession] = useState(null);
  const [todayStudy, setTodayStudy] = useState({
    total_minutes: 0,
    session_count: 0,
    sessions: []
  });

  // Phase 5 Study Plan metrics
  const [todayPlan, setTodayPlan] = useState({
    total_planned_minutes: 0,
    completed_minutes: 0,
    pending_minutes: 0,
    available_minutes: 180,
    plans: []
  });

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoadingSummary(true);
        const [academicSummary, activeSess, todayData, planData] = await Promise.all([
          subjectService.getDashboardSummary(),
          studyService.getActiveSession().catch(() => null),
          studyService.getTodaySessions().catch(() => ({ total_minutes: 0, session_count: 0, sessions: [] })),
          plannerService.getTodayPlan().catch(() => ({ total_planned_minutes: 0, completed_minutes: 0, pending_minutes: 0, plans: [] }))
        ]);

        if (isMounted) {
          if (academicSummary) setSummary(academicSummary);
          if (activeSess) setActiveSession(activeSess);
          if (todayData) setTodayStudy(todayData);
          if (planData) setTodayPlan(planData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setLoadingSummary(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const studentName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const isProfileComplete = profile && profile.full_name && profile.branch && profile.semester && profile.target_cgpa && profile.daily_available_hours;

  const formatHoursMinutes = (totalMins) => {
    if (!totalMins || totalMins === 0) return '0h 0m';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${studentName} 👋`}
        subtitle="Track your daily study velocity, live focus sessions, and academic preparation milestones."
        badge={<Badge variant="primary">{profile?.branch ? `${profile.branch} • Sem ${profile.semester || 1}` : 'Phase 4 Active'}</Badge>}
        action={
          <Button
            icon={Play}
            onClick={() => navigate('/study')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            Start Studying
          </Button>
        }
      />

      {/* Active Focus Session Banner (Phase 4 Live Activity) */}
      {activeSession && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-950">Active Focus Session in Progress</h4>
                <Badge variant="success" size="sm">Running</Badge>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Studying <span className="font-bold">{activeSession.subject_name}</span>
                {activeSession.topic_name && <> &bull; <span className="font-semibold">{activeSession.topic_name}</span></>}
              </p>
            </div>
          </div>
          <Link to="/study">
            <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shadow-xs">
              Resume Focus Room
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Profile Completeness Alert Banner */}
      {!isProfileComplete && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Complete Your Academic Profile</h4>
              <p className="text-xs text-slate-600 mt-0.5">
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

      {/* Upcoming Exam Countdown Banner (if upcoming exam exists) */}
      {summary.upcomingExam && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg text-white flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: summary.upcomingExam.color || '#4f46e5' }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Upcoming Exam: {summary.upcomingExam.name}</h4>
                <Badge variant={summary.upcomingExam.days_until_exam <= 7 ? 'danger' : 'primary'} size="sm">
                  {summary.upcomingExam.days_until_exam === 0
                    ? 'Today!'
                    : `In ${summary.upcomingExam.days_until_exam} days`}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Scheduled for {new Date(summary.upcomingExam.exam_date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <Link to={`/subjects/${summary.upcomingExam.id}`}>
            <Button size="sm" variant="outline" className="whitespace-nowrap">
              View Syllabus
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Row (Real Study Activity + Academic Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Metric 1: Today's Verified Study Time */}
        <Card hover onClick={() => navigate('/study')} className="cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Today's Study Time</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {loadingSummary ? '—' : formatHoursMinutes(todayStudy.total_minutes)}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {todayStudy.session_count} {todayStudy.session_count === 1 ? 'session' : 'sessions'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Enrolled Subjects */}
        <Card hover onClick={() => navigate('/subjects')} className="cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Subjects Enrolled</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {loadingSummary ? '—' : summary.totalSubjects}
                </span>
                <span className="text-[11px] text-slate-400">Courses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Overall Syllabus Progress */}
        <Card hover onClick={() => navigate('/subjects')} className="cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Overall Syllabus</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {loadingSummary ? '—' : `${summary.overallSyllabusProgress}%`}
                </span>
                <span className="text-[11px] text-violet-600 font-medium">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Next Exam Deadline */}
        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Next Exam</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-slate-900 truncate max-w-[130px]" title={summary.upcomingExam?.name || 'None Scheduled'}>
                  {summary.upcomingExam ? `${summary.upcomingExam.days_until_exam}d` : 'None'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {summary.upcomingExam ? summary.upcomingExam.name : 'Scheduled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Curriculum Quick Access vs Profile & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Curriculum Overview & Scheduled Tasks */}
        <div className="lg:col-span-2 space-y-4">
          {summary.totalSubjects === 0 && !loadingSummary ? (
            <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Set Up Your Academic Curriculum</h3>
                <p className="text-sm text-slate-500 max-w-md mt-1 mb-5">
                  Add your B.Tech subjects, define syllabus topics, set exam deadlines and target scores to start tracking academic progress.
                </p>
                <Button icon={Plus} onClick={() => navigate('/subjects')}>
                  Add First Subject
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Academic Curriculum Overview</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Active subjects and syllabus coverage</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/subjects')}>
                  All Subjects
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <BookMarked className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {summary.totalSubjects} {summary.totalSubjects === 1 ? 'Subject' : 'Subjects'} Enrolled
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {summary.totalTopics} total syllabus topics configured
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-600">
                      {summary.overallSyllabusProgress}%
                    </span>
                    <p className="text-[11px] text-slate-400">Syllabus Complete</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="font-medium">Curriculum Completion Velocity</span>
                    <span className="font-semibold text-slate-800">{summary.overallSyllabusProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, summary.overallSyllabusProgress))}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Study Plan Tasks (Phase 5 Live Timetable) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle>Today's Planned Study Tasks</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {todayPlan.plans && todayPlan.plans.length > 0
                      ? `${todayPlan.plans.length} task(s) scheduled (${Math.round(todayPlan.total_planned_minutes / 60 * 10) / 10}h planned)`
                      : 'No study plan generated yet for today'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/planner')}>
                Open Planner
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {todayPlan.plans && todayPlan.plans.length > 0 ? (
                todayPlan.plans.slice(0, 3).map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2.5 h-9 rounded-full shrink-0"
                        style={{ backgroundColor: plan.subjects?.color || '#4f46e5' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-slate-500 truncate">
                            {plan.subjects?.name}
                          </span>
                          <Badge variant={plan.status === 'COMPLETED' ? 'success' : plan.status === 'IN_PROGRESS' ? 'primary' : 'neutral'} size="sm">
                            {plan.status}
                          </Badge>
                        </div>
                        <h5 className="text-sm font-semibold text-slate-900 truncate">
                          {plan.topics?.name}
                        </h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-xs text-slate-500 font-medium">
                        {plan.planned_minutes}m
                      </span>
                      {plan.status !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate(`/study?subjectId=${plan.subject_id}&topicId=${plan.topic_id}`)}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  <p>No study tasks scheduled for today.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate('/planner')}
                  >
                    Generate Study Plan
                  </Button>
                </div>
              )}
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
