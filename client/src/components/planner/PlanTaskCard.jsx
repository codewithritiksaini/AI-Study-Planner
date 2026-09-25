import React from 'react';
import { Clock, CheckCircle2, Play, SkipForward, AlertCircle, Sparkles, Brain, Target, Calendar } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

/**
 * PlanTaskCard
 * Clean, high-contrast light theme card representing a planned adaptive study block.
 * Shows subject, topic, time slot, planned minutes, priority score, explainable reason,
 * adaptive signal tags, status badge, and action triggers.
 */
export const PlanTaskCard = ({
  plan,
  onStart,
  onComplete,
  onSkip,
  isProcessing = false
}) => {
  const {
    id,
    start_time,
    end_time,
    planned_minutes,
    priority_score,
    reason,
    status,
    source,
    adaptation_metadata,
    subjects,
    topics
  } = plan;

  const subjectName = subjects?.name || plan.subject_name || 'Subject';
  const subjectColor = subjects?.color || plan.subject_color || '#4f46e5';
  const topicName = topics?.name || plan.topic_name || 'Study Topic';

  // Format time strings (e.g. 18:00 - 19:00)
  const formatTimeSlot = () => {
    if (!start_time || !end_time) return `${planned_minutes} mins`;
    const start = new Date(start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = new Date(end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  };

  // Determine priority badge styling
  const scoreNum = Number(priority_score) || 0;
  const getPriorityBadge = () => {
    if (scoreNum >= 0.70) {
      return <Badge variant="danger" size="sm">High Priority ({(scoreNum * 100).toFixed(0)}%)</Badge>;
    }
    if (scoreNum >= 0.40) {
      return <Badge variant="warning" size="sm">Medium Priority ({(scoreNum * 100).toFixed(0)}%)</Badge>;
    }
    return <Badge variant="neutral" size="sm">Standard Priority ({(scoreNum * 100).toFixed(0)}%)</Badge>;
  };

  // Status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="primary" size="sm">In Progress</Badge>;
      case 'SKIPPED':
        return <Badge variant="neutral" size="sm">Skipped</Badge>;
      case 'MISSED':
        return <Badge variant="danger" size="sm">Missed</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="neutral" size="sm">Pending</Badge>;
    }
  };

  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';
  const isSkipped = status === 'SKIPPED';
  const isMissed = status === 'MISSED';

  // Extract driving factors from adaptation metadata
  const drivingFactors = adaptation_metadata?.driving_factors || [];

  return (
    <div className={`p-5 rounded-xl border transition-all ${
      isCompleted
        ? 'bg-slate-50/70 border-slate-200 opacity-80'
        : isInProgress
        ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
        : isMissed
        ? 'bg-rose-50/30 border-rose-200 shadow-sm'
        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Subject, Topic & Details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Color Indicator */}
          <div
            className="w-2.5 h-14 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: subjectColor }}
          />

          <div className="flex-1 min-w-0">
            {/* Subject name, Badges & Adaptation chips */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 mr-1">
                {subjectName}
              </span>
              {getPriorityBadge()}
              {getStatusBadge()}

              {/* Adaptation Driving Factor Chips */}
              {drivingFactors.includes('WEAK_PERFORMANCE') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <Brain className="w-3 h-3" /> Weak Topic
                </span>
              )}
              {drivingFactors.includes('EXAM_APPROACHING') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Calendar className="w-3 h-3" /> Exam Soon
                </span>
              )}
              {drivingFactors.includes('MISSED_SESSIONS') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  <Sparkles className="w-3 h-3" /> Recovery
                </span>
              )}
            </div>

            {/* Topic Title */}
            <h4 className="text-base font-semibold text-slate-900 truncate">
              {topicName}
            </h4>

            {/* Scheduled Time & Duration */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {formatTimeSlot()}
              </span>
              <span>{planned_minutes} mins planned</span>
            </div>

            {/* Explainable Deterministic Reason */}
            {reason && (
              <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 leading-relaxed">
                💡 <span className="font-semibold text-slate-700">Why this task:</span> {reason}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {status === 'PENDING' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => onStart(plan)}
                disabled={isProcessing}
              >
                Start Study
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={CheckCircle2}
                onClick={() => onComplete(id)}
                disabled={isProcessing}
              >
                Complete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={SkipForward}
                onClick={() => onSkip(id)}
                disabled={isProcessing}
              >
                Skip
              </Button>
            </>
          )}

          {status === 'IN_PROGRESS' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => onStart(plan)}
                disabled={isProcessing}
              >
                Resume
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={CheckCircle2}
                onClick={() => onComplete(id)}
                disabled={isProcessing}
              >
                Finish
              </Button>
            </>
          )}

          {isCompleted && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Done
            </span>
          )}

          {isSkipped && (
            <span className="text-xs font-medium text-slate-400 italic">
              Task Skipped
            </span>
          )}

          {isMissed && (
            <Button
              variant="outline"
              size="sm"
              icon={Play}
              onClick={() => onStart(plan)}
              disabled={isProcessing}
            >
              Catch Up
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanTaskCard;
