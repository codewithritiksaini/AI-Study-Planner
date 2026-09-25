import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  Brain,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Zap,
  BarChart3,
  BookOpen,
  Timer,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  MessageSquare,
  Check,
  Play,
  Award,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  FileCheck,
  Sliders,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does the adaptive timetable algorithm calculate my daily plan?',
      a: 'The algorithm evaluates three key factors: your target exam dates, your self-declared daily available study hours, and individual topic difficulty ratings. Instead of scheduling unrealistic multi-hour marathons, it segments your workload into 45-minute focused study sessions followed by mandatory 10-minute cognitive rest intervals. The arithmetic is 100% deterministic and runs locally with zero AI guesswork.'
    },
    {
      q: 'What happens when I miss a scheduled study block?',
      a: 'Zero guilt and zero manual rearranging. The adaptive rescheduling engine detects when a study block is uncompleted. Rather than letting topics pile up into an overwhelming backlog, the system automatically migrates the pending topic into your earliest open buffer slot within your weekly capacity horizon without disrupting finished work.'
    },
    {
      q: 'How does weak-topic identification work with the quizzes?',
      a: 'When you take a 5-question topic quiz, your answers are scored server-side. If your accuracy falls below 60%, the system tags that topic as "Weak Topic" and automatically increases its priority weight in your study schedule, ensuring you review gap areas before the exam.'
    },
    {
      q: 'Can I test both Student and Admin roles without creating an account?',
      a: 'Yes. On the Sign In page (/login), there are 1-click quick demo login buttons for both Student (student@gmail.com) and Administrator (wopipi3442@omanarts.com) that immediately authenticate you into the respective portal.'
    },
    {
      q: 'What is the purpose of the dedicated Admin Console?',
      a: 'The Admin Console gives academic administrators and professors complete platform oversight. It includes real-time PostgreSQL database latency telemetry, an enrolled student directory, and system health monitoring to ensure the scheduling engine operates under 25ms latency.'
    },
    {
      q: 'Why are 10-minute rest intervals strictly enforced?',
      a: 'Cognitive science consistently demonstrates that human working memory declines rapidly during continuous cramming beyond 45 minutes. A 10-minute recovery break allows neural consolidation of newly learned concepts, preventing mental exhaustion and maximizing long-term memory retention.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* ================= 1. HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 block leading-none">
                AI Study<span className="text-indigo-600">Planner</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Adaptive Academic OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#why-timetables-fail" className="hover:text-indigo-600 transition-colors">
              The Problem
            </a>
            <a href="#core-principles" className="hover:text-indigo-600 transition-colors">
              The Architecture
            </a>
            <a href="#platform-capabilities" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#portals" className="hover:text-indigo-600 transition-colors">
              Portals
            </a>
            <a href="#faqs" className="hover:text-indigo-600 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-xs font-bold px-4"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-700 hover:text-indigo-600">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold px-4 shadow-sm"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link to="/login">
              <Button variant="primary" size="sm" className="text-xs font-bold px-3 py-1.5">
                Sign In
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 bg-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-1">
            <a
              href="#why-timetables-fail"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              The Problem
            </a>
            <a
              href="#core-principles"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              The Architecture
            </a>
            <a
              href="#platform-capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Platform Features
            </a>
            <a
              href="#portals"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Student &amp; Admin Portals
            </a>
            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              FAQ
            </a>
          </div>
        )}
      </header>

      {/* ================= 2. HERO SECTION ================= */}
      <section className="pt-12 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* Shimmer Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-200 shadow-xs text-indigo-700 text-xs font-bold mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>The Academic Operating System</span>
          <span className="text-slate-300">•</span>
          <span className="text-indigo-600 font-extrabold flex items-center gap-1">
            Capacity-Aware Planning <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.14] max-w-4xl">
          Turn your university syllabus into daily, stress-free consistency.
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 max-w-3xl leading-relaxed">
          Most study plans fail not from lack of ambition, but because life is unpredictable. AI Study Planner converts semester syllabi into capacity-bounded daily study blocks, isolates conceptual gaps through diagnostic quizzes, and automatically reschedules missed sessions without guilt.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
          <Link to="/login" className="w-full sm:w-auto flex-1">
            <Button
              size="lg"
              variant="primary"
              className="w-full text-xs sm:text-sm font-bold py-3.5 px-6 shadow-md shadow-indigo-600/25 justify-center"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto flex-1">
            <Button
              size="lg"
              variant="outline"
              className="w-full text-xs sm:text-sm font-bold py-3.5 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 justify-center shadow-xs"
            >
              <Zap className="w-4 h-4 mr-1.5 text-amber-500 fill-amber-500" />
              <span>1-Click Quick Demo</span>
            </Button>
          </Link>
        </div>

        {/* Trust Points */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 w-full max-w-3xl flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-semibold">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Deterministic Math (0 Hallucinations)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automated 10m Cognitive Recovery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Server-Side Diagnostic Quizzes</span>
          </div>
        </div>

      </section>

      {/* ================= 3. EDITORIAL SECTION: THE PROBLEM ================= */}
      <section id="why-timetables-fail" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-200">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
            The Reality of Engineering Exams
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Why 90% of student timetables fail within 48 hours.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Every semester starts with good intentions: color-coded Notion templates, rigid spreadsheet grids, and ambitious 8-hour study schedules. Yet by the end of week one, the schedule is abandoned. Here is why conventional planning tools fail undergraduate students:
          </p>
        </div>

        {/* Problem Breakdown Prose */}
        <div className="space-y-8 text-slate-700">
          
          <div className="border-l-4 border-rose-500 pl-5 sm:pl-6 space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Trap 1: The 'Ideal Day' Fallacy &amp; Capacity Overestimation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Static planners assume you will have endless energy and unbroken free time every day. In reality, unexpected lab submissions, commuting delays, and mental fatigue shrink available study windows. When a student schedules 6 hours but only has 2 hours of true mental stamina, failure is mathematically guaranteed before they even begin.
            </p>
          </div>

          <div className="border-l-4 border-amber-500 pl-5 sm:pl-6 space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Trap 2: Passive Revision Bias (Studying What Feels Easy)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Without objective testing, human intuition defaults to comfort. Students repeatedly review chapters they already understand because it creates a false illusion of productivity, while avoiding high-weightage, difficult concepts (like Operating System Semaphores or DBMS Normalization) until the panic of exam eve.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-5 sm:pl-6 space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Trap 3: The Backlog Avalanche &amp; Schedule Guilt
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              On a static timetable, missing a single Tuesday study block breaks the entire semester calendar. The student must manually drag dozens of tasks forward, leading to an impossible snowball of overdue items. Most students simply abandon the schedule completely rather than face the emotional guilt of an unmanageable backlog.
            </p>
          </div>

        </div>
      </section>

      {/* ================= 4. THE 4 ARCHITECTURAL PILLARS (EDITORIAL DEEP DIVE) ================= */}
      <section id="core-principles" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-200">
        <div className="max-w-3xl mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
            The Solution
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            How AI Study Planner solves it: The 4 Core Principles.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Instead of acting as a passive to-do list, AI Study Planner combines mathematical constraint programming with proven cognitive psychology to create a resilient, self-healing study system.
          </p>
        </div>

        <div className="space-y-12">
          
          {/* Pillar 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
              <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center font-black text-[11px]">1</span>
              <span>Deterministic Capacity Allocation</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Hard time constraints that respect your human limits.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When you declare that you have 3 hours of available study time today, our algorithm treats that as an unbendable physical boundary. It computes non-overlapping session blocks fitted strictly inside that window, guaranteeing zero overbooking. Rather than relying on non-deterministic generative AI that hallucinates dates and overlaps hours, our constraint solver runs locally in under 25 milliseconds with mathematical certainty.
            </p>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs font-mono text-slate-700 space-y-1.5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Algorithm Priority Weight Function:
              </div>
              <div className="text-indigo-900 font-semibold">
                Priority = TopicDifficultyWeight × (1 / DaysToExam) × (1 - QuizAccuracy)
              </div>
              <div className="text-[11px] text-slate-500 font-sans">
                → Topics with near exam deadlines and lower quiz mastery scores are automatically allocated earliest.
              </div>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center font-black text-[11px]">2</span>
              <span>Cognitive Interval Pacing &amp; Rest Intervals</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Automated 10-minute pauses that defeat mental fatigue.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Research in cognitive psychology demonstrates that cramming for three uninterrupted hours causes severe memory decay after the 45-minute mark. AI Study Planner automatically spaces each study block with mandatory 10-minute rest intervals. This break is not wasted time—it is when your brain's working memory consolidates newly acquired information into long-term recall.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">45 Min Focus Sprint</span>
                <span className="text-slate-500 text-[11px]">High active recall with Pomodoro pacing.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 block">10 Min Rest Interval</span>
                <span className="text-emerald-700 text-[11px]">Synaptic recovery &amp; fatigue reset.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">Zero Afternoon Slump</span>
                <span className="text-slate-500 text-[11px]">Sustainable stamina across full semester.</span>
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
              <span className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center font-black text-[11px]">3</span>
              <span>Objective Knowledge Tracing via Diagnostic Quizzes</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Automatic weak-topic detection that directs your revision.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Instead of guessing which chapters you have mastered, the platform features 5-question diagnostic quizzes for each topic. Answers are graded server-side with instant feedback. If your score falls below 60%, the topic is automatically tagged as a "Weak Topic." The adaptive scheduler immediately elevates that topic into your next study session, turning conceptual vulnerabilities into strengths well before exam day.
            </p>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs">
              <div>
                <span className="text-rose-600 font-extrabold text-[11px] uppercase tracking-wider block">
                  Automated Threshold Logic
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  Quiz Score &lt; 60% → Priority Weight Multiplied by 2.0x
                </span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  High-scoring mastered topics yield their schedule time to topics that need genuine reinforcement.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 text-xs">
                  Weak Topic Alert
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-600 uppercase tracking-wider">
              <span className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center font-black text-[11px]">4</span>
              <span>Guilt-Free Dynamic Rescheduling</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              A self-healing schedule that absorbs real-world disruptions.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              If an unexpected lab assignment runs late or you fall sick on Wednesday evening, you never have to panic or manually reconstruct your calendar. With a single click, our dynamic rescheduling engine identifies open buffer slots in your upcoming days and reallocates the pending session smoothly. You maintain your momentum, protect your study streak, and eliminate the anxiety of falling behind.
            </p>
          </div>

        </div>
      </section>

      {/* ================= 5. FULL PLATFORM CAPABILITIES ================= */}
      <section id="platform-capabilities" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-200">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
            Features &amp; Toolset
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Everything built into the platform today.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            A comprehensive overview of every active tool accessible inside the student and administrator workspaces.
          </p>
        </div>

        {/* Detailed List View instead of repetitive cards */}
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          
          <div className="py-6 sm:py-7 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="md:w-1/3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h4 className="text-base font-bold text-slate-900">Adaptive Timetable Engine</h4>
              </div>
              <span className="text-xs font-semibold text-indigo-600 mt-0.5 block">
                Deterministic Solver
              </span>
            </div>
            <div className="md:w-2/3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Converts syllabus topic lists and upcoming university exam dates into non-overlapping study blocks. Dynamically spaces sessions across your available evening or morning hours, complete with automated 10-minute rest intervals.
            </div>
          </div>

          <div className="py-6 sm:py-7 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="md:w-1/3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-600" />
                <h4 className="text-base font-bold text-slate-900">Diagnostic Practice Quizzes</h4>
              </div>
              <span className="text-xs font-semibold text-rose-600 mt-0.5 block">
                Automated Knowledge Tracing
              </span>
            </div>
            <div className="md:w-2/3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              5-question interactive quizzes generated for each course topic. Graded with immediate answer feedback and explanations. Scores below 60% automatically flag the topic as weak and elevate its revision priority in the master schedule.
            </div>
          </div>

          <div className="py-6 sm:py-7 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="md:w-1/3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-violet-600" />
                <h4 className="text-base font-bold text-slate-900">1-Click Auto Rescheduling</h4>
              </div>
              <span className="text-xs font-semibold text-violet-600 mt-0.5 block">
                Guilt-Free Slot Migration
              </span>
            </div>
            <div className="md:w-2/3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Never let an unplanned disruption derail your semester. If you miss a scheduled session, the system calculates future open buffer zones and slides the pending topic forward without requiring manual calendar editing.
            </div>
          </div>

          <div className="py-6 sm:py-7 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="md:w-1/3">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-emerald-600" />
                <h4 className="text-base font-bold text-slate-900">Integrated Pomodoro Focus Timer</h4>
              </div>
              <span className="text-xs font-semibold text-emerald-600 mt-0.5 block">
                Active Session Telemetry
              </span>
            </div>
            <div className="md:w-2/3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Built directly into the study workspace with play, pause, and completion logging. Displays active session progress and triggers alerts when it is time to take a mandatory 10-minute mental recovery break.
            </div>
          </div>

          <div className="py-6 sm:py-7 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="md:w-1/3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h4 className="text-base font-bold text-slate-900">AI Academic Study Guidance</h4>
              </div>
              <span className="text-xs font-semibold text-blue-600 mt-0.5 block">
                Grounded Gemini Assistance
              </span>
            </div>
            <div className="md:w-2/3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              24/7 academic doubt clearance grounded strictly in your enrolled subjects. Ask questions on complex derivations, algorithms, or definitions and receive concise, structured explanations without random web hallucinations.
            </div>
          </div>

          <div className="py-6 sm:py-7 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="md:w-1/3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <h4 className="text-base font-bold text-slate-900">Syllabus Analytics &amp; Streaks</h4>
              </div>
              <span className="text-xs font-semibold text-amber-600 mt-0.5 block">
                Progress Telemetry
              </span>
            </div>
            <div className="md:w-2/3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Live visual dashboards tracking your daily study streaks, completed topic percentages per subject, logged focus hours, and historical quiz scores to ensure steady readiness as finals approach.
            </div>
          </div>

        </div>
      </section>

      {/* ================= 6. DUAL PORTAL ACCESS (STUDENT VS ADMIN) ================= */}
      <section id="portals" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-200">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
            Role-Based Access Control
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
            Two specialized portals designed for learning &amp; oversight.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            The platform enforces strict role-based separation between student study operations and administrator oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Student Portal Block */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <Badge variant="primary" size="sm">Student Role</Badge>
              </div>

              <h3 className="text-lg font-bold text-slate-900">Student Study Portal</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                The primary learning cockpit for undergraduate students. Manages subjects and chapters, computes daily study timetables, hosts the Pomodoro focus timer, diagnostic quizzes, and AI academic chat.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Interactive weekly study calendar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5-question diagnostic topic quizzes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pomodoro timer with session hour logging</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/login">
                <Button variant="outline" size="sm" className="w-full justify-center font-bold text-indigo-600 bg-slate-50 hover:bg-indigo-50/50">
                  <span>Sign In as Student (student@gmail.com)</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Admin Console Block */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <Badge variant="warning" size="sm">Admin Role</Badge>
              </div>

              <h3 className="text-lg font-bold text-slate-900">Platform Admin Console</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Dedicated management center for academic professors and system administrators. Provides live telemetry on PostgreSQL query speeds, user account audits, and curriculum constraint checks.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Live PostgreSQL query latency telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Enrolled student directory &amp; activity oversight</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Algorithm constraint &amp; database health auditing</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/login">
                <Button variant="outline" size="sm" className="w-full justify-center font-bold text-amber-700 bg-slate-50 hover:bg-amber-50/50">
                  <span>Sign In as Admin (wopipi3442@omanarts.com)</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ================= 7. FAQ ACCORDION ================= */}
      <section id="faqs" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-200 w-full">
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
            Common Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2.5">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                    activeFaq === idx ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= 8. FINAL CALL TO ACTION ================= */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-16 text-center w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ready to replace exam panic with predictable results?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Build your personalized study timetable in less than two minutes. Explore the platform using our 1-click demo accounts or create your own student profile.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" variant="primary" className="w-full sm:w-auto font-bold px-8 shadow-sm">
                <span>Start Planning Free</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                <Zap className="w-4 h-4 mr-1.5 text-amber-500 fill-amber-500" />
                <span>1-Click Demo Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 9. FOOTER ================= */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">AI Study Planner</span>
            <span>&bull; Adaptive Academic Operating System</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-xs text-slate-600">
            <a href="#why-timetables-fail" className="hover:text-slate-900 transition-colors">The Problem</a>
            <a href="#core-principles" className="hover:text-slate-900 transition-colors">Architecture</a>
            <a href="#platform-capabilities" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#portals" className="hover:text-slate-900 transition-colors">Portals</a>
            <a href="#faqs" className="hover:text-slate-900 transition-colors">FAQ</a>
            <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
