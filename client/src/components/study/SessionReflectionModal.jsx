import React, { useState } from 'react';
import { CheckCircle2, Star, ThumbsUp, HelpCircle, FileText, X } from 'lucide-react';
import Button from '../common/Button.jsx';

export const SessionReflectionModal = ({
  isOpen,
  onClose,
  onSubmit,
  session,
  isSubmitting = false
}) => {
  const [confidenceLevel, setConfidenceLevel] = useState(null);
  const [difficultyFeedback, setDifficultyFeedback] = useState(null);
  const [notes, setNotes] = useState('');

  if (!isOpen || !session) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSubmit({
      confidenceLevel,
      difficultyFeedback,
      notes: notes.trim() ? notes.trim() : null
    });
  };

  const confidenceLabels = {
    1: '1 - Very Low',
    2: '2 - Low',
    3: '3 - Medium',
    4: '4 - High',
    5: '5 - Very High'
  };

  const difficultyOptions = [
    { value: 'EASY', label: 'Easy', desc: 'Felt straightforward' },
    { value: 'MEDIUM', label: 'Medium', desc: 'Moderate effort needed' },
    { value: 'HARD', label: 'Hard', desc: 'Challenging concepts' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Soft backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Light modal card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Study Session Reflection</h3>
            <p className="text-xs text-slate-500">Record your feedback to calibrate your study velocity</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
        {/* Session Accomplishment Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Great focus! Session completed.</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Subject: <span className="font-semibold">{session.subject_name}</span>
              {session.topic_name && <> &bull; Topic: <span className="font-semibold">{session.topic_name}</span></>}
            </p>
          </div>
        </div>

        {/* 1. Optional Confidence Rating */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            Confidence Level <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((level) => {
              const isSelected = confidenceLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfidenceLevel(isSelected ? null : level)}
                  className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-102'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-black">{level}</div>
                  <div className="text-[10px] font-normal truncate mt-0.5">
                    {level === 1 ? 'Low' : level === 5 ? 'High' : `Lv ${level}`}
                  </div>
                </button>
              );
            })}
          </div>
          {confidenceLevel && (
            <p className="text-[11px] text-amber-700 font-medium mt-1.5 text-right">
              Selected: {confidenceLabels[confidenceLevel]}
            </p>
          )}
        </div>

        {/* 2. Optional Session Difficulty Feedback */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            Perceived Difficulty <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {difficultyOptions.map((opt) => {
              const isSelected = difficultyFeedback === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDifficultyFeedback(isSelected ? null : opt.value)}
                  className={`p-3 text-left rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">{opt.label}</p>
                  <p className="text-[10px] font-normal text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Optional Reflection Notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Session Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <span className="text-[11px] text-slate-400">{notes.length}/1000</span>
          </div>
          <textarea
            rows={3}
            value={notes}
            maxLength={1000}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key concepts reviewed, questions to revisit, or topics needing revision..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs resize-none"
          />
        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Save Session & Finish
          </Button>
        </div>
      </form>
    </div>
  </div>
  );
};

export default SessionReflectionModal;
