import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Check,
  Clock,
  Brain,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { getCuratedTopics } from '../../data/curriculumCatalog.js';
import { aiService } from '../../services/ai.js';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

export const SuggestedTopicsBar = ({
  subjectName,
  existingTopics = [],
  onAddTopic,
  disabled = false
}) => {
  const [aiTopics, setAiTopics] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [addingTopicName, setAddingTopicName] = useState(null);
  const [aiError, setAiError] = useState(null);

  const [hideAdded, setHideAdded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);

  // Extract existing topic names in lowercase for fast lookup
  const existingNamesSet = useMemo(() => {
    return new Set(
      (existingTopics || []).map((t) => (t?.name ? t.name.toLowerCase().trim() : ''))
    );
  }, [existingTopics]);

  // Instant pre-curated topics from catalog
  const curatedTopics = useMemo(() => {
    if (!subjectName) return [];
    return getCuratedTopics(
      subjectName,
      (existingTopics || []).map((t) => t.name)
    );
  }, [subjectName, existingTopics]);

  // Combined list of suggestions: Curated + AI suggestions (without duplicates)
  const displaySuggestions = useMemo(() => {
    const list = [...curatedTopics];
    const seen = new Set(list.map((t) => t.name.toLowerCase().trim()));

    aiTopics.forEach((t) => {
      const key = t.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          ...t,
          isAiGenerated: true,
          isAlreadyAdded: existingNamesSet.has(key)
        });
      }
    });

    return list;
  }, [curatedTopics, aiTopics, existingNamesSet]);

  const unaddedSuggestions = useMemo(() => {
    return displaySuggestions.filter((t) => !existingNamesSet.has(t.name.toLowerCase().trim()));
  }, [displaySuggestions, existingNamesSet]);

  const visibleSuggestions = useMemo(() => {
    if (hideAdded) {
      return unaddedSuggestions;
    }
    return displaySuggestions;
  }, [displaySuggestions, unaddedSuggestions, hideAdded]);

  const handleFetchAiTopics = async () => {
    if (!subjectName || loadingAi) return;
    setLoadingAi(true);
    setAiError(null);

    try {
      const existingTitles = (existingTopics || []).map((t) => t.name);
      const suggestions = await aiService.suggestTopics(subjectName, existingTitles);
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        setAiTopics(suggestions);
      } else {
        setAiError('No additional AI suggestions found for this subject.');
      }
    } catch (err) {
      console.error('Failed to get AI topic suggestions:', err);
      setAiError(err.response?.data?.error?.message || 'Could not fetch AI suggestions');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleQuickAdd = async (topic) => {
    if (disabled || addingTopicName || isAddingAll) return;
    setAddingTopicName(topic.name);
    try {
      await onAddTopic({
        name: topic.name,
        difficulty: topic.difficulty || 'MEDIUM',
        estimated_minutes: topic.estimated_minutes || 45,
        description: topic.description || ''
      });
    } catch (err) {
      console.error('Failed to quick add topic:', err);
    } finally {
      setAddingTopicName(null);
    }
  };

  const handleAddAllAvailable = async () => {
    if (disabled || isAddingAll || unaddedSuggestions.length === 0) return;
    setIsAddingAll(true);
    try {
      for (const topic of unaddedSuggestions) {
        await onAddTopic({
          name: topic.name,
          difficulty: topic.difficulty || 'MEDIUM',
          estimated_minutes: topic.estimated_minutes || 45,
          description: topic.description || ''
        });
      }
    } catch (err) {
      console.error('Failed to add all topics:', err);
    } finally {
      setIsAddingAll(false);
    }
  };

  // If there are no suggestions and no AI topics fetched yet, trigger AI fetch automatically once
  useEffect(() => {
    if (subjectName && curatedTopics.length === 0 && aiTopics.length === 0 && !loadingAi && !aiError) {
      handleFetchAiTopics();
    }
  }, [subjectName, curatedTopics.length]);

  if (!subjectName) return null;

  const addedCount = displaySuggestions.filter((t) => existingNamesSet.has(t.name.toLowerCase().trim())).length;
  const availableCount = unaddedSuggestions.length;

  return (
    <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50 to-violet-50/70 border border-indigo-100/80 rounded-2xl p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recommended Curriculum Topics
              </h3>
              {curatedTopics.length > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100/80 text-indigo-700">
                  Instant Syllabus Bank
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Click any high-yield topic below to instantly add it to your syllabus breakdown.
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {availableCount > 0 && !isCollapsed && (
            <button
              type="button"
              onClick={handleAddAllAvailable}
              disabled={isAddingAll || disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/70 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Add all remaining suggestions to syllabus breakdown"
            >
              {isAddingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Adding All...</span>
                </>
              ) : (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add All ({availableCount})</span>
                </>
              )}
            </button>
          )}

          {addedCount > 0 && !isCollapsed && (
            <button
              type="button"
              onClick={() => setHideAdded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
              title={hideAdded ? 'Show all topics' : 'Hide already added topics'}
            >
              {hideAdded ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Show All</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Hide Added</span>
                </>
              )}
            </button>
          )}

          {/* AI More Button */}
          <button
            type="button"
            onClick={handleFetchAiTopics}
            disabled={loadingAi || disabled || isAddingAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50/80 hover:border-indigo-300 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {loadingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5 text-indigo-600" />
                <span>{aiTopics.length > 0 ? 'Refresh AI' : '✨ AI Suggest More'}</span>
              </>
            )}
          </button>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1.5 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            aria-label={isCollapsed ? 'Expand suggestions' : 'Collapse suggestions'}
            title={isCollapsed ? 'Expand suggestions' : 'Collapse suggestions'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {aiError && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <span>{aiError}</span>
          <button
            onClick={() => setAiError(null)}
            className="text-amber-900 font-bold hover:underline cursor-pointer ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* When Collapsed, show compact summary */}
      {isCollapsed ? (
        <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-indigo-100/50">
          <span>
            {addedCount} topics in syllabus · {availableCount} suggestions waiting to be added
          </span>
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
          >
            Show Suggestions
          </button>
        </div>
      ) : (
        <>
          {/* Topics Horizontal / Grid Container (Scrollable Tray) */}
          {visibleSuggestions.length === 0 ? (
            <div className="bg-white/80 border border-slate-200/80 rounded-xl p-4 text-center">
              {loadingAi ? (
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Analyzing curriculum & generating high-yield topics...</span>
                </div>
              ) : hideAdded ? (
                <div className="text-xs text-slate-500">
                  <span>All available suggestions are already in your syllabus! </span>
                  <button
                    onClick={() => setHideAdded(false)}
                    className="text-indigo-600 font-semibold underline hover:text-indigo-800 cursor-pointer ml-1"
                  >
                    View All
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  <span>No quick suggestions available yet. Click </span>
                  <button
                    onClick={handleFetchAiTopics}
                    className="text-indigo-600 font-semibold underline hover:text-indigo-800 cursor-pointer"
                  >
                    ✨ AI Suggest More
                  </button>
                  <span> to generate customized topics.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {visibleSuggestions.map((topic, idx) => {
            const isAdded = existingNamesSet.has(topic.name.toLowerCase().trim());
            const isCurrentlyAdding = addingTopicName === topic.name;

            return (
              <div
                key={`${topic.name}-${idx}`}
                onClick={() => {
                  if (!isAdded && !disabled && !isCurrentlyAdding) {
                    handleQuickAdd(topic);
                  }
                }}
                className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
                  isAdded
                    ? 'bg-slate-100/60 border-slate-200/60 opacity-80 cursor-default'
                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 hover:shadow-xs cursor-pointer group'
                }`}
                title={isAdded ? 'Already added to syllabus' : 'Click to add to your syllabus breakdown'}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={`text-xs font-semibold leading-snug line-clamp-1 transition-colors ${
                        isAdded
                          ? 'text-slate-600 line-through'
                          : 'text-slate-900 group-hover:text-indigo-600'
                      }`}
                      title={topic.name}
                    >
                      {topic.name}
                    </span>
                    <Badge
                      variant={
                        topic.difficulty === 'HARD'
                          ? 'danger'
                          : topic.difficulty === 'MEDIUM'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {topic.difficulty || 'MED'}
                    </Badge>
                  </div>

                  {topic.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                      {topic.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {topic.estimated_minutes || 45}m
                  </span>

                  {isAdded ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      <Check className="w-3 h-3 text-emerald-600" />
                      In Syllabus
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(topic);
                      }}
                      disabled={disabled || isCurrentlyAdding}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      {isCurrentlyAdding ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Footer Summary / Quick Tip */}
      <div className="flex items-center justify-between mt-3 pt-2 text-[11px] text-slate-500 border-t border-indigo-100/50">
        <span>
          {addedCount > 0 ? (
            <strong className="text-slate-700 font-semibold">{addedCount} added</strong>
          ) : null}
          {addedCount > 0 && availableCount > 0 ? ' · ' : ''}
          {availableCount > 0 ? `${availableCount} suggested topics available to add` : ''}
        </span>
        <span className="hidden sm:inline text-slate-400">
          Want a custom topic? Use the <strong className="text-slate-600 font-medium">Add Topic</strong> drawer.
        </span>
      </div>
    </div>
  );
};

export default SuggestedTopicsBar;
