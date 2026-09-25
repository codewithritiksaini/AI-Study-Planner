import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Brain, Calendar, Sparkles, ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import Card, { CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="px-6 py-4 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">AI Study Planner</span>
          <Badge variant="primary" size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] ml-1">
            Phase 2 Active
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-xs font-semibold px-4 shadow-sm"
            >
              Open Dashboard
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          ) : (
            <>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-block">
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs font-semibold px-3.5 shadow-sm"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Intelligent Adaptive Learning System for CSE Students</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
          Never let a missed study session ruin your exam preparation.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          An adaptive study planner that organizes your engineering syllabus, tracks focused study sessions,
          identifies weak topics, and dynamically updates your study schedule based on real performance.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          {isAuthenticated ? (
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto text-base font-semibold px-6 py-3 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto text-base font-semibold px-6 py-3 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
              >
                <span>Create Student Account</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
              >
                Sign In
              </Button>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 max-w-4xl w-full text-left">
          <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3.5">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Deterministic Scheduler</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Slot allocation tailored to your daily available study hours and upcoming exam dates.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3.5">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Adaptive Feedback Loop</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Missed a session or scored low on a quiz? Future schedules adapt automatically without guilt.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Engineering Rigor</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Built with React, Express, Supabase PostgreSQL, and Google Gemini API for capstone excellence.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        AI Study Planner &bull; B.Tech CSE Capstone Project &bull; Light Theme Active
      </footer>
    </div>
  );
};

export default LandingPage;
