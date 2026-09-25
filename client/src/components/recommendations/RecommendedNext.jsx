import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Play,
  HelpCircle,
  Calendar,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Scale
} from 'lucide-react';
import recommendationService from '../../services/recommendations.js';
import Card, { CardHeader, CardContent } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import RecommendationReason from './RecommendationReason.jsx';
import RecommendationFeedback from './RecommendationFeedback.jsx';

export const RecommendedNext = ({ limit = 3 }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const items = await recommendationService.getRecommendations({ limit });
      setRecommendations(items);
    } catch (err) {
      console.error('Failed to load recommended next actions:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const freshItems = await recommendationService.refreshRecommendations();
      setRecommendations(freshItems.slice(0, limit));
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
      await recommendationService.completeRecommendation(id);
    } catch (err) {
      console.error('Failed to complete recommendation:', err);
      loadRecommendations();
    }
  };

  const handleFeedback = async (id, feedbackType) => {
    try {
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, user_feedback: feedbackType } : r))
      );
      await recommendationService.submitFeedback(id, feedbackType);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleAction = (item) => {
    const { action_type, action_payload = {} } = item;
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

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-white shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Recommended Next Actions</h3>
                <Badge variant="purple" size="sm" className="text-[10px] font-bold">
                  Adaptive Priority
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted study actions scored from your real exam dates, weak topics, and quiz performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Refresh recommendations"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <Link
              to="/recommendations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap ml-1"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs">Analyzing progress & prioritizing recommendations...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-6 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">You're All Caught Up!</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No urgent gaps or overdue topics detected. Continue following your schedule or generate more quiz attempts.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/planner')}
              className="mt-2 text-xs"
            >
              Open Adaptive Planner
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const isHigh = rec.priority === 'HIGH';
              const isMedium = rec.priority === 'MEDIUM';
              const isExpanded = expandedId === rec.id;

              return (
                <div
                  key={rec.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isHigh
                      ? 'bg-white border-rose-200 shadow-2xs hover:border-rose-300'
                      : isMedium
                      ? 'bg-white border-amber-200 shadow-2xs hover:border-amber-300'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Priority Badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isHigh
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isMedium
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {rec.priority} PRIORITY
                        </span>

                        {/* Subject Chip */}
                        {rec.subjects?.name && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 truncate max-w-[150px]">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: rec.subjects.color || '#4f46e5' }}
                            />
                            <span className="truncate">{rec.subjects.name}</span>
                          </span>
                        )}

                        {/* Estimated Duration */}
                        {rec.estimated_duration_minutes > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {rec.estimated_duration_minutes}m
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                        {rec.title}
                      </h4>

                      {/* Reason preview */}
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {rec.reason}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={() => handleAction(rec)}
                        className="text-xs whitespace-nowrap shadow-xs"
                      >
                        {rec.action_type === 'START_QUIZ'
                          ? 'Quiz'
                          : rec.action_type === 'OPEN_SUBJECT'
                          ? 'Review'
                          : rec.action_type === 'OPEN_PLANNER'
                          ? 'Planner'
                          : 'Start'}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleComplete(rec.id)}
                        title="Mark done"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Verifiable Reason toggle */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      {isExpanded ? 'Hide reason details' : 'Why recommended?'}
                    </button>

                    <RecommendationFeedback
                      recommendationId={rec.id}
                      currentFeedback={rec.user_feedback}
                      onFeedback={handleFeedback}
                      compact={true}
                    />
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5">
                      <RecommendationReason recommendation={rec} compact={true} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendedNext;
