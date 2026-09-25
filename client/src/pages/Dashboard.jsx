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
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { subjectService } from '../services/subjects.js';
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

  useEffect(() => {
    let isMounted = true;
    const loadAcademicSummary = async () => {
      try {
        const data = await subjectService.getDashboardSummary();
        if (isMounted && data) {
          setSummary(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard academic summary:', err);
      } finally {
        if (isMounted) setLoadingSummary(false);
      }
    };

    loadAcademicSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  const studentName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const isProfileComplete = profile && profile.full_name && profile.branch && profile.semester && profile.target_cgpa && profile.daily_available_hours;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${studentName} 👋`}
        subtitle="Track your academic curriculum, syllabus completion, and exam preparation milestones."
        badge={<Badge variant="primary">{profile?.branch ? `${profile.branch} • Sem ${profile.semester || 1}` : 'Phase 3 Active'}</Badge>}
        action={
          <Button icon={Plus} onClick={() => navigate('/subjects')}>
            Manage Subjects
          </Button>
        }
      />

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

      {/* Metric Cards Row (Real Academic Data from Phase 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        <Card hover onClick={() => navigate('/subjects')} className="cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Syllabus Topics</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {loadingSummary ? '—' : summary.totalTopics}
                </span>
                <span className="text-[11px] text-violet-600 font-medium">Topics</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover onClick={() => navigate('/subjects')} className="cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">Overall Syllabus</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-slate-900">
                  {loadingSummary ? '—' : `${summary.overallSyllabusProgress}%`}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

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

                <p className="text-[11px] text-center text-slate-400 pt-2">
                  * Daily timetable generation and adaptive study slots activate in Phase 5.
                </p>
              </CardContent>
            </Card>
          )}
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
