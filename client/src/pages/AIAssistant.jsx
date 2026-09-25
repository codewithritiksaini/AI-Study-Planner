import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  BookOpen,
  Calendar,
  Clock,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { aiService } from '../services/ai.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import AIRecommendationBanner from '../components/ai/AIRecommendationBanner.jsx';

export const AIAssistant = () => {
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRec, setLoadingRec] = useState(true);

  // Chat / Query state
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Study Advisor. Ask me anything about your current study plan, how to approach difficult topics, or how to allocate your remaining hours today.',
      source: 'GEMINI_AI'
    }
  ]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadInitialAdvice = async () => {
      try {
        setLoadingRec(true);
        const data = await aiService.getRecommendation();
        if (isMounted) setRecommendation(data);
      } catch (err) {
        console.error('Failed to load initial recommendation:', err);
      } finally {
        if (isMounted) setLoadingRec(false);
      }
    };

    loadInitialAdvice();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || asking) return;

    const userMsg = query.trim();
    setQuery('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAsking(true);

    try {
      const res = await aiService.askAI(userMsg);
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: res?.answer || 'I could not process your request at this moment.',
          source: res?.source || 'GEMINI_AI'
        }
      ]);
    } catch (err) {
      console.error('Ask AI error:', err);
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'AI services are temporarily unavailable. Please refer to your timetable on the Planner page.',
          source: 'FALLBACK_RULE_ENGINE'
        }
      ]);
    } finally {
      setAsking(false);
    }
  };

  const samplePrompts = [
    'I only have 45 minutes today. What should I study?',
    'What should I prioritize for my upcoming exams?',
    'How should I approach difficult theoretical topics?'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Study Advisor"
        subtitle="Context-aware study guidance, topic roadmaps, and personalized advice powered by Google Gemini 2.5 Flash."
        badge={<Badge variant="primary">Phase 6 Active</Badge>}
      />

      {/* Top Section: Daily Recommendation Widget */}
      {loadingRec ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-xs">
          <LoadingSpinner size="md" />
          <p className="text-xs text-slate-500 mt-3 font-medium">Synthesizing personalized study recommendations...</p>
        </div>
      ) : (
        <AIRecommendationBanner
          recommendation={recommendation}
          onRefresh={async () => {
            setLoadingRec(true);
            try {
              const data = await aiService.getRecommendation();
              setRecommendation(data);
            } finally {
              setLoadingRec(false);
            }
          }}
          isLoading={loadingRec}
        />
      )}

      {/* Main Grid: Interactive Advisor Chat vs Guided Prompt Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Interactive Mentor Chat */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="flex flex-col h-[520px]">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-sm">Timetable-Grounded Study Q&A</CardTitle>
                  <p className="text-[11px] text-slate-500">Ask questions regarding your schedule, syllabus progress, and study velocity</p>
                </div>
              </div>
              <Badge variant="primary" size="sm">Grounded in DB</Badge>
            </CardHeader>

            {/* Chat Messages Log */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium">
                    {msg.sender === 'user' ? (
                      <span>You</span>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>AI Advisor</span>
                        {msg.source && (
                          <Badge variant={msg.source === 'GEMINI_AI' ? 'primary' : 'neutral'} size="xs">
                            {msg.source === 'GEMINI_AI' ? 'Gemini' : 'Fallback'}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {asking && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>AI Advisor</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 rounded-tl-none flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Analyzing your timetable and syllabus...</span>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Input Bar */}
            <form onSubmit={handleAskSubmit} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-b-2xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about your study schedule or syllabus topics..."
                maxLength={4000}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Send}
                disabled={!query.trim() || asking}
              >
                Send
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Suggested Prompt Chips & Architectural Safety Card */}
        <div className="space-y-4">
          {/* Sample Prompts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-slate-800">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm">Suggested Questions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(p)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 text-xs text-slate-700 transition-all font-medium leading-snug cursor-pointer shadow-2xs"
                >
                  "{p}"
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Architectural Guardrail Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Grounded AI Architecture
            </p>
            <p className="leading-relaxed">
              Gemini operates strictly as an <strong>intelligent advisor</strong>. It has zero direct write access to your database. Your study schedule is governed by the Phase 5 mathematical rule engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
