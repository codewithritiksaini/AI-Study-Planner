import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, RefreshCw, X } from 'lucide-react';
import { subjectService } from '../services/subjects.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import SubjectCard from '../components/subjects/SubjectCard.jsx';
import SubjectModal from '../components/subjects/SubjectModal.jsx';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';

export const Subjects = () => {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError(err.message || 'Unable to load subjects from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (subject) => {
    setDeleteTarget(subject);
  };

  const handleSubmitSubject = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingSubject) {
        await subjectService.updateSubject(editingSubject.id, formData);
        await fetchSubjects();
        setIsModalOpen(false);
      } else {
        const created = await subjectService.createSubject(formData);
        setIsModalOpen(false);
        // Navigate directly to subject details so student can add syllabus topics immediately
        if (created?.id) {
          navigate(`/subjects/${created.id}`);
        } else {
          await fetchSubjects();
        }
      }
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await subjectService.deleteSubject(deleteTarget.id);
      setDeleteTarget(null);
      await fetchSubjects();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err.message || 'Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        title="Curriculum Subjects"
        subtitle="Manage academic courses, track syllabus milestones, and monitor exam deadlines."
        action={
          <Button icon={Plus} size="sm" onClick={handleOpenAddModal} className="shadow-xs">
            Add Subject
          </Button>
        }
      />

      {/* Search and Filter Bar */}
      {subjects.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search subjects by name or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredSubjects.length}</span> of {subjects.length} subjects
          </div>
        </div>
      )}

      {/* Main Content Areas */}
      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-slate-500">Loading your subjects...</p>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load subjects"
          message={error}
          onRetry={fetchSubjects}
        />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects added yet"
          message="Add your first curriculum subject (e.g. Database Management Systems, Operating Systems) to start organizing your syllabus topics."
          actionText="Add First Subject"
          onAction={handleOpenAddModal}
        />
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
          <p className="text-sm font-semibold text-slate-800">No subjects match "{searchQuery}"</p>
          <p className="text-xs text-slate-500 mt-1">Try searching for a different course name or clear your search query.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="mt-4"
          >
            Clear Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => (
            <SubjectCard
              key={sub.id}
              subject={sub}
              onClick={() => navigate(`/subjects/${sub.id}`)}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Subject Modal */}
      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        onSubmit={handleSubmitSubject}
        initialData={editingSubject}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Subject?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All syllabus topics within this subject will be permanently removed.`}
        confirmText="Delete Subject"
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Subjects;
