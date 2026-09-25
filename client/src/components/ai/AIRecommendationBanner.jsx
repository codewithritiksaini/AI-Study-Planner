import React from 'react';
import { Sparkles, ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

/**
 * AIRecommendationBanner
 * Clean, light-themed advisory banner displaying Gemini's high-impact recommendations.
 */
export const AIRecommendationBanner = ({
  recommendation,
  onRefresh,
  isLoading = false
}) => {
  if (!recommendation) return null;

  const { summary, recommendations = [], study_strategy = [], source } = recommendation;
  const isAi = source === 'GEMINI_AI';

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/70 border border-indigo-200/90 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-700">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              AI Study Advisor
              <Badge variant={isAi ? 'primary' : 'neutral'} size="sm">
                {isAi ? 'Gemini 2.5 Flash' : 'Rule Engine Fallback'}
              </Badge>
            </h4>
            <p className="text-xs text-slate-500">Personalized strategy grounded in your current syllabus & exam urgency</p>
          </div>
        </div>

        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? 'Analyzing...' : 'Refresh Advice'}
          </Button>
        )}
      </div>

      {/* Summary Paragraph */}
      {summary && (
        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-indigo-100/80">
          {summary}
        </p>
      )}

      {/* Focus Topics Grid */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Recommended Focus Blocks
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase text-indigo-600">
                      {rec.subject || 'Course'}
                    </span>
                    <Badge variant="primary" size="sm">High Impact</Badge>
                  </div>
                  <h5 className="text-sm font-semibold text-slate-900">{rec.topic}</h5>
                  <p className="text-xs text-slate-600 font-medium mt-1">{rec.action}</p>
                </div>
                {rec.reason && (
                  <p className="text-[11px] text-slate-400 italic mt-2 pt-2 border-t border-slate-100">
                    💡 {rec.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Strategy Steps */}
      {study_strategy.length > 0 && (
        <div className="pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Tactical Study Steps for Today
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {study_strategy.map((step, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-white/90 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationBanner;
