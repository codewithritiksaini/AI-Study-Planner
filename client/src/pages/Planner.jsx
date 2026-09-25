import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CalendarDays,
  Settings2,
  RotateCcw
} from 'lucide-react';
import { plannerService } from '../services/planner.js';
import { subjectService } from '../services/subjects.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

import DailyPlanner from '../components/planner/DailyPlanner.jsx';
import WeeklyPlanner from '../components/planner/WeeklyPlanner.jsx';
import AvailabilityEditor from '../components/planner/AvailabilityEditor.jsx';
import BlockedTimeEditor from '../components/planner/BlockedTimeEditor.jsx';
import PlanPreviewModal from '../components/planner/PlanPreviewModal.jsx';
import SmartOptimizationModal from '../components/planner/SmartOptimizationModal.jsx';
import ManualSessionModal from '../components/planner/ManualSessionModal.jsx';

export const Planner = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  // Active view tab: 'daily' | 'weekly' | 'availability'
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [weekStartDate, setWeekStartDate] = useState(todayStr);

  // Core Data State
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [blockedPeriods, setBlockedPeriods] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Modals state
  const [optimizerModalOpen, setOptimizerModalOpen] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isApplyingPlan, setIsApplyingPlan] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // ----------------------------------------------------------------------------
  // Data Loaders
  // ----------------------------------------------------------------------------
  const loadDailyData = async (date) => {
    try {
      const res = await plannerService.getDailySchedule({ date });
      setDailyData(res);
    } catch (err) {
      console.error('Failed to load daily schedule:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to load daily schedule.');
    }
  };

  const loadWeeklyData = async (startDate) => {
    try {
      const res = await plannerService.getWeeklyTimetable({ startDate });
      setWeeklyData(res);
    } catch (err) {
      console.error('Failed to load weekly timetable:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to load weekly timetable.');
    }
  };

  const loadAvailabilityAndBlocks = async () => {
    try {
      const [availRes, blockedRes] = await Promise.all([
        plannerService.getAvailability(),
        plannerService.getBlockedPeriods()
      ]);
      setAvailability(availRes || []);
      setBlockedPeriods(blockedRes || []);
    } catch (err) {
      console.error('Failed to load availability/blocked periods:', err);
    }
  };

  const loadSubjects = async () => {
    try {
      const subs = await subjectService.getSubjects();
      setSubjects(subs || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  // Main fetch orchestrator on tab or date changes
  useEffect(() => {
    const fetchTabData = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        if (activeTab === 'daily') {
          await loadDailyData(selectedDate);
        } else if (activeTab === 'weekly') {
          await loadWeeklyData(weekStartDate);
        } else if (activeTab === 'availability') {
          await loadAvailabilityAndBlocks();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTabData();
  }, [activeTab, selectedDate, weekStartDate]);

  // Initial auxiliary loads
  useEffect(() => {
    loadSubjects();
    loadAvailabilityAndBlocks();
  }, []);

  // ----------------------------------------------------------------------------
  // Session Actions
  // ----------------------------------------------------------------------------
  const handleStartSession = async (session) => {
    try {
      setProcessingId(session.id);
      if (session.status === 'PENDING') {
        await plannerService.updateStatus(session.id, 'IN_PROGRESS');
      }
      navigate(`/study?subjectId=${session.subject_id || ''}&topicId=${session.topic_id || ''}`);
    } catch (err) {
      console.error('Failed to start session:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to launch study room.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      setProcessingId(sessionId);
      await plannerService.updateStatus(sessionId, 'COMPLETED');
      setSuccessNotice('Session marked as completed! Excellent progress.');
      await loadDailyData(selectedDate);
    } catch (err) {
      console.error('Failed to complete session:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to update session.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSkipSession = async (sessionId) => {
    try {
      setProcessingId(sessionId);
      await plannerService.updateStatus(sessionId, 'SKIPPED');
      setSuccessNotice('Session skipped.');
      await loadDailyData(selectedDate);
    } catch (err) {
      console.error('Failed to skip session:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to skip session.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleLock = async (sessionId) => {
    try {
      setProcessingId(sessionId);
      const res = await plannerService.toggleLock(sessionId);
      setSuccessNotice(res?.is_locked ? 'Session locked against auto-rescheduling.' : 'Session unlocked.');
      await loadDailyData(selectedDate);
    } catch (err) {
      console.error('Failed to toggle lock:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to toggle lock.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRescheduleSession = async (sessionId) => {
    try {
      setProcessingId(sessionId);
      const res = await plannerService.rescheduleSession(sessionId);
      setSuccessNotice(`Missed session rescheduled to ${res.new_session?.plan_date} (${res.new_session?.start_time ? new Date(res.new_session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'upcoming slot'}).`);
      await loadDailyData(selectedDate);
    } catch (err) {
      console.error('Failed to reschedule missed session:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Unable to find an open slot to reschedule.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setProcessingId(sessionId);
      await plannerService.deleteSession(sessionId);
      setSuccessNotice('Session deleted.');
      await loadDailyData(selectedDate);
    } catch (err) {
      console.error('Failed to delete session:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to delete session.');
    } finally {
      setProcessingId(null);
    }
  };

  // ----------------------------------------------------------------------------
  // Optimization Preview & Apply Workflows
  // ----------------------------------------------------------------------------
  const handleGeneratePreview = async (params) => {
    try {
      setIsGeneratingPreview(true);
      setErrorMessage(null);
      const data = await plannerService.generatePreview(params);
      setPreviewData(data);
      setOptimizerModalOpen(false);
      setPreviewModalOpen(true);
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to generate schedule preview.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleApplyPlan = async (applyParams) => {
    try {
      setIsApplyingPlan(true);
      setErrorMessage(null);
      const res = await plannerService.applyPlan(applyParams);
      setPreviewModalOpen(false);
      setPreviewData(null);
      setSuccessNotice(`Schedule applied successfully! ${res?.sessions_created || 0} study session(s) written to your active calendar.`);
      await loadDailyData(selectedDate);
      if (activeTab === 'weekly') {
        await loadWeeklyData(weekStartDate);
      }
    } catch (err) {
      console.error('Failed to apply plan:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to apply study schedule.');
    } finally {
      setIsApplyingPlan(false);
    }
  };

  // ----------------------------------------------------------------------------
  // Manual Session Creation
  // ----------------------------------------------------------------------------
  const handleCreateManualSession = async (sessionData) => {
    await plannerService.createManualSession(sessionData);
    setSuccessNotice('Custom study session scheduled.');
    await loadDailyData(selectedDate);
  };

  // ----------------------------------------------------------------------------
  // Availability & Blocked Periods Handlers
  // ----------------------------------------------------------------------------
  const handleAddAvailability = async (payload) => {
    await plannerService.createAvailability(payload);
    await loadAvailabilityAndBlocks();
    setSuccessNotice('Study window saved.');
  };

  const handleUpdateAvailability = async (id, payload) => {
    await plannerService.updateAvailability(id, payload);
    await loadAvailabilityAndBlocks();
  };

  const handleDeleteAvailability = async (id) => {
    await plannerService.deleteAvailability(id);
    await loadAvailabilityAndBlocks();
    setSuccessNotice('Study window deleted.');
  };

  const handleAddBlockedPeriod = async (payload) => {
    await plannerService.createBlockedPeriod(payload);
    await loadAvailabilityAndBlocks();
    setSuccessNotice('Blocked commitment saved.');
  };

  const handleDeleteBlockedPeriod = async (id) => {
    await plannerService.deleteBlockedPeriod(id);
    await loadAvailabilityAndBlocks();
    setSuccessNotice('Blocked commitment removed.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Intelligent Adaptive Study Planner"
        subtitle="Time-aware study schedule synthesized from your availability windows, exam urgencies, and mastery recommendations."
        badge={<Badge variant="primary">Phase 11 Scheduling Engine</Badge>}
        action={
          <div className="flex items-center gap-2">
            <Button
              icon={Plus}
              variant="outline"
              size="sm"
              onClick={() => setManualModalOpen(true)}
            >
              Add Task
            </Button>
            <Button
              icon={Sparkles}
              variant="primary"
              size="sm"
              onClick={() => setOptimizerModalOpen(true)}
            >
              Smart Optimize
            </Button>
          </div>
        }
      />

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors ${
            activeTab === 'daily'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Daily Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors ${
            activeTab === 'weekly'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Weekly Timetable</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors ${
            activeTab === 'availability'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Study Windows & Blackouts</span>
        </button>
      </div>

      {/* Global Alerts / Feedback */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold ml-4 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-xs text-rose-900 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-semibold text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-500 font-medium mt-3">Loading scheduler workspace...</p>
        </div>
      ) : activeTab === 'daily' ? (
        <DailyPlanner
          dailyData={dailyData}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onStartSession={handleStartSession}
          onCompleteSession={handleCompleteSession}
          onSkipSession={handleSkipSession}
          onToggleLock={handleToggleLock}
          onRescheduleSession={handleRescheduleSession}
          onDeleteSession={handleDeleteSession}
          onOpenManualModal={() => setManualModalOpen(true)}
          onOpenGeneratorModal={() => setOptimizerModalOpen(true)}
          isProcessingId={processingId}
        />
      ) : activeTab === 'weekly' ? (
        <WeeklyPlanner
          weeklyData={weeklyData}
          startDate={weekStartDate}
          onStartDateChange={setWeekStartDate}
          onSelectDay={(dayDate) => {
            setSelectedDate(dayDate);
            setActiveTab('daily');
          }}
          onOpenGeneratorModal={() => setOptimizerModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          <AvailabilityEditor
            availability={availability}
            onAdd={handleAddAvailability}
            onUpdate={handleUpdateAvailability}
            onDelete={handleDeleteAvailability}
          />

          <BlockedTimeEditor
            blockedPeriods={blockedPeriods}
            onAdd={handleAddBlockedPeriod}
            onDelete={handleDeleteBlockedPeriod}
          />
        </div>
      )}

      {/* Smart Optimization Parameters Modal */}
      <SmartOptimizationModal
        isOpen={optimizerModalOpen}
        onClose={() => setOptimizerModalOpen(false)}
        onGeneratePreview={handleGeneratePreview}
        isLoading={isGeneratingPreview}
      />

      {/* Plan Preview Modal (Non-Destructive) */}
      <PlanPreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewData(null);
        }}
        previewData={previewData}
        onApply={handleApplyPlan}
        isApplying={isApplyingPlan}
      />

      {/* Manual Task Modal */}
      <ManualSessionModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSubmit={handleCreateManualSession}
        subjects={subjects}
        initialDate={selectedDate}
      />
    </div>
  );
};

export default Planner;
