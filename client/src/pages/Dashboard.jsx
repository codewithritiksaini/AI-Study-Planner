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
  CheckCircle2,
  Brain,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { subjectService } from '../services/subjects.js';
import { studyService } from '../services/study.js';
import { plannerService } from '../services/planner.js';
import { aiService } from '../services/ai.js';
import performanceService from '../services/performance.js';
import quizService from '../services/quizzes.js';
import analyticsService from '../services/analytics.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import WeakTopicsCard from '../components/quiz/WeakTopicsCard.jsx';

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

  // Phase 6 AI Recommendation state
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAiAdvice, setLoadingAiAdvice] = useState(false);

  // Phase 7 Quiz & Performance metrics
  const [quizMetrics, setQuizMetrics] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    assessedTopicsCount: 0
  });

  // Phase 9 Student Intelligence & Analytics
  const [analyticsOverview, setAnalyticsOverview] = useState(null);

  const fetchAIAdvice = async () => {
    try {
      setLoadingAiAdvice(true);
      const res = await aiService.getRecommendation();
      setAiAdvice(res);
    } catch (err) {
      console.error('Failed to fetch AI recommendation:', err);
    } finally {
      setLoadingAiAdvice(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoadingSummary(true);
        const [academicSummary, activeSess, todayData, planData, perfs, history, overviewData] = await Promise.all([
          subjectService.getDashboardSummary(),
          studyService.getActiveSession().catch(() => null),
          studyService.getTodaySessions().catch(() => ({ total_minutes: 0, session_count: 0, sessions: [] })),
          plannerService.getAdaptiveToday().catch(() => plannerService.getTodayPlan().catch(() => ({ total_planned_minutes: 0, completed_minutes: 0, pending_minutes: 0, tasks: [], plans: [] }))),
          performanceService.getAllTopicPerformance().catch(() => []),
          quizService.getQuizHistory(10).catch(() => []),
          analyticsService.getOverview(7).catch(() => null)
        ]);

        if (isMounted) {
          if (academicSummary) setSummary(academicSummary);
          if (activeSess) setActiveSession(activeSess);
          if (todayData) setTodayStudy(todayData);
          if (planData) setTodayPlan(planData);
          if (overviewData) setAnalyticsOverview(overviewData);
          
          if (perfs) {
            const avg = perfs.length > 0
              ? Math.round(perfs.reduce((sum, p) => sum + Number(p.composite_score || 0), 0) / perfs.length)
              : 0;
            setQuizMetrics({
              totalQuizzes: history?.length || 0,
              averageScore: avg,
              assessedTopicsCount: perfs.length
            });
          }
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

      {/* Metric Cards Row (Real Study Activity + Academic Metrics + Quiz Mastery) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                  {todayStudy.session_count} {todayStudy.session_count === 1 ? 'sess' : 'sess'}
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
              <p className="text-xs text-slate-500 font-medium">Enrolled Courses</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {loadingSummary ? '—' : summary.totalSubjects}
                </span>
                <span className="text-[11px] text-slate-400">Subjects</span>
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
              <p className="text-xs text-slate-500 font-medium">Syllabus Progress</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {loadingSummary ? '—' : `${summary.overallSyllabusProgress}%`}
                </span>
                <span className="text-[11px] text-violet-600 font-medium">Covered</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Quiz Mastery (Phase 7) */}
        <Card hover onClick={() => navigate('/quiz')} className="cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Quiz Mastery</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {quizMetrics.assessedTopicsCount > 0 ? `${quizMetrics.averageScore}%` : '—'}
                </span>
                <span className="text-[11px] text-purple-600 font-medium">
                  {quizMetrics.assessedTopicsCount} tested
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 5: Next Exam Deadline */}
        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Next Exam</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg font-bold text-slate-900 truncate max-w-[110px]" title={summary.upcomingExam?.name || 'None Scheduled'}>
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Today's Planned Study Tasks</CardTitle>
                    {todayPlan.is_capacity_adjusted && (
                      <span title="Pace-calibrated capacity from recent study sessions" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Pace-calibrated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(todayPlan.tasks || todayPlan.plans || []).length > 0
                      ? `${(todayPlan.tasks || todayPlan.plans || []).length} task(s) scheduled (${Math.round(((todayPlan.planned_minutes || todayPlan.total_planned_minutes || 0) / 60) * 10) / 10}h planned)`
                      : 'No study plan generated yet for today'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/planner')}>
                Open Adaptive Planner
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {(todayPlan.tasks || todayPlan.plans || []).length > 0 ? (
                (todayPlan.tasks || todayPlan.plans || []).slice(0, 3).map((plan) => {
                  const factors = plan.adaptation_metadata?.driving_factors || [];
                  const isCompleted = plan.status === 'COMPLETED';
                  const isInProgress = plan.status === 'IN_PROGRESS';
                  const isMissed = plan.status === 'MISSED';

                  let timeSlotText = `${plan.planned_minutes}m`;
                  if (plan.start_time && plan.end_time) {
                    const startStr = new Date(plan.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const endStr = new Date(plan.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    timeSlotText = `${startStr} - ${endStr}`;
                  }

                  return (
                    <div
                      key={plan.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isCompleted
                          ? 'bg-slate-50/70 border-slate-200 opacity-80'
                          : isInProgress
                          ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-2.5 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: plan.subjects?.color || plan.subject_color || '#4f46e5' }}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-bold uppercase text-slate-500 truncate">
                              {plan.subjects?.name || plan.subject_name}
                            </span>
                            <Badge variant={isCompleted ? 'success' : isInProgress ? 'primary' : isMissed ? 'danger' : 'neutral'} size="sm">
                              {plan.status}
                            </Badge>
                            {factors.includes('WEAK_PERFORMANCE') && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Brain className="w-2.5 h-2.5" /> Weak Topic
                              </span>
                            )}
                            {factors.includes('EXAM_APPROACHING') && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Calendar className="w-2.5 h-2.5" /> Exam Soon
                              </span>
                            )}
                            {factors.includes('MISSED_SESSIONS') && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                <Sparkles className="w-2.5 h-2.5" /> Recovery
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-semibold text-slate-900 truncate">
                            {plan.topics?.name || plan.topic_name}
                          </h5>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {timeSlotText}
                        </span>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant={isInProgress ? 'primary' : 'outline'}
                            icon={Play}
                            onClick={() => navigate(`/study?subjectId=${plan.subject_id}&topicId=${plan.topic_id}`)}
                          >
                            {isInProgress ? 'Resume' : 'Start'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
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
          {/* Real AI Study Recommendation Card (Phase 6) */}
          <Card className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 border-indigo-200 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">AI Study Advisor</span>
                </div>
                {aiAdvice && (
                  <Badge variant={aiAdvice.source === 'GEMINI_AI' ? 'primary' : 'neutral'} size="sm">
                    {aiAdvice.source === 'GEMINI_AI' ? 'Gemini AI' : 'Rule Fallback'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {aiAdvice ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {aiAdvice.summary}
                  </p>
                  {aiAdvice.recommendations && aiAdvice.recommendations.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs">
                      <span className="font-bold text-slate-900">
                        {aiAdvice.recommendations[0].topic}
                      </span>
                      <p className="text-slate-600 mt-0.5">{aiAdvice.recommendations[0].action}</p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => navigate('/ai')}
                  >
                    Open AI Assistant
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Get personalized topic prioritization and study strategies grounded in your academic progress.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full text-xs"
                    onClick={fetchAIAdvice}
                    disabled={loadingAiAdvice}
                  >
                    {loadingAiAdvice ? 'Analyzing curriculum...' : 'Get AI Advice'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weak Topics Card (Phase 7 Real Topic Performance) */}
          <WeakTopicsCard limit={3} />

          {/* Student Intelligence & Analytics Preview Card (Phase 9) */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-slate-900">Study Intelligence</CardTitle>
                    <p className="text-[11px] text-slate-500">7-day performance snapshot</p>
                  </div>
                </div>
                <Badge variant="primary" size="sm">Phase 9</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-medium uppercase">Streak</p>
                  <p className="text-sm font-bold text-indigo-600">
                    {analyticsOverview?.study?.current_streak ?? 0}d 🔥
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-medium uppercase">Consistency</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {analyticsOverview?.study?.consistency_percentage ?? 0}%
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-medium uppercase">Adherence</p>
                  <p className="text-sm font-bold text-slate-800">
                    {analyticsOverview?.planner?.adherence_percentage ?? 0}%
                  </p>
                </div>
              </div>

              {analyticsOverview?.insights && analyticsOverview.insights.length > 0 && (
                <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span className="truncate">{analyticsOverview.insights[0].title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {analyticsOverview.insights[0].action || analyticsOverview.insights[0].message}
                  </p>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => navigate('/analytics')}
              >
                View Full Analytics & Insights
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
