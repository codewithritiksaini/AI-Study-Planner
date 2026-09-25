import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import PerformanceBadge from './PerformanceBadge.jsx';
import performanceService from '../../services/performance.js';

export const StrongTopicsCard = ({
  topics: propTopics = null,
  limit = 5,
  className = ''
}) => {
  const [topics, setTopics] = useState(propTopics || []);
  const [loading, setLoading] = useState(!propTopics);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propTopics !== null) {
      setTopics(propTopics);
      return;
    }

    let isMounted = true;
    async function loadStrongTopics() {
      try {
        setLoading(true);
        const data = await performanceService.getStrongTopics();
        if (isMounted) {
          setTopics(data || []);
        }
      } catch (err) {
        console.error('Failed to load strong topics:', err);
        if (isMounted) setError('Unable to load mastered topics');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStrongTopics();
    return () => { isMounted = false; };
  }, [propTopics]);

  const displayedTopics = topics.slice(0, limit);

  return (
    <Card className={`border-slate-200 bg-white ${className}`}>
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Mastered Topics ({topics.length})
            </CardTitle>
            <p className="text-xs text-slate-500">Topics with high retention (&ge;85% composite score)</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2.5">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading mastered topics...</span>
          </div>
        ) : error ? (
          <p className="text-xs text-rose-600 text-center py-3">{error}</p>
        ) : displayedTopics.length === 0 ? (
          <div className="py-6 text-center space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">No Mastered Topics Yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Score 85% or higher on quizzes to achieve mastery status for your topics.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedTopics.map((t) => (
              <div
                key={t.topic_id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all flex items-center justify-between gap-2.5"
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
                    <PerformanceBadge level="STRONG" size="sm" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {t.topic_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.attempt_count} Attempt{t.attempt_count === 1 ? '' : 's'} &bull; Last assessed: {t.last_assessed_at ? new Date(t.last_assessed_at).toLocaleDateString() : 'Recent'}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-base font-extrabold text-emerald-600">
                    {Math.round(t.composite_score)}%
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">Mastery</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StrongTopicsCard;
