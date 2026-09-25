import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, Edit2, Trash2, Play, Sparkles, Brain } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import PerformanceBadge from '../quiz/PerformanceBadge.jsx';

export const TopicItem = ({
  topic,
  onEdit,
  onDelete,
  onProgressChange,
  onGetStrategy
}) => {
  const navigate = useNavigate();
  const {
    id,
    name,
    description,
    difficulty = 'MEDIUM',
    estimated_minutes = 60,
    status = 'NOT_STARTED',
    completion_percentage = 0
  } = topic;

  const isCompleted = status === 'COMPLETED' || completion_percentage === 100;

  const handleToggleComplete = () => {
    const nextPercentage = isCompleted ? 0 : 100;
    onProgressChange(id, nextPercentage);
  };

  const renderDifficultyBadge = () => {
    switch (difficulty) {
      case 'EASY':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            Easy
          </span>
        );
      case 'HARD':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            Hard
          </span>
        );
      case 'MEDIUM':
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            Medium
          </span>
        );
    }
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            In Progress
          </span>
        );
      case 'NOT_STARTED':
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            Not Started
          </span>
        );
    }
  };

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-slate-50/60 border-slate-200'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Quick Complete Action Button */}
        <button
          onClick={handleToggleComplete}
          className="mt-0.5 p-0.5 rounded-full text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
          title={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
          aria-label={isCompleted ? 'Mark topic as incomplete' : 'Mark topic as complete'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : (
            <Circle className="w-5 h-5 hover:scale-110 transition-transform" />
          )}
        </button>

        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-semibold truncate ${
                isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
              }`}
            >
              {name}
            </h4>
            {renderDifficultyBadge()}
            {renderStatusBadge()}
            {topic.performance_level && (
              <PerformanceBadge level={topic.performance_level} size="sm" />
            )}
          </div>

          {description && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-1 leading-relaxed">
              {description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              {estimated_minutes} mins
            </span>

            {/* Inline Mini Progress Bar */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, completion_percentage))}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-600">
                {Math.round(completion_percentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row Action Buttons */}
      <div className="flex items-center justify-end gap-1 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
        <button
          onClick={() => navigate(`/study?subjectId=${topic.subject_id}&topicId=${topic.id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors shadow-2xs mr-1"
          title="Start Study Session on this Topic"
        >
          <Play className="w-3 h-3 fill-indigo-600" />
          Study
        </button>
        <button
          onClick={() => navigate(`/quiz?subjectId=${topic.subject_id}&topicId=${topic.id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors shadow-2xs mr-1"
          title="Practice AI Quiz for this Topic"
        >
          <Brain className="w-3 h-3 text-emerald-600" />
          Quiz
        </button>
        {onGetStrategy && (
          <button
            onClick={() => onGetStrategy(topic)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 transition-colors shadow-2xs mr-1"
            title="Get AI Study Strategy for this Topic"
          >
            <Sparkles className="w-3 h-3 text-violet-600" />
            AI Strategy
          </button>
        )}
        <button
          onClick={() => onEdit(topic)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Edit Topic"
          aria-label="Edit topic"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(topic)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete Topic"
          aria-label="Delete topic"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TopicItem;
