import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Play
} from 'lucide-react';
import { studyService } from '../services/study.js';
import AIStudyGuideCompanion from '../components/study/AIStudyGuideCompanion.jsx';
import Button from '../components/common/Button.jsx';

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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ========================================================================= */}
      {/* MINIMAL TOP NAVIGATION BAR (STACK OVERFLOW / DOCS STYLE) */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link
            to="/study"
            className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Study Hub</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">{subjectName}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 font-medium">Topic Notes</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Play}
            loading={isStarting}
            onClick={handleStartSession}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs"
          >
            Start Focus Session
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTINUOUS PLAIN STUDY CONTENT */}
      {/* ========================================================================= */}
      <AIStudyGuideCompanion
        topicId={topicId}
        subjectId={subjectId}
        topicName={topicName}
        subjectName={subjectName}
        estimatedMinutes={25}
        showTitle={true}
      />
    </div>
  );
};

export default StudyReview;
