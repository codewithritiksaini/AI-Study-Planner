import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
  X,
  Bot,
  Lightbulb,
  Loader2
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import analyticsService from '../../services/analytics.js';

/**
 * InsightsPanel
 * Renders prioritized deterministic student intelligence cards with optional
 * Gemini-powered educational coach synthesis.
 */
export const InsightsPanel = ({ insights = [], days = 30 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [error, setError] = useState(null);

  const hasInsights = insights && insights.length > 0;

  const handleExplain = async () => {
    setIsModalOpen(true);
    if (aiExplanation) return; // Already fetched for this state

    setIsLoadingAi(true);
    setError(null);
    try {
      const result = await analyticsService.explainInsights(days);
      setAiExplanation(result);
    } catch (err) {
      console.error('Failed to get AI insight explanation:', err);
      setError('Unable to fetch AI coaching explanation at this moment. Deterministic insights remain fully active.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'URGENT':
        return {
          cardStyle: 'border-red-200 bg-red-50/40 text-red-950',
          badgeVariant: 'danger',
          icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        };
      case 'WARNING':
        return {
          cardStyle: 'border-amber-200 bg-amber-50/40 text-amber-950',
          badgeVariant: 'warning',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        };
      case 'POSITIVE':
        return {
          cardStyle: 'border-emerald-200 bg-emerald-50/40 text-emerald-950',
          badgeVariant: 'success',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        };
      default:
        return {
          cardStyle: 'border-blue-200 bg-blue-50/40 text-blue-950',
          badgeVariant: 'neutral',
          icon: <Info className="w-4 h-4 text-blue-600 shrink-0" />
        };
    }
  };

  return (
    <>
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Student Intelligence & Insights</CardTitle>
              <p className="text-xs text-slate-500">Actionable academic feedback generated from your study metrics</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExplain}
            className="gap-1.5 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            AI Coach Synthesis
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          {!hasInsights ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-xs text-slate-400">
              <Lightbulb className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
              <p className="font-semibold text-slate-600">All clear! No current risk alerts</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Keep up the great study consistency and check back as you log more sessions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((ins, idx) => {
                const config = getSeverityConfig(ins.severity);
                return (
                  <div
                    key={ins.id || idx}
                    className={`p-3.5 rounded-xl border ${config.cardStyle} flex flex-col justify-between space-y-2`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {config.icon}
                          <h4 className="text-xs font-bold text-slate-900">{ins.title}</h4>
                        </div>
                        <Badge variant={config.badgeVariant} size="sm" className="text-[10px]">
                          {ins.severity}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ins.message}
                      </p>
                    </div>

                    {ins.action && (
                      <div className="pt-2 border-t border-slate-200/50 flex items-start gap-1.5 text-[11px] font-medium text-slate-800">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span><strong className="text-indigo-900">Recommended Action:</strong> {ins.action}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Coach Explanation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Study Coach Synthesis</h3>
                  <p className="text-xs text-slate-500">Holistic guidance based on your real performance</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {isLoadingAi ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-semibold text-slate-700">Synthesizing academic intelligence...</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Reviewing your study velocity, quiz mastery, and exam deadlines.
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Notice</p>
                  <p>{error}</p>
                </div>
              ) : aiExplanation ? (
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                        Coach Overview
                      </span>
                      <Badge variant="primary" size="sm" className="text-[10px]">
                        {aiExplanation.source === 'gemini' ? 'Gemini AI' : 'Deterministic Synthesis'}
                      </Badge>
                    </div>
                    <p className="leading-relaxed font-medium text-slate-800 text-xs">
                      {aiExplanation.summary}
                    </p>
                  </div>

                  {/* Prioritized Actionable Recommendations */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Strategic Priorities
                    </h5>
                    <div className="space-y-2">
                      {(aiExplanation.insights || []).map((ins, i) => (
                        <div
                          key={i}
                          className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{ins.title}</span>
                            <Badge variant={ins.severity === 'URGENT' ? 'danger' : 'neutral'} size="sm">
                              {ins.severity}
                            </Badge>
                          </div>
                          <p className="text-slate-600">{ins.message}</p>
                          {ins.action && (
                            <p className="text-indigo-700 font-semibold text-[11px] pt-1">
                              Action: {ins.action}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                AI Coach strictly analyzes verified student records.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InsightsPanel;
