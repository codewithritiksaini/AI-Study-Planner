import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, BarChart3 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import AnalyticsRangeSelector from '../components/analytics/AnalyticsRangeSelector.jsx';
import OverviewMetrics from '../components/analytics/OverviewMetrics.jsx';
import StudyTrendChart from '../components/analytics/StudyTrendChart.jsx';
import QuizTrendChart from '../components/analytics/QuizTrendChart.jsx';
import PlannerAdherence from '../components/analytics/PlannerAdherence.jsx';
import SubjectProgress from '../components/analytics/SubjectProgress.jsx';
import InsightsPanel from '../components/analytics/InsightsPanel.jsx';
import TopicAnalyticsTable from '../components/analytics/TopicAnalyticsTable.jsx';
import analyticsService from '../services/analytics.js';

/**
 * Analytics Page — Phase 9: Student Intelligence, Analytics & Insights
 * Central hub for student performance tracking, syllabus completion,
 * quiz trajectories, and deterministic educational insights.
 */
export const Analytics = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await analyticsService.getOverview(days);
      setData(result);
    } catch (err) {
      console.error('Failed to load student analytics:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to aggregate analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Student Intelligence & Analytics"
        subtitle="Data-driven progress tracking, plan adherence, quiz mastery, and actionable insights."
        badge={
          <Badge variant="primary" size="sm">
            Academic Analytics
          </Badge>
        }
        actions={
          <div className="flex items-center gap-3">
            <AnalyticsRangeSelector value={days} onChange={setDays} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOverview(true)}
              isLoading={refreshing}
              icon={RefreshCw}
              title="Refresh Analytics"
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Main Content Area */}
      {loading && !data ? (
        <div className="py-24 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <LoadingSpinner size="lg" message="Aggregating student intelligence & performance..." />
        </div>
      ) : error && !data ? (
        <ErrorState
          title="Analytics Unavailable"
          message={error}
          onRetry={() => fetchOverview(false)}
        />
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Top Core Statistical KPI Cards */}
          <OverviewMetrics study={data?.study} planner={data?.planner} />

          {/* 2. Visual Trends (Study Duration + Quiz Trajectory) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudyTrendChart data={data?.study?.daily} days={days} />
            <QuizTrendChart data={data?.quiz} days={days} />
          </div>

          {/* 3. Execution & Curriculum (Planner Adherence + Subject Syllabus) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlannerAdherence data={data?.planner} days={days} />
            <SubjectProgress subjects={data?.subjects} />
          </div>

          {/* 4. Actionable Intelligence Engine (Deterministic rules + optional AI coach) */}
          <InsightsPanel insights={data?.insights} days={days} />

          {/* 5. Granular Curriculum Table (Search & Filter) */}
          <TopicAnalyticsTable
            topics={data?.topics || []}
            subjects={data?.subjects || []}
          />
        </div>
      )}
    </div>
  );
};

export default Analytics;
