import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, Target, AlertCircle } from 'lucide-react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';

const COLOR_OPTIONS = [
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Sky Blue', value: '#0284c7' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Teal', value: '#0d9488' }
];

export const SubjectModal = ({
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
    exam_date: '',
    target_score: 85,
    color: '#4f46e5'
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        exam_date: initialData.exam_date ? initialData.exam_date.substring(0, 10) : '',
        target_score: initialData.target_score !== null && initialData.target_score !== undefined ? initialData.target_score : 85,
        color: initialData.color || '#4f46e5'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        exam_date: '',
        target_score: 85,
        color: '#4f46e5'
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
      errs.name = 'Subject name is required';
    } else if (formData.name.trim().length > 100) {
      errs.name = 'Subject name cannot exceed 100 characters';
    }

    if (formData.target_score !== '' && formData.target_score !== null) {
      const score = parseFloat(formData.target_score);
      if (isNaN(score) || score < 0 || score > 100) {
        errs.target_score = 'Target score must be between 0 and 100%';
      }
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
        exam_date: formData.exam_date || null,
        target_score: formData.target_score !== '' && formData.target_score !== null ? parseFloat(formData.target_score) : null,
        color: formData.color
      };

      await onSubmit(payload);
    } catch (err) {
      console.error('Subject modal error:', err);
      setServerError(err.message || 'Failed to save subject. Please try again.');
    }
  };

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
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: formData.color }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Update course parameters and exam dates' : 'Create a curriculum subject and define its exam target'}
              </p>
            </div>
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
            label="Subject Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Database Management Systems"
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
              placeholder="e.g. Core concepts: Normalization, Concurrency, SQL, Indexing"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Exam Date (Optional)</span>
              </label>
              <input
                type="date"
                name="exam_date"
                value={formData.exam_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Score % (Optional)</span>
              </label>
              <input
                type="number"
                name="target_score"
                min="0"
                max="100"
                value={formData.target_score}
                onChange={handleChange}
                placeholder="85"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                  errors.target_score
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
              {errors.target_score && (
                <p className="mt-1 text-xs text-red-600">{errors.target_score}</p>
              )}
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Subject Theme Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color: c.value }))}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    formData.color === c.value
                      ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  aria-label={c.label}
                />
              ))}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;
