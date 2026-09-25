import React, { useState, useEffect } from 'react';
import { 
  History, 
  ArrowRight, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Clock, 
  RotateCcw,
  Sparkles,
  BookOpen,
  FileText
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import PerformanceBadge from './PerformanceBadge.jsx';
import quizService from '../../services/quizzes.js';

export const QuizHistoryTable = ({
  onReviewAttempt,
  onStartNewQuiz,
  refreshTrigger = 0,
  className = ''
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.getQuizHistory(50);
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load quiz history:', err);
      setError('Unable to load quiz history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreBadge = (pct) => {
    if (pct >= 85) return <Badge variant="success">{Math.round(pct)}%</Badge>;
    if (pct >= 70) return <Badge variant="primary">{Math.round(pct)}%</Badge>;
    if (pct >= 50) return <Badge variant="warning">{Math.round(pct)}%</Badge>;
    return <Badge variant="danger">{Math.round(pct)}%</Badge>;
  };

  if (loading) {
    return (
      <Card className={`border-slate-200 bg-white ${className}`}>
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Loading quiz attempt history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-slate-200 bg-white ${className}`}>
        <CardContent className="p-8 text-center space-y-3">
          <p className="text-xs text-rose-600 font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className={`border-slate-200 bg-white ${className}`}>
        <CardContent className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="text-sm font-bold text-slate-900">No Quiz Attempts Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Test your knowledge by generating an AI quiz for any syllabus topic.
            </p>
          </div>
          {onStartNewQuiz && (
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={onStartNewQuiz}
              className="mt-2"
            >
              Generate First Quiz
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-slate-200 bg-white overflow-hidden shadow-sm ${className}`}>
      <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">Past Quiz Attempts</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Review detailed question responses, answer keys, and AI explanations.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {history.length} Attempt{history.length === 1 ? '' : 's'}
        </span>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-6">Quiz & Topic</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {history.map((att) => {
              const pct = Number(att.percentage || 0);

              return (
                <tr 
                  key={att.attempt_id} 
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3.5 px-6">
                    <div>
                      <p className="font-bold text-slate-900">{att.quiz_title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        {att.topic_name}
                      </p>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ 
                        backgroundColor: `${att.subject_color || '#4f46e5'}15`,
                        color: att.subject_color || '#4f46e5'
                      }}
                    >
                      {att.subject_name}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant="neutral" size="sm">
                      {att.quiz_difficulty || 'Medium'}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {getScoreBadge(pct)}
                      <span className="text-[11px] text-slate-500">
                        {att.score}/{att.max_score}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(att.submitted_at || att.started_at)}
                  </td>

                  <td className="py-3.5 px-6 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={FileText}
                      onClick={() => onReviewAttempt(att.attempt_id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border-indigo-200 shadow-2xs"
                    >
                      View Report
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default QuizHistoryTable;
