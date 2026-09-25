import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Brain, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import PerformanceBadge from './PerformanceBadge.jsx';
import performanceService from '../../services/performance.js';

export const WeakTopicsCard = ({
  topics: propTopics = null,
  limit = 5,
  className = ''
}) => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState(propTopics || []);
  const [loading, setLoading] = useState(!propTopics);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propTopics !== null) {
      setTopics(propTopics);
      return;
    }

    let isMounted = true;
    async function loadWeakTopics() {
      try {
        setLoading(true);
        const data = await performanceService.getWeakTopics();
        if (isMounted) {
          setTopics(data || []);
        }
      } catch (err) {
        console.error('Failed to load weak topics:', err);
        if (isMounted) setError('Unable to load weak topics');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWeakTopics();
    return () => { isMounted = false; };
  }, [propTopics]);

  const displayedTopics = topics.slice(0, limit);

  return (
    <Card className={`border-slate-200 bg-white ${className}`}>
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Needs Attention ({topics.length})
            </CardTitle>
            <p className="text-xs text-slate-500">Topics with low quiz conceptual mastery</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2.5">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Analyzing topic performance...</span>
          </div>
        ) : error ? (
          <p className="text-xs text-rose-600 text-center py-3">{error}</p>
        ) : displayedTopics.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">No Weak Topics Detected!</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Your quiz mastery across assessed syllabus topics meets or exceeds the required benchmarks.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedTopics.map((t) => (
              <div
                key={t.topic_id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ 
                        backgroundColor: `${t.subject_color || '#4f46e5'}15`,
                        color: t.subject_color || '#4f46e5'
                      }}
                    >
                      {t.subject_name}
                    </span>
                    <PerformanceBadge level={t.performance_level} size="sm" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {t.topic_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Composite Score: <span className="font-semibold text-slate-800">{Math.round(t.composite_score)}%</span> &bull; {t.attempt_count} Attempt{t.attempt_count === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Brain}
                    className="text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                    onClick={() => navigate(`/quiz?subjectId=${t.subject_id}&topicId=${t.topic_id}`)}
                  >
                    Practice Quiz
                  </Button>
                </div>
              </div>
            ))}

            {topics.length > limit && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-slate-600 justify-center mt-2"
                onClick={() => navigate('/progress')}
              >
                View all {topics.length} weak topics
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeakTopicsCard;
