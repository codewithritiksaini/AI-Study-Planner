import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  Layers,
  ChevronRight,
  Flame,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { studyService } from '../services/study.js';
import { subjectService } from '../services/subjects.js';
import { topicService } from '../services/topics.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ActiveSessionCard from '../components/study/ActiveSessionCard.jsx';
import SessionReflectionModal from '../components/study/SessionReflectionModal.jsx';
import SessionHistoryTable from '../components/study/SessionHistoryTable.jsx';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal.jsx';

export const Study = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subjectId') || '';
  const initialTopicId = searchParams.get('topicId') || '';

  // Core session states
  const [activeSession, setActiveSession] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);

  // Subject and topic selection states
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId);

  // Aggregate stats & history
  const [todayStats, setTodayStats] = useState({ total_minutes: 0, session_count: 0, sessions: [] });
  const [historySessions, setHistorySessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Action states
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState(null);

  // 1. Initial Load: Active session, Subjects, Today's stats, and History
  const fetchActiveSession = useCallback(async () => {
    try {
      setLoadingActive(true);
      const session = await studyService.getActiveSession();
      setActiveSession(session);
    } catch (err) {
      console.error('Failed to load active study session:', err);
    } finally {
      setLoadingActive(false);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoadingSubjects(true);
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects for study selection:', err);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  const fetchTodayStats = useCallback(async () => {
    try {
      const data = await studyService.getTodaySessions();
      setTodayStats(data);
    } catch (err) {
      console.error('Failed to load today study metrics:', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await studyService.getSessionHistory({ page: 1, limit: 15 });
      setHistorySessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load study history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSession();
    fetchSubjects();
    fetchTodayStats();
    fetchHistory();
  }, [fetchActiveSession, fetchSubjects, fetchTodayStats, fetchHistory]);

  // 2. Fetch topics when selected subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setTopics([]);
      setSelectedTopicId('');
      return;
    }

    let isMounted = true;
    const loadTopics = async () => {
      try {
        setLoadingTopics(true);
        const data = await topicService.getTopics(selectedSubjectId);
        if (isMounted) {
          setTopics(data);
          // Preserve initialTopicId if it belongs to this subject, otherwise reset
          if (initialTopicId && data.some((t) => t.id === initialTopicId)) {
            setSelectedTopicId(initialTopicId);
          } else {
            setSelectedTopicId('');
          }
        }
      } catch (err) {
        console.error('Failed to load subject topics:', err);
      } finally {
        if (isMounted) setLoadingTopics(false);
      }
    };

    loadTopics();
    return () => {
      isMounted = false;
    };
  }, [selectedSubjectId, initialTopicId]);

  // 3. Handle Start Study Session
  const handleStartSession = async (e) => {
    e?.preventDefault();
    if (!selectedSubjectId) {
      setActionError('Please select a subject to study.');
      return;
    }

    setIsStarting(true);
    setActionError(null);

    try {
      const session = await studyService.startSession({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || null
      });
      setActiveSession(session);
    } catch (err) {
      console.error('Failed to start study session:', err);
      setActionError(err.response?.data?.error?.message || err.message || 'Could not start study session');
    } finally {
      setIsStarting(false);
    }
  };

  // 4. Handle Complete Session flow
  const handleOpenReflection = () => {
    setIsReflectionOpen(true);
  };

  const handleConfirmComplete = async (reflectionData) => {
    if (!activeSession) return;
    setIsCompleting(true);
    setActionError(null);

    try {
      await studyService.completeSession(activeSession.id, reflectionData);
      setActiveSession(null);
      setIsReflectionOpen(false);
      await Promise.all([fetchTodayStats(), fetchHistory()]);
    } catch (err) {
      console.error('Failed to complete study session:', err);
      setActionError(err.response?.data?.error?.message || err.message || 'Could not save study reflection');
    } finally {
      setIsCompleting(false);
    }
  };

  // 5. Handle Cancel Session flow
  const handleOpenCancelConfirm = () => {
    setIsCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!activeSession) return;
    setIsCancelling(true);
    setActionError(null);

    try {
      await studyService.cancelSession(activeSession.id);
      setActiveSession(null);
      setIsCancelConfirmOpen(false);
      await fetchHistory();
    } catch (err) {
      console.error('Failed to cancel study session:', err);
      setActionError(err.response?.data?.error?.message || err.message || 'Could not cancel study session');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatHoursMinutes = (totalMins) => {
    if (!totalMins || totalMins === 0) return '0h 0m';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Focus Mode & Live Study Room"
        subtitle="Record verified study activity, maintain single-task focus, and track academic velocity."
        badge={<Badge variant="primary">Phase 4 Active</Badge>}
      />

      {/* Error Alert Banner */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-semibold underline hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: Active Study Session (Or Start New Session Form) */}
      {/* ========================================================================= */}
      {loadingActive ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-slate-500 font-medium">Reconnecting to study session...</p>
        </div>
      ) : activeSession ? (
        <div className="space-y-4">
          <ActiveSessionCard
            session={activeSession}
            onComplete={handleOpenReflection}
            onCancel={handleOpenCancelConfirm}
            isCompleting={isCompleting}
            isCancelling={isCancelling}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Start Session Setup Form */}
          <div className="lg:col-span-2">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  Configure Your Study Session
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a curriculum course and topic to begin real-time duration tracking.
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {subjects.length === 0 && !loadingSubjects ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">No subjects available</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                      You need to add at least one subject in your curriculum before starting a study session.
                    </p>
                    <Link to="/subjects">
                      <Button size="sm" icon={ArrowRight}>
                        Go to Curriculum Subjects
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleStartSession} className="space-y-5">
                    {/* Subject Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Subject / Course <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs transition-colors"
                      >
                        <option value="">Select a subject...</option>
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.topic_count || 0} topics)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Syllabus Topic <span className="text-slate-400 font-normal lowercase">(recommended)</span>
                        </label>
                        {selectedSubjectId && (
                          <span className="text-[11px] text-slate-400">
                            {loadingTopics ? 'Loading topics...' : `${topics.length} topics available`}
                          </span>
                        )}
                      </div>
                      <select
                        value={selectedTopicId}
                        onChange={(e) => setSelectedTopicId(e.target.value)}
                        disabled={!selectedSubjectId || loadingTopics}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">
                          {!selectedSubjectId
                            ? 'First select a subject above'
                            : topics.length === 0
                            ? 'No specific topic (General Study)'
                            : 'Select a syllabus topic...'}
                        </option>
                        {topics.map((top) => (
                          <option key={top.id} value={top.id}>
                            {top.name} &bull; [{top.difficulty}] (~{top.estimated_minutes} mins)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic Overview Preview Pill */}
                    {selectedTopic && (
                      <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-900">Target Duration:</span>
                          <span className="text-indigo-700 font-medium">~{selectedTopic.estimated_minutes} minutes</span>
                        </div>
                        <Badge
                          variant={
                            selectedTopic.difficulty === 'HARD'
                              ? 'danger'
                              : selectedTopic.difficulty === 'EASY'
                              ? 'success'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {selectedTopic.difficulty}
                        </Badge>
                      </div>
                    )}

                    {/* Start Session Action Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        size="lg"
                        icon={Play}
                        loading={isStarting}
                        disabled={!selectedSubjectId || isStarting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs py-3"
                      >
                        Start Focus Session
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Today's Study Metrics Summary Card */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-indigo-50/50 to-white border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-indigo-700">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Today's Velocity</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <p className="text-xs font-medium text-slate-500">Study Time Today</p>
                  <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
                    {formatHoursMinutes(todayStats.total_minutes)}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {todayStats.session_count} {todayStats.session_count === 1 ? 'session' : 'sessions'} completed
                  </p>
                </div>

                <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
                  <p className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">&bull;</span>
                    Study duration is verified authoritative server timestamps.
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">&bull;</span>
                    Sessions persist safely across browser reloads or tab closures.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => navigate('/analytics')}
                  icon={BarChart3}
                >
                  View Full Analytics & Trends
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: Study History Log */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900">Study Activity History</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing recent verified study sessions
          </span>
        </div>

        <SessionHistoryTable
          sessions={historySessions}
          loading={loadingHistory}
        />
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Post-Session Reflection Modal */}
      <SessionReflectionModal
        isOpen={isReflectionOpen}
        onClose={() => !isCompleting && setIsReflectionOpen(false)}
        onSubmit={handleConfirmComplete}
        session={activeSession}
        isSubmitting={isCompleting}
      />

      {/* Cancel Session Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => !isCancelling && setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Study Session?"
        message="Are you sure you want to cancel this study session? The timer will be stopped and no study minutes will be recorded to your history."
        confirmText="Cancel Session"
        isDeleting={isCancelling}
      />
    </div>
  );
};

export default Study;
