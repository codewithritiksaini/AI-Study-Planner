import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Flame,
  Award
} from 'lucide-react';
import { studyService } from '../services/study.js';
import StudyTimer from '../components/study/StudyTimer.jsx';
import SessionReflectionModal from '../components/study/SessionReflectionModal.jsx';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal.jsx';
import AIStudyGuideCompanion from '../components/study/AIStudyGuideCompanion.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export const StudyRoom = () => {
  const { id: paramSessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Completion & cancellation states
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // 1. Fetch current active session
  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const active = await studyService.getActiveSession();

      if (active) {
        setSession(active);
      } else {
        // No active session in progress, redirect back to study overview
        navigate('/study', { replace: true });
      }
    } catch (err) {
      console.error('Failed to load focus session room:', err);
      setError('Unable to connect to study focus room.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // 2. Handle Complete Session
  const handleConfirmComplete = async (reflectionData) => {
    if (!session) return;
    setIsCompleting(true);

    try {
      await studyService.completeSession(session.id, reflectionData);
      setIsReflectionOpen(false);
      // Navigate back to /study to see today's velocity and updated history table
      navigate('/study', { replace: true });
    } catch (err) {
      console.error('Failed to save session reflection:', err);
      alert(err.message || 'Could not complete session');
    } finally {
      setIsCompleting(false);
    }
  };

  // 3. Handle Cancel Session
  const handleConfirmCancel = async () => {
    if (!session) return;
    setIsCancelling(true);

    try {
      await studyService.cancelSession(session.id);
      setIsCancelConfirmOpen(false);
      navigate('/study', { replace: true });
    } catch (err) {
      console.error('Failed to cancel session:', err);
      alert(err.message || 'Could not cancel session');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <LoadingSpinner size="lg" />
        <h3 className="text-base font-bold text-slate-800 mt-4">Opening Study Focus Room...</h3>
        <p className="text-xs text-slate-500 mt-1">Calibrating your AI study companion and live timer</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Session Not Available</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'No active focus session found.'}</p>
        <Link to="/study">
          <Button variant="primary" size="sm" icon={ArrowLeft}>
            Return to Study Overview
          </Button>
        </Link>
      </div>
    );
  }

  const {
    subject_name,
    subject_color = '#4f46e5',
    topic_name,
    topic_difficulty,
    topic_estimated_minutes,
    started_at
  } = session;

  const formattedStartTime = started_at
    ? new Date(started_at).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* STICKY TOP FOCUS CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Back Link & Subject / Topic Info */}
          <div className="flex items-center gap-3">
            <Link
              to="/study"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Study Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: subject_color }}
            >
              <BookOpen className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{subject_name}</span>
                {topic_difficulty && (
                  <Badge
                    variant={
                      topic_difficulty === 'HARD'
                        ? 'danger'
                        : topic_difficulty === 'EASY'
                        ? 'success'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {topic_difficulty}
                  </Badge>
                )}
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Started at {formattedStartTime}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-1">
                {topic_name || 'General Study Session'}
              </h2>
            </div>
          </div>

          {/* Center: Live Stopwatch Timer */}
          <div className="flex items-center justify-center bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-2xl shrink-0 self-center">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <StudyTimer startedAt={started_at} isActive={true} className="!text-2xl" />
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelConfirmOpen(true)}
              className="text-slate-600 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => setIsReflectionOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              Finish & Record Session
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTINUOUS UNIFIED STUDY GUIDE CANVAS (ALL SECTIONS ON ONE PAGE) */}
      {/* ========================================================================= */}
      <AIStudyGuideCompanion
        topicId={session.topic_id}
        subjectId={session.subject_id}
        topicName={session.topic_name}
        subjectName={session.subject_name}
        estimatedMinutes={session.topic_estimated_minutes || 20}
      />

      {/* ========================================================================= */}
      {/* BOTTOM FINISH ACTION BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-950">
              Finished Reading & Practicing?
            </h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              Lock in your study duration, record your confidence rating, and save to your study log.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={CheckCircle2}
          onClick={() => setIsReflectionOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs whitespace-nowrap"
        >
          Finish & Record Session
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      <SessionReflectionModal
        isOpen={isReflectionOpen}
        onClose={() => setIsReflectionOpen(false)}
        session={session}
        onSubmit={handleConfirmComplete}
        isSubmitting={isCompleting}
      />

      <DeleteConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Focus Session?"
        message="Are you sure you want to cancel this study session? Duration will not be recorded in your velocity metrics."
        confirmText="Cancel Session"
        cancelText="Keep Studying"
        isDeleting={isCancelling}
      />
    </div>
  );
};

export default StudyRoom;
