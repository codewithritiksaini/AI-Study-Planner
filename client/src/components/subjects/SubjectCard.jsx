import React from 'react';
import { BookOpen, Calendar, Target, CheckCircle2, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import Card, { CardContent } from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';

export const SubjectCard = ({
  subject,
  onEdit,
  onDelete,
  onClick
}) => {
  const {
    id,
    name,
    description,
    exam_date,
    target_score,
    color = '#4f46e5',
    topic_count = 0,
    completed_topic_count = 0,
    syllabus_progress_percentage = 0,
    days_until_exam
  } = subject;

  const renderExamBadge = () => {
    if (days_until_exam === null || days_until_exam === undefined) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
          <Calendar className="w-3 h-3" /> No Exam Set
        </span>
      );
    }
    if (days_until_exam < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
          <Calendar className="w-3 h-3" /> Exam Passed
        </span>
      );
    }
    if (days_until_exam === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full animate-pulse">
          <Calendar className="w-3 h-3 text-rose-600" /> Exam Today!
        </span>
      );
    }
    if (days_until_exam <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
          <Calendar className="w-3 h-3 text-amber-600" /> In {days_until_exam} days
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
        <Calendar className="w-3 h-3 text-indigo-600" /> In {days_until_exam} days
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform"
              style={{ backgroundColor: color }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1">
                {name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {renderExamBadge()}
              </div>
            </div>
          </div>

          {/* Action buttons (Edit & Delete) */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(subject);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Edit Subject"
              aria-label="Edit subject"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subject);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Subject"
              aria-label="Delete subject"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description Snippet */}
        {description && (
          <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Footer Metrics & Progress */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {completed_topic_count} / {topic_count} Topics
            </span>
            {target_score && (
              <span className="text-slate-400 font-normal">
                &bull; Target: {target_score}%
              </span>
            )}
          </div>
          <span className="font-bold text-slate-900">
            {Math.round(syllabus_progress_percentage)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, syllabus_progress_percentage))}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;
