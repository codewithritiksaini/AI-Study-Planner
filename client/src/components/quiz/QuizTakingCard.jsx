import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  FileText
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';

export const QuizTakingCard = ({
  quiz,
  attemptId,
  onSubmitAttempt,
  submitting = false,
  className = ''
}) => {
  const questions = quiz?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showWarningModal, setShowWarningModal] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No questions loaded</h3>
        <p className="text-xs text-slate-500 mt-1">Please try re-generating the quiz.</p>
      </Card>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedOption = answers[currentQ.id] || null;

  const handleSelectOption = (optionText) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionText
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Check unanswered count
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].trim() !== '').length;
  const unansweredCount = questions.length - answeredCount;

  const handleInitialSubmitClick = () => {
    if (unansweredCount > 0) {
      setShowWarningModal(true);
    } else {
      performSubmission();
    }
  };

  const performSubmission = () => {
    setShowWarningModal(false);
    // Format payload
    const answersPayload = questions.map(q => ({
      question_id: q.id,
      selected_answer: answers[q.id] || null
    }));
    onSubmitAttempt(answersPayload);
  };

  const progressPercentage = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quiz Progress & Stepper Header */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <Badge variant="neutral" size="sm">
                  {quiz.difficulty || 'Medium'}
                </Badge>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {quiz.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-medium text-slate-500">
                Answered: <strong className="text-slate-900">{answeredCount}/{questions.length}</strong>
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Question Box */}
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Question Item</span>
              <span>{currentQ.points || 1} pt</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
              {currentQ.question_text}
            </p>
          </div>

          {/* 4 Accessible Radio Options */}
          <div className="space-y-3" role="radiogroup" aria-label={currentQ.question_text}>
            {(currentQ.options || []).map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === opt;

              return (
                <label
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border text-sm cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQ.id}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => handleSelectOption(opt)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="flex-1 leading-snug pt-0.5">{opt}</span>
                </label>
              );
            })}
          </div>

          {/* Navigation & Submission Controls */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              icon={ChevronLeft}
              onClick={handlePrev}
              disabled={currentIndex === 0 || submitting}
            >
              Previous
            </Button>

            {/* Quick Question Stepper Dots */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center py-1">
              {questions.map((q, idx) => {
                const isAns = Boolean(answers[q.id]);
                const isCur = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      isCur
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isAns
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={`Jump to Question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {currentIndex < questions.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={submitting}
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                icon={FileText}
                onClick={handleInitialSubmitClick}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent font-bold shadow-xs px-5"
              >
                {submitting ? 'Generating Your Report...' : 'View Result & Report'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal for Unanswered Questions */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Unanswered Questions Warning
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              You have <strong className="text-amber-700 font-semibold">{unansweredCount} unanswered</strong> question(s) out of {questions.length}. Any blank question will receive 0 points in the report.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Do you want to finalize now and view your performance report, or return to answer remaining questions?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWarningModal(false)}
              >
                Review Questions
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={performSubmission}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Proceed & View Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTakingCard;
