import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  Lightbulb, 
  Zap, 
  Loader2, 
  BookOpen, 
  CheckCircle2, 
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';

const STUDY_TIPS = [
  { icon: Sparkles, tip: "Active Recall: Testing yourself builds neural pathways up to 150% more effectively than passive re-reading." },
  { icon: Brain, tip: "Spaced Repetition: Quizzing concepts at structured intervals significantly flattens the forgetting curve." },
  { icon: Lightbulb, tip: "Interleaving Effect: Practicing diverse conceptual questions trains high-speed problem recognition." },
  { icon: Zap, tip: "Immediate Feedback: Reviewing detailed question explanations right after testing solidifies correct reasoning." }
];

export const QuizLoadingCard = ({
  topicName = '',
  subjectName = '',
  difficulty = 'MEDIUM',
  questionCount = 5,
  className = ''
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(20);
  const [tipIndex, setTipIndex] = useState(0);

  const loadingSteps = [
    { 
      label: 'Syllabus Scan', 
      title: 'Analyzing topic syllabus & difficulty calibration...', 
      sub: 'Scanning curriculum learning outcomes and prerequisite concepts' 
    },
    { 
      label: 'Question Draft', 
      title: 'Synthesizing scenario-based conceptual MCQs...', 
      sub: 'Formulating application-driven question stems and code/theory scenarios' 
    },
    { 
      label: 'Distractor Calibration', 
      title: 'Drafting plausible, realistic distractor options...', 
      sub: 'Crafting balanced options addressing common edge cases and pitfalls' 
    },
    { 
      label: 'Explanations', 
      title: 'Formulating step-by-step pedagogical explanations...', 
      sub: 'Generating deep conceptual rationales for both correct and distractor choices' 
    },
    { 
      label: 'Session Finalize', 
      title: 'Finalizing assessment & launching your interactive test...', 
      sub: 'Locking server-side answer keys and establishing your secure attempt session' 
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % loadingSteps.length);
      setProgress((prev) => Math.min(prev + 18, 96));
    }, 1200);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % STUDY_TIPS.length);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
  }, []);

  const CurrentTipIcon = STUDY_TIPS[tipIndex]?.icon || Sparkles;

  return (
    <div className={`space-y-4 animate-in fade-in duration-200 ${className}`}>
      {/* 1. Header Card matching QuizTakingCard Progress Banner */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Step {stepIndex + 1} of {loadingSteps.length}
                </span>
                {subjectName && (
                  <Badge variant="neutral" size="sm">
                    {subjectName}
                  </Badge>
                )}
                {topicName && (
                  <Badge variant="primary" size="sm">
                    {topicName}
                  </Badge>
                )}
                <Badge variant="neutral" size="sm">
                  {questionCount} Questions
                </Badge>
                <Badge variant="neutral" size="sm">
                  {difficulty}
                </Badge>
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Synthesizing Adaptive Knowledge Assessment
              </h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Preparing Test • {Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Full-width Shimmer Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 transition-all duration-300 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/40 skew-x-12 animate-shimmer" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Main Visual Synthesis Card matching QuizTakingCard Content Box */}
      <Card>
        <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6">
          {/* Glowing Animated Icon Centerpiece */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
            <div 
              className="absolute -inset-3 rounded-full border-2 border-dashed border-indigo-300 animate-spin" 
              style={{ animationDuration: '8s' }} 
            />
            <div 
              className="absolute -inset-6 rounded-full border border-violet-200/50 animate-ping opacity-30" 
              style={{ animationDuration: '3s' }} 
            />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-500 shadow-xl shadow-indigo-500/25 flex items-center justify-center text-white">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>
          </div>

          {/* Step Headline & Subtitle */}
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight min-h-[3rem] flex items-center justify-center transition-all duration-300">
              {loadingSteps[stepIndex].title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {loadingSteps[stepIndex].sub}
            </p>
          </div>

          {/* 5-Step Horizontal Progress Stepper (No 'Phase' keywords!) */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-4 w-full max-w-2xl pt-2">
            {loadingSteps.map((step, idx) => {
              const isDone = idx < stepIndex;
              const isCurrent = idx === stepIndex;
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div 
                    className={`w-full h-2 rounded-full transition-all duration-300 ${
                      isDone 
                        ? 'bg-emerald-500' 
                        : isCurrent 
                        ? 'bg-indigo-600 animate-pulse ring-2 ring-indigo-200' 
                        : 'bg-slate-200'
                    }`}
                  />
                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] font-bold ${
                      isCurrent 
                        ? 'text-indigo-600' 
                        : isDone 
                        ? 'text-emerald-700' 
                        : 'text-slate-400'
                    }`}>
                      Step {idx + 1}
                    </span>
                  </div>
                  <span className={`text-[10px] hidden md:inline leading-tight font-medium ${
                    isCurrent ? 'text-slate-800' : isDone ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Engaging Study Science Tip Box */}
          <div className="max-w-2xl w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-violet-50/70 border border-indigo-100 text-left flex items-start gap-4 shadow-2xs mt-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <CurrentTipIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100/70 px-2 py-0.5 rounded-md">
                  Study Science Insight
                </span>
                <span className="text-[11px] text-slate-400">• Tip #{tipIndex + 1}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium transition-all duration-300">
                {STUDY_TIPS[tipIndex]?.tip}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizLoadingCard;
