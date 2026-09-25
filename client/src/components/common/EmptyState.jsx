import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, BookOpen, Clock, Sparkles, Calendar, PlusCircle } from 'lucide-react';
import Button from './Button.jsx';

const PRESETS = {
  subjects: {
    icon: BookOpen,
    title: 'No subjects enrolled yet',
    description: 'Add your semester courses and syllabus topics to generate an optimized study schedule and unlock AI recommendations.',
    actionLabel: 'Add Subject',
    actionHref: '/subjects'
  },
  sessions: {
    icon: Clock,
    title: 'No study sessions recorded',
    description: 'Start a focused study session with the integrated Pomodoro timer to track your focus intervals and build study streaks.',
    actionLabel: 'Start Studying',
    actionHref: '/study'
  },
  recommendations: {
    icon: Sparkles,
    title: 'No active recommendations',
    description: 'Complete quizzes, log study sessions, or set exam dates to unlock smart personalized recommendations tailored to your goals.',
    actionLabel: 'Explore Subjects',
    actionHref: '/subjects'
  },
  planner: {
    icon: Calendar,
    title: 'No study plan scheduled',
    description: 'Generate your intelligent timetable tailored to your weekly availability, break times, and exam priorities.',
    actionLabel: 'Smart Optimize',
    actionHref: '/planner'
  }
};

export const EmptyState = ({
  preset,
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = ''
}) => {
  const activePreset = preset ? PRESETS[preset] : null;

  const IconComponent = icon || (activePreset ? activePreset.icon : Inbox);
  const displayTitle = title || (activePreset ? activePreset.title : 'No records found');
  const displayDescription = description || (activePreset ? activePreset.description : 'There is currently no data available in this section.');
  const displayActionLabel = actionLabel || (activePreset ? activePreset.actionLabel : null);
  const displayHref = actionHref || (activePreset ? activePreset.actionHref : null);

  return (
    <div
      role="region"
      aria-label={displayTitle}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        <IconComponent className="w-7 h-7" />
      </div>

      <h4 className="text-base font-semibold text-slate-900 tracking-tight">{displayTitle}</h4>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md leading-relaxed">
        {displayDescription}
      </p>

      {displayActionLabel && (
        <div className="mt-5">
          {displayHref && !onAction ? (
            <Link
              to={displayHref}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow transition-all duration-150"
            >
              <PlusCircle className="w-4 h-4" />
              {displayActionLabel}
            </Link>
          ) : (
            <Button size="sm" onClick={onAction}>
              {displayActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
