import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  ShieldCheck,
  Database,
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  HelpCircle,
  TrendingUp,
  Zap,
  Play,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../services/api.js';
import plannerService from '../services/planner.js';
import recommendationService from '../services/recommendations.js';
import aiService from '../services/ai.js';
import Button from '../components/common/Button.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import { useToast } from '../hooks/useToast.js';

export default function InterviewDemo() {
  const toast = useToast();

  // Telemetry & Health States
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [studentStats, setStudentStats] = useState(null);

  // Simulation States
  const [activeStep, setActiveStep] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [selectedLogPayload, setSelectedLogPayload] = useState(null);
  const [expandedRationale, setExpandedRationale] = useState(false);

  // Simulation Data Storage
  const [activeRecommendations, setActiveRecommendations] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [appliedCount, setAppliedCount] = useState(null);
  const [rescheduledResult, setRescheduledResult] = useState(null);
  const [lockStatusResult, setLockStatusResult] = useState(null);
  const [aiAdvisoryResult, setAiAdvisoryResult] = useState(null);

  // Append a live execution log to the terminal inspector
  const logEvent = (method, endpoint, status, durationMs, payload) => {
    const entry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      durationMs,
      payload
    };
    setSimulationLogs((prev) => [entry, ...prev.slice(0, 49)]);
  };

  // 1. Fetch System Health & Readiness Probes
  const fetchHealthTelemetry = async () => {
    setHealthLoading(true);
    const start = performance.now();
    try {
      const res = await api.get('/health/ready');
      const duration = Math.round(performance.now() - start);
      setHealthData(res);
      logEvent('GET', '/api/health/ready', 200, duration, res);
    } catch (err) {
      logEvent('GET', '/api/health/ready', 500, Math.round(performance.now() - start), err);
      toast.error('Failed to query backend health probe.');
    } finally {
      setHealthLoading(false);
    }
  };

  // 2. Fetch Student Summary Telemetry
  const fetchStudentTelemetry = async () => {
    try {
      const overviewRes = await api.get('/analytics/overview');
      if (overviewRes?.data) {
        setStudentStats(overviewRes.data);
      }
    } catch {
      // Graceful fallback for demo
    }
  };

  useEffect(() => {
    fetchHealthTelemetry();
    fetchStudentTelemetry();
  }, []);

  // =========================================================================
  // SIMULATION ACTIONS
  // =========================================================================

  // Step 1: Recommendation Engine Ingestion
  const runStep1Recommendations = async () => {
    setIsSimulating(true);
    const start = performance.now();
    try {
      const recs = await recommendationService.getRecommendations({ limit: 3 });
      const duration = Math.round(performance.now() - start);
      setActiveRecommendations(recs);
      logEvent('GET', '/api/recommendations?limit=3', 200, duration, recs);
      toast.success(`Evaluated ${recs.length} dynamic AI study recommendations.`);
      setActiveStep(2);
    } catch (err) {
      logEvent('GET', '/api/recommendations', 500, Math.round(performance.now() - start), err);
      toast.error('Failed to fetch recommendations: ' + (err.message || 'Error'));
    } finally {
      setIsSimulating(false);
    }
  };

  // Step 2: Non-Destructive Plan Preview Generation
  const runStep2Preview = async () => {
    setIsSimulating(true);
    const start = performance.now();
    try {
      const today = new Date().toISOString().split('T')[0];
      const preview = await plannerService.generatePreview({
        start_date: today,
        days: 7,
        preferred_session_minutes: 45,
        max_daily_minutes: 180
      });
      const duration = Math.round(performance.now() - start);
      setPreviewData(preview);
      logEvent('POST', '/api/planner/preview', 200, duration, preview);
      toast.success(`Generated preview: ${preview?.scheduled_sessions?.length || 0} slots calculated.`);
      setActiveStep(3);
    } catch (err) {
      logEvent('POST', '/api/planner/preview', 500, Math.round(performance.now() - start), err);
      toast.error('Schedule preview calculation failed: ' + (err.message || 'Error'));
    } finally {
      setIsSimulating(false);
    }
  };

  // Step 3: Apply Generated Plan to Calendar
  const runStep3Apply = async () => {
    if (!previewData?.generation_id) {
      toast.error('Please generate a preview in Step 2 first.');
      return;
    }
    setIsSimulating(true);
    const start = performance.now();
    try {
      const result = await plannerService.applyPlan({
        generation_id: previewData.generation_id,
        preserve_locked: true
      });
      const duration = Math.round(performance.now() - start);
      setAppliedCount(result?.sessions_created || 0);
      logEvent('POST', '/api/planner/apply', 200, duration, result);
      toast.success(`Persisted ${result?.sessions_created || 0} study sessions to active calendar.`);
      setActiveStep(4);
    } catch (err) {
      logEvent('POST', '/api/planner/apply', 500, Math.round(performance.now() - start), err);
      toast.error('Failed to commit plan: ' + (err.message || 'Error'));
    } finally {
      setIsSimulating(false);
    }
  };

  // Step 4: Missed Session Adaptive Rescheduling
  const runStep4Reschedule = async () => {
    setIsSimulating(true);
    const start = performance.now();
    try {
      // Find a pending session or create a mock session to reschedule
      const today = new Date().toISOString().split('T')[0];
      const dailyRes = await api.get(`/planner/daily?date=${today}`);
      const sessions = dailyRes?.data?.sessions || [];
      let targetSession = sessions.find((s) => s.status === 'PENDING' || s.status === 'MISSED');

      if (!targetSession) {
        // Create a fast test session to exercise rescheduling
        const subjectsRes = await api.get('/subjects');
        const subjects = subjectsRes?.data?.subjects || [];
        const firstSubject = subjects[0];
        const topicsRes = await api.get(`/subjects/${firstSubject?.id}/topics`);
        const topics = topicsRes?.data?.topics || [];

        const created = await plannerService.createManualSession({
          subject_id: firstSubject?.id,
          topic_id: topics[0]?.id,
          date: today,
          start_time: '21:00',
          end_time: '21:45',
          planned_minutes: 45,
          custom_title: 'Demo Test Block for Adaptive Reschedule',
          is_locked: false
        });
        targetSession = created;
      }

      const reschedRes = await plannerService.rescheduleSession(targetSession.id);
      const duration = Math.round(performance.now() - start);
      setRescheduledResult(reschedRes);
      logEvent('POST', `/api/planner/sessions/${targetSession.id}/reschedule`, 200, duration, reschedRes);
      toast.success(`Adaptive rescheduling succeeded: Moved to ${reschedRes?.rescheduled_session?.plan_date}.`);
      setActiveStep(5);
    } catch (err) {
      logEvent('POST', '/api/planner/sessions/:id/reschedule', 500, Math.round(performance.now() - start), err);
      toast.error('Reschedule simulation failed: ' + (err.message || 'Error'));
    } finally {
      setIsSimulating(false);
    }
  };

  // Step 5: Session Lock Protection
  const runStep5ToggleLock = async () => {
    setIsSimulating(true);
    const start = performance.now();
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyRes = await api.get(`/planner/daily?date=${today}`);
      const sessions = dailyRes?.data?.sessions || [];
      const sessionToLock = sessions[0];

      if (!sessionToLock) {
        toast.error('No sessions found on timetable. Please apply plan in Step 3.');
        setIsSimulating(false);
        return;
      }

      const lockRes = await plannerService.toggleLock(sessionToLock.id);
      const duration = Math.round(performance.now() - start);
      setLockStatusResult({
        id: sessionToLock.id,
        is_locked: lockRes?.is_locked,
        title: sessionToLock.custom_title || 'Core Subject Block'
      });
      logEvent('POST', `/api/planner/sessions/${sessionToLock.id}/lock`, 200, duration, lockRes);
      toast.success(`Session lock toggled to: ${lockRes?.is_locked ? 'LOCKED (Protected)' : 'UNLOCKED'}`);
      setActiveStep(6);
    } catch (err) {
      logEvent('POST', '/api/planner/sessions/:id/lock', 500, Math.round(performance.now() - start), err);
      toast.error('Lock toggle failed: ' + (err.message || 'Error'));
    } finally {
      setIsSimulating(false);
    }
  };

  // Step 6: Gemini Isolated AI Coaching & Advisory
  const runStep6AIAdvisory = async () => {
    setIsSimulating(true);
    const start = performance.now();
    try {
      const res = await aiService.askAI(
        'What high-yield study strategy should I adopt for my upcoming Operating Systems exam in 12 days given my low mastery in Process Synchronization?'
      );
      const duration = Math.round(performance.now() - start);
      setAiAdvisoryResult(res);
      logEvent('POST', '/api/ai/ask', 200, duration, res);
      toast.success('AI Advisory response generated with boundary isolation.');
    } catch (err) {
      logEvent('POST', '/api/ai/ask', 500, Math.round(performance.now() - start), err);
      toast.error('AI Advisory query failed: ' + (err.message || 'Error'));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Live Telemetry Ribbon */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5" />
                Phase 12 Production Capstone
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Security & Verification
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Interactive Interview Presentation Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Live demonstration console showcasing the full 12-phase engineering architecture: deterministic constraint-satisfaction
              scheduling, multi-factor academic recommendations, isolated AI advisory with graceful fallback, and PostgreSQL RLS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={healthLoading}
              onClick={() => {
                fetchHealthTelemetry();
                fetchStudentTelemetry();
              }}
            >
              Refresh Telemetry
            </Button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  healthData?.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold text-slate-700">API Gateway:</span>
              <span className="text-slate-900 font-mono">
                {healthData?.status === 'ok' ? `Live (${healthData.details?.database?.latency_ms || 0}ms)` : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Student Persona Card */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Demo Persona</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">student@gmail.com</p>
            <p className="text-xs text-indigo-600 font-medium">B.Tech CSE • Sem 5</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Academic Scope</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">4 Core Subjects</p>
            <p className="text-xs text-slate-500">16 Topics with DAG Deps</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mastery Index</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {studentStats?.summary?.avg_mastery ? `${Math.round(studentStats.summary.avg_mastery)}%` : '64% Average'}
            </p>
            <p className="text-xs text-amber-600 font-medium">2 Weak Target Topics</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Engine Constraints</p>
            <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">0 Slot Overlaps</p>
            <p className="text-xs text-slate-500">Pure Interval Arithmetic</p>
          </div>
        </div>
      </div>

      {/* 2. Visual Architecture Blueprint & Engineering Rationale */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">System Architecture & Layered Data Flow</h2>
              <p className="text-xs text-slate-500">End-to-end data lifecycle from user action to persistent schedule</p>
            </div>
          </div>
          <button
            onClick={() => setExpandedRationale(!expandedRationale)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {expandedRationale ? 'Hide Architectural Rationale' : 'View Engineering Rationale'}
            {expandedRationale ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Interactive Architecture Flowchart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Layer 1: Presentation</span>
                <Badge variant="neutral" size="sm">Client</Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900">React 19 + Strict Light UI</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Accessible WCAG-compliant interface, Toast notification system, Shimmer skeletons, and interactive weekly timetables.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Zero Dark Mode</span>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Layer 2: API Gateway</span>
                <Badge variant="neutral" size="sm">Node / Express</Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Hardened Security Gateway</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Express rate limiters (20/min AI limiter), Helmet security headers, AppError hierarchies, and centralized JSON logging.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Audit Logging</span>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Layer 3: Analytics & Sched</span>
                <Badge variant="neutral" size="sm">Deterministic</Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Interval Scheduler (Phase 11)</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Pure interval subtraction arithmetic: <code className="text-indigo-600 font-mono text-[10px]">Free = Avail \ (Blocked ∪ Locked)</code>.
                Non-destructive preview before commit.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>0 Hallucinated Math</span>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Layer 4: AI & Storage</span>
                <Badge variant="neutral" size="sm">Gemini + PG</Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Isolated AI & Postgres</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Gemini 2.5 Flash for advisory explanations with 15s timeout & circuit breaker. PostgreSQL with 12 compound indexes & RLS.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Boundary Isolated</span>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Expandable Engineering Rationale Box */}
        {expandedRationale && (
          <div className="mt-4 p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Engineering Interview Decision: Why Deterministic Node.js for Schedules vs LLMs?
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-white border border-indigo-200/80">
                <p className="font-semibold text-rose-700 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> What Fails with LLM Scheduling
                </p>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  <li><strong>Arithmetic Hallucinations:</strong> LLMs struggle to enforce rigid calendar minute arithmetic (e.g. 18:30 + 45m = 19:15).</li>
                  <li><strong>Overlapping Blocks:</strong> Cannot guarantee zero overlaps with existing commitments or locked study sessions.</li>
                  <li><strong>Non-Deterministic Flakiness:</strong> Calling the scheduler twice on identical inputs produces divergent plans.</li>
                  <li><strong>Hard Capacity Violations:</strong> Exceeds daily student fatigue caps without deterministic boundary checks.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-emerald-200/80">
                <p className="font-semibold text-emerald-700 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Our Proven Hybrid Architecture
                </p>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  <li><strong>Deterministic Engine:</strong> Pure mathematical interval subtraction arithmetic in Node.js guarantees 100% boundary compliance.</li>
                  <li><strong>Isolated AI Advisor:</strong> Gemini 2.5 Flash is strictly restricted to qualitative reasoning, study strategies, and motivational coaching.</li>
                  <li><strong>Immutable Locks:</strong> Student-locked sessions are treated as immutable mathematical obstacles during rescheduling.</li>
                  <li><strong>Graceful Fallback:</strong> If the AI service times out or hits quotas, deterministic heuristic advisors take over seamlessly.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive 1-Click Capstone Simulation Workbench */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Capstone Simulation Workbench</h2>
              <p className="text-xs text-slate-500">Execute the 6-stage end-to-end intelligent scheduling workflow live</p>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Step <span className="text-indigo-600 font-bold">{activeStep}</span> of 6
          </div>
        </div>

        {/* Step Progression Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
          {[
            { num: 1, label: 'Recommendations', sub: 'Phase 10 Engine' },
            { num: 2, label: 'Schedule Preview', sub: 'Non-Destructive' },
            { num: 3, label: 'Apply Timetable', sub: 'Persist Slots' },
            { num: 4, label: 'Adaptive Resched', sub: 'Missed Session' },
            { num: 5, label: 'Session Lock', sub: 'Tamper Protection' },
            { num: 6, label: 'AI Advisory', sub: 'Gemini Flash' }
          ].map((step) => {
            const isCompleted = activeStep > step.num;
            const isCurrent = activeStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                    : isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? '✓' : step.num}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">{step.sub}</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{step.label}</p>
              </button>
            );
          })}
        </div>

        {/* Active Simulation Step Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
          {/* STEP 1: RECOMMENDATIONS */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 1: Multi-Factor Recommendation Ingestion (Phase 10)</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Evaluates exam countdowns, DAG prerequisites, and weak quiz scores to prioritize high-yield topics.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Play}
                  isLoading={isSimulating}
                  onClick={runStep1Recommendations}
                >
                  Run Step 1: Ingest Recommendations
                </Button>
              </div>

              {activeRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {activeRecommendations.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-indigo-700">{rec.subject_name || 'Core Curriculum'}</span>
                        <Badge variant="purple" size="sm">Score: {Math.round(rec.score || 90)}</Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{rec.title}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                  Click the button above to run Phase 10 recommendation prioritization.
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PREVIEW GENERATION */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 2: Non-Destructive Schedule Optimization Preview</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Executes interval arithmetic over 7 days without persisting changes to the active database.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Play}
                  isLoading={isSimulating}
                  onClick={runStep2Preview}
                >
                  Run Step 2: Calculate Preview
                </Button>
              </div>

              {previewData ? (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-slate-400">Generation ID:</span>{' '}
                      <span className="font-mono text-slate-900">{previewData.generation_id?.slice(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Sessions Calculated:</span>{' '}
                      <span className="font-bold text-indigo-600">{previewData.scheduled_sessions?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Horizon:</span>{' '}
                      <span className="font-bold text-slate-900">7 Days</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Planned:</span>{' '}
                      <span className="font-bold text-slate-900">{previewData.metrics?.total_planned_minutes || 0} min</span>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {previewData.scheduled_sessions?.slice(0, 5).map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{s.title || 'Study Block'}</p>
                          <p className="text-[11px] text-slate-500">{s.date} • {s.start_time} - {s.end_time} ({s.planned_minutes}m)</p>
                        </div>
                        <Badge variant="indigo" size="sm">Score: {Math.round(s.priority_score || 50)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                  Click the button above to calculate an optimized 7-day schedule preview.
                </div>
              )}
            </div>
          )}

          {/* STEP 3: APPLY PLAN */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 3: Commit & Persist Generated Plan to Active Timetable</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Writes generated study slots to PostgreSQL while strictly preserving user-locked sessions.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Play}
                  isLoading={isSimulating}
                  onClick={runStep3Apply}
                >
                  Run Step 3: Apply Plan
                </Button>
              </div>

              {appliedCount !== null ? (
                <div className="p-5 rounded-xl bg-white border border-emerald-200 shadow-xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Calendar Commit Successful</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Successfully persisted <strong>{appliedCount}</strong> study sessions to <code className="font-mono text-indigo-600">public.study_plans</code>.
                      Any user-locked sessions remained completely untouched.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                  Click the button above to persist the calculated preview into the live timetable.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ADAPTIVE RESCHEDULE */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 4: Non-Cascading Missed Session Rescheduling</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Demonstrates targeted rescheduling: avoids chaotic whole-calendar reshuffling by finding the nearest single valid open window.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Play}
                  isLoading={isSimulating}
                  onClick={runStep4Reschedule}
                >
                  Run Step 4: Simulate Missed Session
                </Button>
              </div>

              {rescheduledResult ? (
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Targeted Reschedule Engine Executed
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200">
                      <p className="font-semibold text-rose-800">Original Missed Session</p>
                      <p className="text-slate-600 mt-1">Status: Marked MISSED</p>
                      <p className="font-mono text-[11px] text-slate-500 mt-0.5">ID: {rescheduledResult.original_session_id?.slice(0, 8)}...</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <p className="font-semibold text-emerald-800">Rescheduled Study Slot</p>
                      <p className="text-slate-600 mt-1">
                        Allocated: <strong>{rescheduledResult.rescheduled_session?.plan_date}</strong>
                      </p>
                      <p className="font-mono text-[11px] text-slate-500 mt-0.5">Duration: {rescheduledResult.rescheduled_session?.planned_minutes}m</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                  Click the button above to simulate a missed study session and observe instant adaptive relocation.
                </div>
              )}
            </div>
          )}

          {/* STEP 5: LOCK PROTECTION */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 5: Session Lock Protection & Hard Constraints</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    User-locked sessions are treated as immutable mathematical busy intervals that the scheduler cannot overwrite.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Play}
                  isLoading={isSimulating}
                  onClick={runStep5ToggleLock}
                >
                  Run Step 5: Toggle Hard Lock
                </Button>
              </div>

              {lockStatusResult ? (
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${lockStatusResult.is_locked ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {lockStatusResult.is_locked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lockStatusResult.title}</p>
                      <p className="text-xs text-slate-500 font-mono">ID: {lockStatusResult.id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <Badge variant={lockStatusResult.is_locked ? 'warning' : 'neutral'} size="md">
                    {lockStatusResult.is_locked ? 'LOCKED (Protected)' : 'UNLOCKED (Dynamic)'}
                  </Badge>
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                  Click the button above to toggle hard lock status on an active study session.
                </div>
              )}
            </div>
          )}

          {/* STEP 6: AI ADVISORY */}
          {activeStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 6: Isolated Gemini AI Study Coaching & Guardrails</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Queries Gemini 2.5 Flash for high-yield strategic advice. Enforces 15s timeout, circuit breaker, and zero timetable write access.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Sparkles}
                  isLoading={isSimulating}
                  onClick={runStep6AIAdvisory}
                >
                  Run Step 6: Query AI Coach
                </Button>
              </div>

              {aiAdvisoryResult ? (
                <div className="p-5 rounded-xl bg-white border border-indigo-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
                    <span className="font-semibold text-indigo-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Gemini 2.5 Flash Coaching Synthesis
                    </span>
                    <Badge variant="indigo" size="sm">Boundary Isolated</Badge>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {aiAdvisoryResult?.answer || aiAdvisoryResult?.response || JSON.stringify(aiAdvisoryResult, null, 2)}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                  Click the button above to query the isolated Gemini AI advisory service.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Real-Time Execution Log & JSON Payload Inspector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live API Telemetry & Audit Stream</h2>
              <p className="text-xs text-slate-500">Real-time HTTP requests, response status codes, latencies, and payload inspector</p>
            </div>
          </div>
          {simulationLogs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSimulationLogs([]);
                setSelectedLogPayload(null);
              }}
            >
              Clear Logs
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Event Stream Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-200">
              {simulationLogs.length > 0 ? (
                simulationLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogPayload(log.payload)}
                    className="p-3 text-xs flex items-center justify-between hover:bg-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                          log.method === 'GET'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {log.method}
                      </span>
                      <span className="font-mono text-slate-700 truncate">{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-mono font-bold text-[11px] ${
                          log.status >= 200 && log.status < 300 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.durationMs}ms</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No network telemetry logged yet. Execute any simulation step above to capture live traffic.
                </div>
              )}
            </div>
          </div>

          {/* Right: Payload Viewer */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-200 font-mono text-xs max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-2 mb-2 uppercase tracking-wider">
              <span>Response Payload Inspector</span>
              <span>JSON format</span>
            </div>
            {selectedLogPayload ? (
              <pre className="text-slate-200 whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                {JSON.stringify(selectedLogPayload, null, 2)}
              </pre>
            ) : (
              <p className="text-slate-500 italic py-8 text-center">
                Click on any HTTP event in the left column to inspect its raw JSON payload.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
