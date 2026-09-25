import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { studyService } from '../services/study.js';
import AIStudyGuideCompanion from '../components/study/AIStudyGuideCompanion.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';

export const StudyReview = () => {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const subjectId = searchParams.get('subjectId') || '';
  const topicName = searchParams.get('topicName') || 'Curriculum Topic';
  const subjectName = searchParams.get('subjectName') || 'Curriculum Subject';

  const [isStarting, setIsStarting] = useState(false);

  // Handle starting a new timed study session for this topic
  const handleStartSession = async () => {
    if (!subjectId) {
      navigate('/study');
      return;
    }

    try {
      setIsStarting(true);
      const session = await studyService.startSession({
        subjectId,
        topicId: topicId || null
      });
      navigate(`/study/room/${session.id}`);
    } catch (err) {
      console.error('Failed to start new focus session from review mode:', err);
      navigate('/study');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================================================= */}
      {/* STICKY TOP REVISION HEADER BAR */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Back Link & Topic Details */}
          <div className="flex items-center gap-3">
            <Link
              to="/study"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Study Overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  📖 Topic Revision Mode
                </Badge>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-500 font-medium">{subjectName}</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-1 mt-0.5">
                {topicName}
              </h2>
            </div>
          </div>

          {/* Right: Action to start a new timed focus block */}
          <div className="flex items-center gap-2 justify-end">
            <Link to="/study">
              <Button variant="outline" size="sm" className="text-xs text-slate-600">
                Back to History
              </Button>
            </Link>

            <Button
              variant="primary"
              size="sm"
              icon={Play}
              loading={isStarting}
              onClick={handleStartSession}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs whitespace-nowrap"
            >
              Start New Focus Session
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTINUOUS STUDY GUIDE CANVAS (Concept -> Multiple Examples -> Quiz) */}
      {/* ========================================================================= */}
      <AIStudyGuideCompanion
        topicId={topicId}
        subjectId={subjectId}
        topicName={topicName}
        subjectName={subjectName}
        estimatedMinutes={25}
      />
    </div>
  );
};

export default StudyReview;
