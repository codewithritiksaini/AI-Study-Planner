import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Clock, BarChart2, AlertCircle } from 'lucide-react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';

export const TopicModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}) => {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'MEDIUM',
    estimated_minutes: 60,
    completion_percentage: 0
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        difficulty: initialData.difficulty || 'MEDIUM',
        estimated_minutes: initialData.estimated_minutes || 60,
        completion_percentage: initialData.completion_percentage !== undefined ? initialData.completion_percentage : 0
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
  }, [initialData, isOpen]);

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

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Topic name is required';
    } else if (formData.name.trim().length > 150) {
      errs.name = 'Topic name cannot exceed 150 characters';
    }

    const minutes = parseInt(formData.estimated_minutes, 10);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      errs.estimated_minutes = 'Estimated time must be between 1 and 1440 minutes (24h)';
    }

    const comp = parseFloat(formData.completion_percentage);
    if (isNaN(comp) || comp < 0 || comp > 100) {
      errs.completion_percentage = 'Completion must be between 0% and 100%';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        difficulty: formData.difficulty,
        estimated_minutes: parseInt(formData.estimated_minutes, 10),
        completion_percentage: parseFloat(formData.completion_percentage)
      };

      await onSubmit(payload);
    } catch (err) {
      console.error('Topic modal error:', err);
      setServerError(err.message || 'Failed to save topic. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Light modal card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Syllabus Topic' : 'Add Syllabus Topic'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Update topic details and progress' : 'Define topic name, difficulty, and study duration'}
            </p>
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

        {serverError && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
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
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Key concepts, syllabus sub-topics, textbook references..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
                <span>Estimated Study Time (Mins)</span>
              </label>
              <input
                type="number"
                name="estimated_minutes"
                min="5"
                max="1440"
                step="5"
                value={formData.estimated_minutes}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                  errors.estimated_minutes
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
              {errors.estimated_minutes && (
                <p className="mt-1 text-xs text-red-600">{errors.estimated_minutes}</p>
              )}
            </div>
          </div>

          {/* Quick preset buttons for estimated minutes */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-400">Quick presets:</span>
            {[30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, estimated_minutes: mins }))}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  parseInt(formData.estimated_minutes, 10) === mins
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {mins}m
              </button>
            ))}
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

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="shadow-sm"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Topic'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicModal;
