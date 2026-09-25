import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ThumbsUp,
  Clock,
  History,
  Check,
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useRecommendations } from '../hooks/useRecommendations.js';
import { subjectService } from '../services/subjects.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import RecommendationCard from '../components/recommendations/RecommendationCard.jsx';
import RecommendationFilters from '../components/recommendations/RecommendationFilters.jsx';

export const Recommendations = () => {
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'HISTORY'
  const [subjects, setSubjects] = useState([]);

  const {
    recommendations,
    history,
    metrics,
    filter,
    setFilter,
    loading,
    refreshing,
    historyLoading,
    error,
    refresh,
    complete,
    dismiss,
    submitFeedback,
    fetchHistory
  } = useRecommendations();

  // Load subject list for the dropdown filter
  useEffect(() => {
    async function loadSubjects() {
      try {
        const list = await subjectService.getSubjects();
        setSubjects(list || []);
      } catch (err) {
        console.error('Failed to load subjects for filter:', err);
      }
    }
    loadSubjects();
  }, []);

  // When switching to history tab, fetch history
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const activeCount = recommendations.length;
  const highPriorityCount = recommendations.filter((r) => r.priority === 'HIGH').length;
  const completionRate = metrics?.completion_rate ?? 0;
  const helpfulnessRate = metrics?.helpfulness_rate ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Study Recommendations
            </h1>
            <Badge variant="purple" size="md" className="font-semibold">
              Phase 10 Engine
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic, capacity-aware study actions ranked by exam urgency, weak topics, and study balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={RefreshCw}
            onClick={refresh}
            disabled={refreshing || loading}
            className="shadow-xs"
          >
            {refreshing ? 'Recalculating...' : 'Refresh Recommendations'}
          </Button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Actions
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {loading ? '...' : activeCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                High Priority
              </p>
              <h3 className="text-2xl font-bold text-rose-600 mt-0.5">
                {loading ? '...' : highPriorityCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completion Rate
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                {metrics ? `${completionRate}%` : '...'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Helpfulness
              </p>
              <h3 className="text-2xl font-bold text-violet-600 mt-0.5">
                {metrics ? `${helpfulnessRate}%` : '...'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher: Active Recommendations vs History */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'ACTIVE'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Active Recommendations</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'HISTORY'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Action History</span>
        </button>
      </div>

      {/* Tab 1: Active Recommendations */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <RecommendationFilters
            filter={filter}
            setFilter={setFilter}
            subjects={subjects}
          />

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              <p className="text-sm font-medium">Evaluating study telemetry and generating actions...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <Card className="bg-white border-slate-200 text-center py-12 px-4 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">All Recommendations Completed!</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                You have addressed all prioritized recommendations for your active subjects and topics.
                Take another quiz or run study sessions to trigger fresh insights.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button variant="primary" icon={RefreshCw} onClick={refresh}>
                  Re-evaluate Now
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onComplete={complete}
                  onDismiss={dismiss}
                  onFeedback={submitFeedback}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: History & Archive */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              <p className="text-sm">Loading recommendation archive...</p>
            </div>
          ) : history.length === 0 ? (
            <Card className="bg-white border-slate-200 text-center py-12 px-4">
              <History className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No History Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Completed and dismissed recommendations will be archived here for tracking your learning journey.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const isCompleted = item.status === 'COMPLETED';
                const isDismissed = item.status === 'DISMISSED';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={isCompleted ? 'success' : isDismissed ? 'neutral' : 'warning'}
                          size="sm"
                          className="font-bold text-[10px]"
                        >
                          {item.status}
                        </Badge>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          {item.type?.replace('_', ' ')}
                        </span>
                        {item.subjects?.name && (
                          <span className="text-xs font-semibold text-slate-700">
                            • {item.subjects.name}
                          </span>
                        )}
                        {item.estimated_duration_minutes > 0 && (
                          <span className="text-xs text-slate-400 font-mono">
                            • {item.estimated_duration_minutes}m
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{item.reason}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {item.completed_at && (
                        <span className="text-xs text-slate-400">
                          {new Date(item.completed_at).toLocaleDateString()}
                        </span>
                      )}
                      {item.user_feedback && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            item.user_feedback === 'HELPFUL'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.user_feedback === 'HELPFUL' ? '👍 Helpful' : '👎 Not Helpful'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
