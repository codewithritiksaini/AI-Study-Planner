import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, AlertCircle } from 'lucide-react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';

export const TopicModal = ({
  isOpen,
  onClose,
  onSubmit,
  subjectId,
  initialData = null,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'MEDIUM',
    estimated_minutes: 60,
    completion_percentage: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Reset or populate on open
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          difficulty: initialData.difficulty || 'MEDIUM',
          estimated_minutes: initialData.estimated_minutes !== undefined && initialData.estimated_minutes !== null ? initialData.estimated_minutes : 60,
          completion_percentage: initialData.completion_percentage !== undefined && initialData.completion_percentage !== null ? initialData.completion_percentage : 0
        });
      } else {
        setFormData({
          name: '',
          description: '',
          difficulty: 'MEDIUM',
          estimated_minutes: 60,
          completion_percentage: 0
        });
      }
      setErrors({});
      setServerError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'estimated_minutes' || name === 'completion_percentage' ? Number(value) : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Topic name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Topic name must be at least 2 characters';
    }

    const mins = Number(formData.estimated_minutes);
    if (isNaN(mins) || mins <= 0 || mins > 1440) {
      newErrors.estimated_minutes = 'Estimated time must be between 1 and 1440 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setServerError('');

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        difficulty: formData.difficulty,
        estimated_minutes: Number(formData.estimated_minutes),
        completion_percentage: Number(formData.completion_percentage)
      };

      if (!isEditing && subjectId) {
        payload.subject_id = subjectId;
      }

      await onSubmit(payload);
    } catch (err) {
      console.error('Topic modal error:', err);
      setServerError(err.message || 'Failed to save topic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in duration-200"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {isEditing ? 'Edit Syllabus Topic' : 'Add Syllabus Topic'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEditing ? 'Update topic parameters and progress' : 'Define topic name, difficulty, and study duration'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Form (Scrollable) */}
          <form id="topic-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4" noValidate>
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <Input
              label="Topic Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Normalization (1NF, 2NF, 3NF, BCNF)"
              error={errors.name}
              required
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description / Notes (Optional)
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Key concepts, syllabus sub-topics, textbook references..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Difficulty Level"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                options={[
                  { value: 'EASY', label: '🟢 Easy (Quick Concept)' },
                  { value: 'MEDIUM', label: '🟡 Medium (Standard)' },
                  { value: 'HARD', label: '🔴 Hard (Complex/Heavy)' }
                ]}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Estimated Time (Mins)</span>
                </label>
                <input
                  type="number"
                  name="estimated_minutes"
                  min="5"
                  max="1440"
                  step="5"
                  value={formData.estimated_minutes}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                    errors.estimated_minutes
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
                  }`}
                />
                {errors.estimated_minutes && (
                  <p className="mt-1 text-xs text-red-600">{errors.estimated_minutes}</p>
                )}
              </div>
            </div>

            {/* Quick preset buttons for estimated minutes */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Quick duration presets:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {[30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, estimated_minutes: mins }))}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                      parseInt(formData.estimated_minutes, 10) === mins
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Completion Percentage Slider & Number */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Syllabus Completion</span>
                <span className="text-indigo-600 font-bold text-sm">
                  {formData.completion_percentage}%
                </span>
              </div>
              <input
                type="range"
                name="completion_percentage"
                min="0"
                max="100"
                step="5"
                value={formData.completion_percentage}
                onChange={handleChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0% (Not Started)</span>
                <span>50% (In Progress)</span>
                <span>100% (Completed)</span>
              </div>
            </div>
          </form>

          {/* Drawer Footer Actions (Sticky) */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="topic-drawer-form"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="shadow-sm"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Topic'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TopicModal;
