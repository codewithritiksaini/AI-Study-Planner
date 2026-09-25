/**
 * useRecommendations.js
 *
 * Custom React hook for managing Phase 10 Recommendations state, actions,
 * filtering, feedback, and lifecycle transitions.
 */

import { useState, useEffect, useCallback } from 'react';
import recommendationService from '../services/recommendations.js';

export function useRecommendations(initialFilter = {}) {
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches active recommendations matching current filters.
   */
  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await recommendationService.getRecommendations(filter);
      setRecommendations(items);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  /**
   * Fetches summary metrics.
   */
  const fetchMetrics = useCallback(async () => {
    try {
      const data = await recommendationService.getMetricsSummary();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch recommendation metrics:', err);
    }
  }, []);

  /**
   * Fetches historical recommendations.
   */
  const fetchHistory = useCallback(async (params = {}) => {
    try {
      setHistoryLoading(true);
      const data = await recommendationService.getHistory(params);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch recommendation history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  /**
   * Force recalculates and regenerates recommendations.
   */
  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const freshItems = await recommendationService.refreshRecommendations();
      setRecommendations(freshItems);
      await fetchMetrics();
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
      setError(err?.message || 'Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  }, [fetchMetrics]);

  /**
   * Marks a recommendation as completed.
   */
  const complete = useCallback(async (id) => {
    try {
      // Optimistic removal from active list
      setRecommendations((prev) => prev.filter((item) => item.id !== id));
      await recommendationService.completeRecommendation(id);
      await fetchMetrics();
    } catch (err) {
      console.error('Failed to complete recommendation:', err);
      // Re-fetch on failure to restore consistency
      await fetchRecommendations();
    }
  }, [fetchRecommendations, fetchMetrics]);

  /**
   * Dismisses a recommendation with optional reason.
   */
  const dismiss = useCallback(async (id, reason) => {
    try {
      // Optimistic removal from active list
      setRecommendations((prev) => prev.filter((item) => item.id !== id));
      await recommendationService.dismissRecommendation(id, reason);
      await fetchMetrics();
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
      // Re-fetch on failure to restore consistency
      await fetchRecommendations();
    }
  }, [fetchRecommendations, fetchMetrics]);

  /**
   * Submits user feedback (HELPFUL / NOT_HELPFUL).
   */
  const submitFeedback = useCallback(async (id, feedbackType) => {
    try {
      // Optimistic local state update
      setRecommendations((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, user_feedback: feedbackType } : item
        )
      );
      await recommendationService.submitFeedback(id, feedbackType);
      await fetchMetrics();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  }, [fetchMetrics]);

  // Initial load on mount or when filter changes
  useEffect(() => {
    fetchRecommendations();
    fetchMetrics();
  }, [fetchRecommendations, fetchMetrics]);

  return {
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
    fetchHistory,
    refetch: fetchRecommendations
  };
}

export default useRecommendations;
