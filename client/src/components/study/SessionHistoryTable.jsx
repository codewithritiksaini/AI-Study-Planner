import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, BookOpen, Star, HelpCircle, FileText, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import EmptyState from '../common/EmptyState.jsx';

export const SessionHistoryTable = ({ sessions = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">
        Loading study session history...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No study sessions recorded yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Start your first focus session above. Once completed, your verified study time and reflections will appear here.
        </p>
      </div>
    );
  }

  const formatDuration = (mins) => {
    if (!mins || mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px]">
              <th className="py-3 px-4">Subject & Topic</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4 text-center">Duration</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Rating</th>
              <th className="py-3 px-4">Notes</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.map((s) => {
              const isCompleted = s.status === 'COMPLETED';
              return (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Subject & Topic */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.subject_color || '#4f46e5' }}
                      />
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">
                          {s.subject_name || 'Removed Subject'}
                        </p>
                        {s.topic_name && (
                          s.topic_id ? (
                            <Link
                              to={`/study/review/${s.topic_id}?subjectId=${s.subject_id || ''}&topicName=${encodeURIComponent(s.topic_name)}&subjectName=${encodeURIComponent(s.subject_name || '')}`}
                              className="text-[11px] text-slate-500 hover:text-indigo-600 hover:underline mt-0.5 line-clamp-1 transition-colors block font-medium"
                              title="Click to re-read and review this topic"
                            >
                              {s.topic_name}
                            </Link>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {s.topic_name}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {formatDate(s.started_at)}
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block font-mono font-bold ${
                      isCompleted ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {formatDuration(s.duration_minutes)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3 text-slate-400" /> Cancelled
                      </span>
                    )}
                  </td>

                  {/* Confidence / Difficulty Feedback */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {s.confidence_level ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {s.confidence_level}/5
                        </span>
                      ) : null}
                      {s.difficulty_feedback ? (
                        <Badge
                          variant={
                            s.difficulty_feedback === 'HARD'
                              ? 'danger'
                              : s.difficulty_feedback === 'EASY'
                              ? 'success'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {s.difficulty_feedback}
                        </Badge>
                      ) : null}
                      {!s.confidence_level && !s.difficulty_feedback && (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>
                  </td>

                  {/* Notes Snippet */}
                  <td className="py-3 px-4 max-w-[200px]">
                    {s.notes ? (
                      <p className="text-slate-600 text-xs truncate" title={s.notes}>
                        {s.notes}
                      </p>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Action: Re-read & Review */}
                  <td className="py-3 px-4 text-center">
                    {s.topic_id ? (
                      <Link
                        to={`/study/review/${s.topic_id}?subjectId=${s.subject_id || ''}&topicName=${encodeURIComponent(s.topic_name || '')}&subjectName=${encodeURIComponent(s.subject_name || '')}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-2xs whitespace-nowrap"
                        title="Re-read study guide, code examples & practice questions"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Re-read</span>
                      </Link>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionHistoryTable;
