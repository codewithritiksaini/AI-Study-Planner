import React from 'react';
import { BookOpen, Calendar, Clock, Target, CheckCircle2 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';

/**
 * SubjectProgress
 * Visualizes syllabus completion, exam countdown, and workload per subject.
 */
export const SubjectProgress = ({ subjects = [] }) => {
  const hasSubjects = subjects && subjects.length > 0;

  const renderExamBadge = (subject) => {
    if (subject.days_until_exam === null || subject.days_until_exam === undefined) {
      return (
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-300" />
          No exam scheduled
        </span>
      );
    }

    const days = subject.days_until_exam;
    if (days < 0) {
      return (
        <Badge variant="neutral" size="sm" className="text-[10px]">
          Exam Passed
        </Badge>
      );
    }

    if (days === 0) {
      return (
        <Badge variant="danger" size="sm" className="animate-pulse font-bold text-[10px]">
          Exam Today!
        </Badge>
      );
    }

    if (days <= 7) {
      return (
        <Badge variant="danger" size="sm" className="font-semibold text-[10px]">
          Exam in {days}d
        </Badge>
      );
    }

    if (days <= 14) {
      return (
        <Badge variant="warning" size="sm" className="font-semibold text-[10px]">
          Exam in {days}d
        </Badge>
      );
    }

    return (
      <Badge variant="primary" size="sm" className="font-semibold text-[10px]">
        Exam in {days}d
      </Badge>
    );
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Subject Syllabus Progress</CardTitle>
            <p className="text-xs text-slate-500">Curriculum completion and exam readiness</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
        </span>
      </CardHeader>

      <CardContent className="pt-4">
        {!hasSubjects ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-slate-400">
            <BookOpen className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            <p className="font-semibold text-slate-600">No subjects created yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Add your university courses in Subjects to track syllabus completion
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {subjects.map((sub) => {
              const compPct = sub.completion_percentage || 0;
              const remainingHours = sub.remaining_estimated_minutes
                ? (sub.remaining_estimated_minutes / 60).toFixed(1)
                : 0;

              return (
                <div
                  key={sub.subject_id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/40 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: sub.color || '#6366f1' }}
                      />
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {sub.subject_name}
                      </h4>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {renderExamBadge(sub)}
                      <span className="text-xs font-bold text-slate-800">
                        {compPct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${compPct}%`,
                        backgroundColor: sub.color || '#6366f1'
                      }}
                    />
                  </div>

                  {/* Footer details */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-slate-400" />
                      {sub.completed_topics} / {sub.total_topics} topics
                    </span>

                    <div className="flex items-center gap-3">
                      {sub.target_score && (
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Target className="w-3 h-3 text-slate-400" />
                          Target: {sub.target_score}%
                        </span>
                      )}
                      {Number(remainingHours) > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          ~{remainingHours}h remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectProgress;
