import React from 'react';
import { Play, Pause, Square, Sparkles, Volume2, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';

export const Study = () => {
  return (
    <div>
      <PageHeader
        title="Active Study Mode (Focus Room)"
        subtitle="Distraction-free environment with live duration tracking and post-session reflection."
        badge={<Badge variant="primary">Phase 1 Preview</Badge>}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Focus Room Card */}
        <Card className="text-center p-8 bg-white border-slate-200 shadow-md">
          <Badge variant="purple" size="md" className="mb-4">
            Current Topic: BCNF & Lossless Decomposition
          </Badge>

          <h3 className="text-sm font-medium text-slate-500">Database Management Systems</h3>

          {/* Stopwatch / Timer Display Placeholder */}
          <div className="my-8">
            <div className="text-5xl sm:text-7xl font-mono font-extrabold tracking-tight text-slate-900 selection:bg-indigo-100">
              00:45:00
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Planned Duration: 45 Minutes</p>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" icon={Play} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Start Session
            </Button>
            <Button size="lg" variant="outline" icon={Pause} disabled>
              Pause
            </Button>
            <Button size="lg" variant="danger" icon={Square} disabled>
              End Session
            </Button>
          </div>

          <p className="text-[11px] text-slate-400 mt-6">
            * Persistent web-worker timer and live session recording will be activated in Phase 4.
          </p>
        </Card>

        {/* Post-Session Reflection Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Post-Session Reflection Preview</CardTitle>
            <p className="text-xs text-slate-500">
              Upon session completion, the application collects metrics to feed the Adaptive Engine:
            </p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Self-Rated Confidence</span>
              <div className="flex gap-1 text-slate-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center font-bold text-xs">
                    {star}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-medium text-slate-700">Topic Difficulty Feedback</span>
              <div className="flex gap-1.5">
                <Badge variant="success" size="sm">Easy</Badge>
                <Badge variant="warning" size="sm">Medium</Badge>
                <Badge variant="danger" size="sm">Hard</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Study;
