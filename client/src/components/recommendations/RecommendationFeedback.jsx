import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

/**
 * RecommendationFeedback
 *
 * Lightweight user satisfaction controls for rating recommendations as HELPFUL or NOT_HELPFUL.
 */
export const RecommendationFeedback = ({
  recommendationId,
  currentFeedback,
  onFeedback,
  compact = false
}) => {
  const isHelpful = currentFeedback === 'HELPFUL';
  const isNotHelpful = currentFeedback === 'NOT_HELPFUL';

  return (
    <div className={`flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="text-slate-400 text-[11px] font-medium mr-1 select-none">
        Helpful?
      </span>
      <button
        type="button"
        onClick={() => onFeedback(recommendationId, isHelpful ? null : 'HELPFUL')}
        title="Mark recommendation as helpful"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
          isHelpful
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <ThumbsUp className={`w-3.5 h-3.5 ${isHelpful ? 'fill-emerald-600 text-emerald-600' : 'text-slate-500'}`} />
        {!compact && <span>Yes</span>}
      </button>
      <button
        type="button"
        onClick={() => onFeedback(recommendationId, isNotHelpful ? null : 'NOT_HELPFUL')}
        title="Mark recommendation as not helpful"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
          isNotHelpful
            ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <ThumbsDown className={`w-3.5 h-3.5 ${isNotHelpful ? 'fill-amber-600 text-amber-600' : 'text-slate-500'}`} />
        {!compact && <span>No</span>}
      </button>
    </div>
  );
};

export default RecommendationFeedback;
