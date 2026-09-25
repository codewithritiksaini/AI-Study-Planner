import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Target,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  ListFilter,
  Brain,
  BarChart3
} from 'lucide-react';
import { subjectService } from '../services/subjects.js';
import { topicService } from '../services/topics.js';
import { aiService } from '../services/ai.js';
import Button from '../components/common/Button.jsx';
import Card, { CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import TopicItem from '../components/topics/TopicItem.jsx';
import SubjectModal from '../components/subjects/SubjectModal.jsx';
import TopicModal from '../components/topics/TopicModal.jsx';
import AIStudyStrategyModal from '../components/ai/AIStudyStrategyModal.jsx';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';

export const SubjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Subject Edit / Delete modal states
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);
  const [isDeleteSubjectConfirmOpen, setIsDeleteSubjectConfirmOpen] = useState(false);

  // Topic Add / Edit / Delete modal states
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [deletingTopicTarget, setDeletingTopicTarget] = useState(null);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);

  // Phase 6 AI Strategy modal state
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [strategyData, setStrategyData] = useState(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);

  const handleOpenAIStrategy = async (topic) => {
    setStrategyModalOpen(true);
    setLoadingStrategy(true);
    setStrategyData(null);
    try {
      const data = await aiService.getStudyStrategy(topic.id);
      setStrategyData(data);
    } catch (err) {
      console.error('Failed to load study strategy:', err);
    } finally {
      setLoadingStrategy(false);
    }
  };

  const fetchSubjectData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subjectService.getSubject(id);
      if (!data) {
        setError('Subject not found or you do not have permission to view it.');
      } else {
        setSubject(data);
      }
    } catch (err) {
      console.error('Error fetching subject details:', err);
      setError(err.message || 'Failed to load subject details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubjectData();
  }, [fetchSubjectData]);

  // Subject Handlers
  const handleUpdateSubject = async (formData) => {
    try {
      const updated = await subjectService.updateSubject(id, formData);
      setSubject((prev) => ({ ...prev, ...updated }));
      setIsEditSubjectModalOpen(false);
      await fetchSubjectData();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteSubject = async () => {
    setIsDeletingSubject(true);
    try {
      await subjectService.deleteSubject(id);
      setIsDeleteSubjectConfirmOpen(false);
      navigate('/subjects', { replace: true });
    } catch (err) {
      console.error('Failed to delete subject:', err);
      alert(err.message || 'Could not delete subject');
    } finally {
      setIsDeletingSubject(false);
    }
  };

  // Topic Handlers
  const handleOpenAddTopicModal = () => {
    setEditingTopic(null);
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopicModal = (topic) => {
    setEditingTopic(topic);
    setIsTopicModalOpen(true);
  };

  const handleSubmitTopic = async (topicData) => {
    setIsSubmittingTopic(true);
    try {
      if (editingTopic) {
        await topicService.updateTopic(editingTopic.id, topicData);
      } else {
        await topicService.createTopic(id, topicData);
      }
      setIsTopicModalOpen(false);
      await fetchSubjectData();
    } catch (err) {
      throw err;
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  const handleToggleTopicProgress = async (topicId, nextPercentage) => {
    try {
      // Optimistic local update
      setSubject((prev) => {
        if (!prev) return prev;
        const updatedTopics = (prev.topics || []).map((t) =>
          t.id === topicId
            ? {
                ...t,
                completion_percentage: nextPercentage,
                status: nextPercentage === 100 ? 'COMPLETED' : nextPercentage === 0 ? 'NOT_STARTED' : 'IN_PROGRESS'
              }
            : t
        );
        return { ...prev, topics: updatedTopics };
      });

      await topicService.updateProgress(topicId, nextPercentage);
      await fetchSubjectData();
    } catch (err) {
      console.error('Progress update failed:', err);
      await fetchSubjectData();
    }
  };

  const handleConfirmDeleteTopic = async () => {
    if (!deletingTopicTarget) return;
    setIsDeletingTopic(true);
    try {
      await topicService.deleteTopic(deletingTopicTarget.id);
      setDeletingTopicTarget(null);
      await fetchSubjectData();
    } catch (err) {
      console.error('Failed to delete topic:', err);
      alert(err.message || 'Could not delete topic');
    } finally {
      setIsDeletingTopic(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-slate-500">Loading subject & syllabus...</p>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="py-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/subjects')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Subjects
        </Button>
        <ErrorState
          title="Subject Not Found"
          message={error || 'The requested subject does not exist or you do not have permission to view it.'}
          actionText="Return to Subjects"
          onAction={() => navigate('/subjects')}
        />
      </div>
    );
  }

  const topics = subject.topics || [];
  const completedTopicsCount = topics.filter(
    (t) => t.status === 'COMPLETED' || t.completion_percentage === 100
  ).length;

  const totalEstimatedMinutes = topics.reduce(
    (acc, t) => acc + (parseInt(t.estimated_minutes, 10) || 0),
    0
  );
  const totalEstimatedHours = (totalEstimatedMinutes / 60).toFixed(1);

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const renderExamCountdown = () => {
    const days = subject.days_until_exam;
    if (days === null || days === undefined) {
      return (
        <span className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium">
          No Exam Date Set
        </span>
      );
    }
    if (days < 0) {
      return (
        <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold">
          Exam Passed ({subject.exam_date})
        </span>
      );
    }
    if (days === 0) {
      return (
        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          Exam Today!
        </span>
      );
    }
    if (days <= 7) {
      return (
        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
          Exam in {days} days ({subject.exam_date})
        </span>
      );
    }
    return (
      <span className="text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full text-xs font-semibold">
        Exam in {days} days ({subject.exam_date})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          to="/subjects"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to All Subjects
        </Link>
      </div>

      {/* Hero Subject Header Card */}
      <Card className="bg-white border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: subject.color || '#4f46e5' }}
            >
              <BookOpen className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {subject.name}
                </h1>
                {renderExamCountdown()}
              </div>

              {subject.description && (
                <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {subject.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
                {subject.target_score && (
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Target Score: <strong className="text-slate-900">{subject.target_score}%</strong>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Estimated Study Time: <strong className="text-slate-900">{totalEstimatedHours} hours</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (Quiz, Edit & Delete) */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <Button
              variant="outline"
              size="sm"
              icon={Brain}
              onClick={() => navigate(`/quiz?subjectId=${subject.id}`)}
              className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            >
              Practice Quiz
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={BarChart3}
              onClick={() => navigate('/analytics')}
              className="text-slate-700 hover:text-indigo-600 hover:border-indigo-200"
            >
              Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Edit2}
              onClick={() => setIsEditSubjectModalOpen(true)}
              className="text-slate-700"
            >
              Edit Subject
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={() => setIsDeleteSubjectConfirmOpen(true)}
              className="text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Syllabus Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700">
              Syllabus Completion ({completedTopicsCount} of {topics.length} Topics Finished)
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {Math.round(subject.syllabus_progress_percentage || 0)}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, subject.syllabus_progress_percentage || 0))}%`,
                backgroundColor: subject.color || '#4f46e5'
              }}
            />
          </div>
        </div>
      </Card>

      {/* Syllabus Topics Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Syllabus Breakdown</h2>
            <p className="text-xs text-slate-500">
              Break down this course into manageable study topics with difficulties and durations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Not Started', value: 'NOT_STARTED' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Completed', value: 'COMPLETED' }
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === f.value
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={handleOpenAddTopicModal}
              className="shadow-xs"
            >
              Add Topic
            </Button>
          </div>
        </div>

        {/* Topic List */}
        {topics.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No syllabus topics yet"
            message="Add the chapters and topics from your syllabus to start tracking mastery and estimated study times."
            actionText="Add First Topic"
            onAction={handleOpenAddTopicModal}
          />
        ) : filteredTopics.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
            <p className="text-sm font-semibold text-slate-800">No topics match this status filter</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('ALL')}
              className="mt-3"
            >
              Show All Topics
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTopics.map((topic) => (
              <TopicItem
                key={topic.id}
                topic={topic}
                onEdit={handleOpenEditTopicModal}
                onDelete={(t) => setDeletingTopicTarget(t)}
                onProgressChange={handleToggleTopicProgress}
                onGetStrategy={handleOpenAIStrategy}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Subject Modal */}
      <SubjectModal
        isOpen={isEditSubjectModalOpen}
        onClose={() => setIsEditSubjectModalOpen(false)}
        onSubmit={handleUpdateSubject}
        initialData={subject}
      />

      {/* Delete Subject Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteSubjectConfirmOpen}
        onClose={() => !isDeletingSubject && setIsDeleteSubjectConfirmOpen(false)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject?"
        message={`Are you sure you want to delete "${subject.name}"? This action is permanent and will delete all ${topics.length} associated syllabus topics.`}
        confirmText="Delete Subject"
        isDeleting={isDeletingSubject}
      />

      {/* Add / Edit Topic Modal */}
      <TopicModal
        isOpen={isTopicModalOpen}
        onClose={() => !isSubmittingTopic && setIsTopicModalOpen(false)}
        onSubmit={handleSubmitTopic}
        initialData={editingTopic}
        isSubmitting={isSubmittingTopic}
      />

      {/* Delete Topic Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTopicTarget)}
        onClose={() => !isDeletingTopic && setDeletingTopicTarget(null)}
        onConfirm={handleConfirmDeleteTopic}
        title="Delete Syllabus Topic?"
        message={`Are you sure you want to delete "${deletingTopicTarget?.name}"?`}
        confirmText="Delete Topic"
        isDeleting={isDeletingTopic}
      />

      {/* Phase 6 AI Study Strategy Modal */}
      <AIStudyStrategyModal
        isOpen={strategyModalOpen}
        onClose={() => setStrategyModalOpen(false)}
        strategyData={strategyData}
        isLoading={loadingStrategy}
      />
    </div>
  );
};

export default SubjectDetails;
