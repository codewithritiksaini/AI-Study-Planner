import React, { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, Target, AlertCircle } from 'lucide-react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';

const COLOR_OPTIONS = [
  { value: '#4f46e5', label: 'Indigo' },
  { value: '#7c3aed', label: 'Violet' },
  { value: '#059669', label: 'Emerald' },
  { value: '#d97706', label: 'Amber' },
  { value: '#dc2626', label: 'Rose' },
  { value: '#0891b2', label: 'Cyan' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#db2777', label: 'Pink' }
];

export const SubjectModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4f46e5',
    target_score: '',
    exam_date: ''
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
          color: initialData.color || '#4f46e5',
          target_score: initialData.target_score !== undefined && initialData.target_score !== null ? String(initialData.target_score) : '',
          exam_date: initialData.exam_date ? initialData.exam_date.substring(0, 10) : ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: '#4f46e5',
          target_score: '',
          exam_date: ''
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Subject name must be at least 2 characters';
    }

    if (formData.target_score !== '') {
      const scoreNum = Number(formData.target_score);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        newErrors.target_score = 'Target score must be between 0 and 100';
      }
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
        color: formData.color,
        target_score: formData.target_score !== '' ? Number(formData.target_score) : null,
        exam_date: formData.exam_date ? formData.exam_date : null
      };

      await onSubmit(payload);
    } catch (err) {
      console.error('Subject modal error:', err);
      setServerError(err.message || 'Failed to save subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Soft backdrop */}
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: formData.color }}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
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
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Form (Scrollable) */}
          <form id="subject-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4" noValidate>
            {serverError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

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
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Core concepts: Normalization, Concurrency, SQL, Indexing"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
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
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                    errors.target_score
                      ? 'border-red-400 focus:ring-red-400/20'
                      : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-600'
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
              form="subject-drawer-form"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="shadow-sm"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SubjectModal;
