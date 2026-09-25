import React from 'react';
import { Filter, Layers, AlertTriangle, BookOpen, Calendar, RotateCcw, HelpCircle, Clock, Scale } from 'lucide-react';

const FILTER_TYPES = [
  { id: 'ALL', label: 'All Recommendations', icon: Layers },
  { id: 'WEAK_TOPIC', label: 'Weak Topics', icon: AlertTriangle },
  { id: 'UNFINISHED_TOPIC', label: 'In Progress', icon: BookOpen },
  { id: 'EXAM_PREPARATION', label: 'Exam Prep', icon: Calendar },
  { id: 'REVISION', label: 'Revision', icon: RotateCcw },
  { id: 'QUIZ_PRACTICE', label: 'Quizzes', icon: HelpCircle },
  { id: 'BACKLOG', label: 'Backlog', icon: Clock },
  { id: 'STUDY_BALANCE', label: 'Study Balance', icon: Scale }
];

const PRIORITY_OPTIONS = [
  { id: 'ALL', label: 'All Priorities' },
  { id: 'HIGH', label: 'High Priority' },
  { id: 'MEDIUM', label: 'Medium Priority' },
  { id: 'LOW', label: 'Low Priority' }
];

export const RecommendationFilters = ({
  filter,
  setFilter,
  subjects = []
}) => {
  const selectedType = filter.type || 'ALL';
  const selectedPriority = filter.priority || 'ALL';
  const selectedSubjectId = filter.subjectId || '';

  const handleTypeSelect = (typeId) => {
    setFilter((prev) => ({
      ...prev,
      type: typeId === 'ALL' ? undefined : typeId
    }));
  };

  const handlePrioritySelect = (priorityId) => {
    setFilter((prev) => ({
      ...prev,
      priority: priorityId === 'ALL' ? undefined : priorityId
    }));
  };

  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setFilter((prev) => ({
      ...prev,
      subjectId: val || undefined
    }));
  };

  return (
    <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
      {/* Category Type Filter Pills */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by Category</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_TYPES.map((item) => {
            const Icon = item.icon;
            const isActive = selectedType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTypeSelect(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors border ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority and Subject Dropdowns */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Priority Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Priority:</span>
          {PRIORITY_OPTIONS.map((item) => {
            const isActive = selectedPriority === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePrioritySelect(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Subject Filter (if subjects available) */}
        {subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="subject-filter" className="text-xs font-semibold text-slate-500">
              Subject:
            </label>
            <select
              id="subject-filter"
              value={selectedSubjectId}
              onChange={handleSubjectChange}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationFilters;
