import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  HelpCircle,
  Calendar,
  RotateCcw,
  BookOpen,
  Clock,
  Scale,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  Target
} from 'lucide-react';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import RecommendationReason from './RecommendationReason.jsx';
import RecommendationFeedback from './RecommendationFeedback.jsx';

/**
 * Maps recommendation type to human-readable label and icon.
 */
const TYPE_CONFIG = {
  WEAK_TOPIC: {
    label: 'Weak Topic',
    icon: AlertTriangle,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  UNFINISHED_TOPIC: {
    label: 'In Progress',
    icon: BookOpen,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  EXAM_PREPARATION: {
    label: 'Exam Prep',
    icon: Calendar,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  REVISION: {
    label: 'Revision Due',
    icon: RotateCcw,
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200'
  },
  QUIZ_PRACTICE: {
    label: 'Quiz Practice',
    icon: HelpCircle,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  BACKLOG: {
    label: 'Plan Backlog',
    icon: Clock,
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  STUDY_BALANCE: {
    label: 'Study Balance',
    icon: Scale,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
};

/**
 * Maps priority tier to badge styles.
 */
const PRIORITY_CONFIG = {
  HIGH: {
    label: 'High Priority',
    style: 'bg-rose-50 text-rose-700 border-rose-300'
  },
  MEDIUM: {
    label: 'Medium Priority',
    style: 'bg-amber-50 text-amber-700 border-amber-300'
  },
  LOW: {
    label: 'Low Priority',
    style: 'bg-slate-100 text-slate-700 border-slate-300'
  }
};

export const RecommendationCard = ({
  recommendation,
  onComplete,
  onDismiss,
  onFeedback,
  compact = false
}) => {
  const navigate = useNavigate();
  const [showReason, setShowReason] = useState(!compact);

  if (!recommendation) return null;

  const {
    id,
    type,
    priority,
    priority_score,
    title,
    description,
    action_type,
    action_payload = {},
    estimated_duration_minutes,
    subjects,
    topics,
    user_feedback,
    status
  } = recommendation;

  const typeConfig = TYPE_CONFIG[type] || {
    label: type,
    icon: Target,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
  const TypeIcon = typeConfig.icon;

  // Subject color
  const subjectColor = subjects?.color || '#4f46e5';

  /**
   * Dispatches the primary direct action navigation based on action_type.
   */
  const handlePrimaryAction = () => {
    switch (action_type) {
      case 'START_TOPIC':
        if (action_payload?.subject_id && action_payload?.topic_id) {
          navigate(`/study?subjectId=${action_payload.subject_id}&topicId=${action_payload.topic_id}`);
        } else {
          navigate('/study');
        }
        break;
      case 'START_QUIZ':
        if (action_payload?.subject_id && action_payload?.topic_id) {
          navigate(`/quiz?subjectId=${action_payload.subject_id}&topicId=${action_payload.topic_id}`);
        } else {
          navigate('/quiz');
        }
        break;
      case 'OPEN_SUBJECT':
        if (action_payload?.subject_id) {
          navigate(`/subjects/${action_payload.subject_id}`);
        } else {
          navigate('/subjects');
        }
        break;
      case 'OPEN_PLANNER':
        navigate('/planner');
        break;
      default:
        navigate('/study');
    }
  };

  const getActionLabel = () => {
    switch (action_type) {
      case 'START_TOPIC':
        return 'Start Study Session';
      case 'START_QUIZ':
        return 'Take Quiz';
      case 'OPEN_SUBJECT':
        return 'View Subject';
      case 'OPEN_PLANNER':
        return 'Open Planner';
      default:
        return 'Start Now';
    }
  };

  const isCompleted = status === 'COMPLETED';

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isCompleted
          ? 'bg-slate-50/70 border-slate-200 opacity-75'
          : priority === 'HIGH'
          ? 'bg-white border-rose-200 shadow-xs hover:border-rose-300'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      } p-4 sm:p-5 flex flex-col justify-between gap-4`}
    >
      <div className="space-y-3">
        {/* Top Header: Category Badge, Priority Badge, Duration, and Quick Dismiss */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category / Type Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeConfig.badgeColor}`}
            >
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>

            {/* Priority Tier Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityConfig.style}`}
            >
              {priorityConfig.label}
              {priority_score !== undefined && (
                <span className="opacity-70 font-mono text-[10px]">({Math.round(priority_score)} pts)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Estimated Duration */}
            {estimated_duration_minutes > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {estimated_duration_minutes} min
              </span>
            )}

            {/* Dismiss Button (if active) */}
            {!isCompleted && onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(id)}
                title="Dismiss recommendation"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Dismiss recommendation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Subject & Topic Identity */}
        {(subjects?.name || topics?.name) && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            {subjects?.name && (
              <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: subjectColor }}
                />
                <span className="truncate">{subjects.name}</span>
              </span>
            )}
            {subjects?.name && topics?.name && <span className="text-slate-300">•</span>}
            {topics?.name && (
              <span className="truncate text-slate-700 font-medium max-w-[250px]">
                {topics.name}
              </span>
            )}
          </div>
        )}

        {/* Title & Description */}
        <div>
          <h4 className="text-base font-bold text-slate-900 leading-snug">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Verifiable Reason Section (Collapsible or visible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowReason((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1"
          >
            <span>{showReason ? 'Hide verified reason' : 'Why this recommendation?'}</span>
            {showReason ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showReason && (
            <div className="mt-2">
              <RecommendationReason recommendation={recommendation} compact={compact} />
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions: Complete, Primary Action Button & Feedback */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* User Helpfulness Feedback */}
        {onFeedback && (
          <RecommendationFeedback
            recommendationId={id}
            currentFeedback={user_feedback}
            onFeedback={onFeedback}
            compact={compact}
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {!isCompleted && onComplete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Check}
              onClick={() => onComplete(id)}
              className="text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              title="Mark as completed"
            >
              Done
            </Button>
          )}

          {!isCompleted && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={action_type === 'START_QUIZ' ? HelpCircle : Play}
              onClick={handlePrimaryAction}
              className="text-xs font-semibold whitespace-nowrap shadow-xs"
            >
              {getActionLabel()}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
