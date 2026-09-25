import React from 'react';
import { BookOpen, CheckCircle, XCircle, Clock, Tag } from 'lucide-react';
import StudyTimer from './StudyTimer.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';

export const ActiveSessionCard = ({
  session,
  onComplete,
  onCancel,
  isCompleting = false,
  isCancelling = false
}) => {
  if (!session) return null;

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
        minute: '2-digit',
        second: '2-digit'
      })
    : '';

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'EASY':
        return <Badge variant="success" size="sm">Easy</Badge>;
      case 'HARD':
        return <Badge variant="danger" size="sm">Hard</Badge>;
      default:
        return <Badge variant="warning" size="sm">Medium</Badge>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* Course & Topic Information Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ backgroundColor: subject_color }}
          >
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Subject</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Started at {formattedStartTime}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              {subject_name || 'General Subject'}
            </h2>
          </div>
        </div>

        {topic_name && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl sm:self-center">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Topic</span>
                {topic_difficulty && getDifficultyBadge(topic_difficulty)}
              </div>
              <p className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-[280px]">
                {topic_name}
              </p>
            </div>
            {topic_estimated_minutes && (
              <span className="text-xs text-slate-400 font-medium pl-2 border-l border-slate-200 whitespace-nowrap">
                ~{topic_estimated_minutes}m target
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Precision Timer */}
      <div className="py-10">
        <StudyTimer startedAt={started_at} isActive={true} />
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-100">
        <Button
          variant="primary"
          size="lg"
          icon={CheckCircle}
          onClick={onComplete}
          loading={isCompleting}
          disabled={isCompleting || isCancelling}
          className="w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          Finish & Record Session
        </Button>

        <Button
          variant="ghost"
          size="lg"
          icon={XCircle}
          onClick={onCancel}
          disabled={isCompleting || isCancelling}
          className="w-full sm:w-auto text-slate-500 hover:text-rose-600 hover:bg-rose-50"
        >
          Cancel Session
        </Button>
      </div>
    </div>
  );
};

export default ActiveSessionCard;
