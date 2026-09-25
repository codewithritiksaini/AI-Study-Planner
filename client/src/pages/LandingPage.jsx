import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Brain, Calendar, Sparkles, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card, { CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">AI Study Planner</span>
          <Badge variant="primary" size="sm" className="bg-indigo-950 text-indigo-300 border-indigo-800 text-[10px] ml-1">
            Phase 1
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs"
        >
          Open App
        </Button>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Intelligent Adaptive Learning System for CSE Students</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
          Never let a missed study session ruin your exam preparation.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          An adaptive study planner that organizes your engineering syllabus, tracks focused study sessions,
          identifies weak topics, and dynamically updates your study schedule based on real performance.
        </p>

        {/* CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto text-base font-semibold px-6 py-3 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/planner')}
            className="w-full sm:w-auto text-slate-300 border-slate-700 bg-slate-800/60 hover:bg-slate-800"
          >
            View Sample Planner
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-4xl w-full text-left">
          <Card className="bg-slate-800/60 border-slate-800 text-slate-300">
            <CardContent className="p-5">
              <Calendar className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="font-semibold text-white text-sm">Deterministic Scheduler</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Slot allocation tailored to your daily available study hours and upcoming exam dates.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-800 text-slate-300">
            <CardContent className="p-5">
              <Brain className="w-6 h-6 text-purple-400 mb-3" />
              <h3 className="font-semibold text-white text-sm">Adaptive Feedback Loop</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Missed a session or scored low on a quiz? Future schedules adapt automatically without guilt.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/60 border-slate-800 text-slate-300">
            <CardContent className="p-5">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white text-sm">Engineering Rigor</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Built with React, Express, Supabase PostgreSQL, and Google Gemini API for capstone excellence.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        AI Study Planner &bull; B.Tech CSE Capstone Project &bull; Phase 1 Foundation
      </footer>
    </div>
  );
};

export default LandingPage;
