import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Brain,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { plannerService } from '../services/planner.js';
import { aiService } from '../services/ai.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PlanTaskCard from '../components/planner/PlanTaskCard.jsx';
import PlanSummaryHeader from '../components/planner/PlanSummaryHeader.jsx';
import DaySelector from '../components/planner/DaySelector.jsx';
import AdaptiveExplainerCard from '../components/planner/AdaptiveExplainerCard.jsx';
import PlanRegenerationModal from '../components/planner/PlanRegenerationModal.jsx';
import AIPlanExplanationModal from '../components/ai/AIPlanExplanationModal.jsx';

export const Planner = () => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'
  const [planData, setPlanData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Safe Recalibration Modal State
  const [recalibrationModalOpen, setRecalibrationModalOpen] = useState(false);

  // AI Explanation Modal State
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explanationData, setExplanationData] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const handleOpenExplainPlan = async () => {
    setExplainModalOpen(true);
    setLoadingExplanation(true);
    setExplanationData(null);
    try {
      const data = await plannerService.explainAdaptivePlan(selectedDate);
      setExplanationData(data);
    } catch (err) {
      console.error('Failed to load adaptive plan explanation:', err);
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Load Daily or Weekly Plan
  const loadPlannerData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      if (viewMode === 'daily') {
        const res = await plannerService.getAdaptivePlanByDate(selectedDate);
        setPlanData(res);
      } else {
        const res = await plannerService.getAdaptiveWeek(selectedDate);
        setWeeklyData(res);
      }
    } catch (err) {
      console.error('Failed to load planner data:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to load study timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlannerData();
  }, [selectedDate, viewMode]);

  // Generate or Safely Recalibrate Adaptive Plan
  const handleRecalibratePlan = async () => {
    try {
      setGenerating(true);
      setErrorMessage(null);
      setSuccessNotice(null);

      const res = await plannerService.generateAdaptivePlan({
        startDate: selectedDate,
        days: 7,
        forceRegenerate: true
      });

      setRecalibrationModalOpen(false);
      setSuccessNotice(`Adaptive plan recalibrated! Scheduled ${res.tasks_created || 0} study blocks across ${res.planning_window?.days || 7} days.`);

      // Reload current day's plan
      await loadPlannerData();
    } catch (err) {
      console.error('Adaptive plan generation failed:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Unable to recalibrate adaptive study plan.');
    } finally {
      setGenerating(false);
    }
  };

  // 1-Click Start Study Session Integration with Phase 4 Focus Room
  const handleStartTask = async (plan) => {
    try {
      setActionProcessingId(plan.id);
      if (plan.status === 'PENDING') {
        await plannerService.updateStatus(plan.id, 'IN_PROGRESS');
      }
      navigate(`/study?subjectId=${plan.subject_id}&topicId=${plan.topic_id}`);
    } catch (err) {
      console.error('Failed to start planned task:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to start planned study task.');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Mark Task as COMPLETED
  const handleCompleteTask = async (planId) => {
    try {
      setActionProcessingId(planId);
      const updated = await plannerService.updateStatus(planId, 'COMPLETED');
      setPlanData(prev => {
        if (!prev) return prev;
        const tasksList = prev.tasks || prev.plans || [];
        const updatedTasks = tasksList.map(p => p.id === planId ? { ...p, ...updated } : p);
        const completedMins = updatedTasks
          .filter(p => p.status === 'COMPLETED')
          .reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0);
        const pendingMins = updatedTasks
          .filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS')
          .reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0);

        return {
          ...prev,
          completed_minutes: completedMins,
          pending_minutes: pendingMins,
          tasks: updatedTasks,
          plans: updatedTasks
        };
      });
    } catch (err) {
      console.error('Failed to complete plan:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to update plan status.');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Mark Task as SKIPPED
  const handleSkipTask = async (planId) => {
    try {
      setActionProcessingId(planId);
      const updated = await plannerService.updateStatus(planId, 'SKIPPED');
      setPlanData(prev => {
        if (!prev) return prev;
        const tasksList = prev.tasks || prev.plans || [];
        const updatedTasks = tasksList.map(p => p.id === planId ? { ...p, ...updated } : p);
        const pendingMins = updatedTasks
          .filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS')
          .reduce((s, p) => s + (Number(p.planned_minutes) || 0), 0);

        return {
          ...prev,
          pending_minutes: pendingMins,
          tasks: updatedTasks,
          plans: updatedTasks
        };
      });
    } catch (err) {
      console.error('Failed to skip plan:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to skip planned task.');
    } finally {
      setActionProcessingId(null);
    }
  };

  const tasks = planData?.tasks || planData?.plans || [];
  const hasTasks = tasks.length > 0;
  const capacityMinutes = planData?.capacity_minutes || planData?.available_minutes || 120;
  const plannedMinutes = planData?.planned_minutes || planData?.total_planned_minutes || 0;
  const completedMinutes = planData?.completed_minutes || 0;
  const pendingMinutes = planData?.pending_minutes || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Adaptive Study Planner"
        subtitle="Dynamic study schedule recalibrated from quiz mastery, exam urgency, recent study habits, and missed tasks."
        badge={<Badge variant="primary">Phase 8 Adaptive Engine</Badge>}
        action={
          <div className="flex items-center gap-2">
            {hasTasks && (
              <Button
                icon={Sparkles}
                variant="outline"
                size="sm"
                onClick={handleOpenExplainPlan}
                className="text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 border-indigo-200"
              >
                Why this plan?
              </Button>
            )}
            <Button
              icon={RefreshCw}
              variant={hasTasks ? "outline" : "primary"}
              size="sm"
              onClick={() => setRecalibrationModalOpen(true)}
              disabled={generating}
            >
              {generating ? 'Recalibrating...' : (hasTasks ? 'Recalibrate Plan' : 'Generate Adaptive Plan')}
            </Button>
          </div>
        }
      />

      {/* Date & View Selector */}
      <DaySelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900">
            <p className="font-semibold">Planner Notice</p>
            <p className="text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Transparency Card: How Your Plan Adapts */}
      <AdaptiveExplainerCard />

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-500 font-medium mt-3">Recalibrating adaptive schedule...</p>
        </div>
      ) : viewMode === 'daily' ? (
        <div className="space-y-6">
          {/* Daily Metrics Summary Widget */}
          <PlanSummaryHeader
            totalPlannedMinutes={plannedMinutes}
            completedMinutes={completedMinutes}
            pendingMinutes={pendingMinutes}
            availableMinutes={capacityMinutes}
            isCapacityAdjusted={planData?.is_capacity_adjusted || false}
            observedAverage={planData?.observed_average}
          />

          {/* Task List or Empty State */}
          {hasTasks ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Scheduled Adaptive Blocks ({tasks.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">Sorted by Multi-Factor Adaptive Index</span>
              </div>

              {tasks.map((plan, index) => (
                <React.Fragment key={plan.id}>
                  <PlanTaskCard
                    plan={plan}
                    onStart={handleStartTask}
                    onComplete={handleCompleteTask}
                    onSkip={handleSkipTask}
                    isProcessing={actionProcessingId === plan.id}
                  />

                  {/* Rest Interval divider between tasks */}
                  {index < tasks.length - 1 && plan.planned_minutes >= 50 && (
                    <div className="flex items-center justify-center gap-2 py-1 text-slate-400 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>10-Minute Rest Interval (Automatic Break Insertion)</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-slate-300 bg-white">
              <CardContent className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Study Tasks Scheduled for this Date</h3>
                <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
                  {planData?.message ||
                    'Click Generate to build an adaptive timetable based on your syllabus, quiz performance, and exam dates.'}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    icon={RefreshCw}
                    variant="primary"
                    onClick={() => setRecalibrationModalOpen(true)}
                    disabled={generating}
                  >
                    Generate Adaptive Plan
                  </Button>
                  <Button
                    icon={BookOpen}
                    variant="outline"
                    onClick={() => navigate('/subjects')}
                  >
                    Manage Syllabus
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Weekly View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {(weeklyData?.days || []).map((day) => {
              const dObj = new Date(day.date + 'T00:00:00');
              const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = dObj.getDate();
              const isCurrentSelected = day.date === selectedDate;
              const dayTasks = day.tasks || day.plans || [];
              const hasDayPlans = dayTasks.length > 0;
              const dayPlannedMins = day.planned_minutes || day.total_planned_minutes || 0;
              const dayCompletedMins = day.completed_minutes || 0;

              return (
                <div
                  key={day.date}
                  onClick={() => {
                    setSelectedDate(day.date);
                    setViewMode('daily');
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isCurrentSelected
                      ? 'bg-indigo-50/50 border-indigo-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">{dayName}</span>
                    <span className="text-xs font-semibold text-slate-900">{dayNum}</span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-900">
                      {dayPlannedMins > 0 ? `${(dayPlannedMins / 60).toFixed(1)}h planned` : 'Rest Day'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {hasDayPlans ? `${dayTasks.length} task(s)` : 'No tasks'}
                    </p>

                    {dayCompletedMins > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" /> {(dayCompletedMins / 60).toFixed(1)}h done
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 text-center">
            Click on any day in the weekly calendar to view and execute that day's scheduled tasks.
          </p>
        </div>
      )}

      {/* Safe Plan Regeneration Confirmation Modal */}
      <PlanRegenerationModal
        isOpen={recalibrationModalOpen}
        onClose={() => setRecalibrationModalOpen(false)}
        onConfirm={handleRecalibratePlan}
        isRegenerating={generating}
      />

      {/* AI Plan Explanation Modal */}
      <AIPlanExplanationModal
        isOpen={explainModalOpen}
        onClose={() => setExplainModalOpen(false)}
        explanationData={explanationData}
        isLoading={loadingExplanation}
      />
    </div>
  );
};

export default Planner;
