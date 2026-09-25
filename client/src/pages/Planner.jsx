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
  Plus
} from 'lucide-react';
import { plannerService } from '../services/planner.js';
import { studyService } from '../services/study.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PlanTaskCard from '../components/planner/PlanTaskCard.jsx';
import PlanSummaryHeader from '../components/planner/PlanSummaryHeader.jsx';
import DaySelector from '../components/planner/DaySelector.jsx';

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

  // Load Daily or Weekly Plan
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        if (viewMode === 'daily') {
          const res = await plannerService.getPlanByDate(selectedDate);
          if (isMounted) setPlanData(res);
        } else {
          const res = await plannerService.getWeeklyPlan(selectedDate);
          if (isMounted) setWeeklyData(res);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load planner data:', err);
          setErrorMessage(err.response?.data?.error?.message || 'Failed to load study plan.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, viewMode]);

  // Generate or Regenerate Plan
  const handleGenerate = async (forceRegenerate = false) => {
    try {
      setGenerating(true);
      setErrorMessage(null);
      const res = await plannerService.generatePlan({
        date: selectedDate,
        forceRegenerate
      });
      setPlanData(res);
    } catch (err) {
      console.error('Plan generation failed:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Unable to generate study plan.');
    } finally {
      setGenerating(false);
    }
  };

  // 1-Click Start Study Session Integration with Phase 4
  const handleStartTask = async (plan) => {
    try {
      setActionProcessingId(plan.id);
      // If plan is PENDING, mark IN_PROGRESS
      if (plan.status === 'PENDING') {
        await plannerService.updateStatus(plan.id, 'IN_PROGRESS');
      }
      // Navigate to Study Focus Room with subject and topic pre-selected
      navigate(`/study?subjectId=${plan.subject_id}&topicId=${plan.topic_id}`);
    } catch (err) {
      console.error('Failed to start planned task:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to start planned study task.');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Mark Plan Task as COMPLETED
  const handleCompleteTask = async (planId) => {
    try {
      setActionProcessingId(planId);
      const updated = await plannerService.updateStatus(planId, 'COMPLETED');
      // Update local state
      setPlanData(prev => {
        if (!prev) return prev;
        const updatedPlans = prev.plans.map(p => p.id === planId ? updated : p);
        const completedMins = updatedPlans.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.planned_minutes, 0);
        const pendingMins = updatedPlans.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS').reduce((s, p) => s + p.planned_minutes, 0);
        return {
          ...prev,
          completed_minutes: completedMins,
          pending_minutes: pendingMins,
          plans: updatedPlans
        };
      });
    } catch (err) {
      console.error('Failed to complete plan:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to update plan status.');
    } finally {
      setActionProcessingId(null);
    }
  };

  // Mark Plan Task as SKIPPED
  const handleSkipTask = async (planId) => {
    try {
      setActionProcessingId(planId);
      const updated = await plannerService.updateStatus(planId, 'SKIPPED');
      setPlanData(prev => {
        if (!prev) return prev;
        const updatedPlans = prev.plans.map(p => p.id === planId ? updated : p);
        const pendingMins = updatedPlans.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS').reduce((s, p) => s + p.planned_minutes, 0);
        return {
          ...prev,
          pending_minutes: pendingMins,
          plans: updatedPlans
        };
      });
    } catch (err) {
      console.error('Failed to skip plan:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Failed to skip planned task.');
    } finally {
      setActionProcessingId(null);
    }
  };

  const plans = planData?.plans || [];
  const hasPlans = plans.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Rule-Based Study Planner"
        subtitle="Deterministic daily and weekly study timetable calculated from exam urgency, syllabus completion, difficulty, and inactivity."
        badge={<Badge variant="primary">Phase 5 Engine</Badge>}
        action={
          <div className="flex items-center gap-2">
            {hasPlans ? (
              <Button
                icon={RefreshCw}
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(true)}
                disabled={generating}
              >
                {generating ? 'Regenerating...' : 'Regenerate Plan'}
              </Button>
            ) : (
              <Button
                icon={RefreshCw}
                variant="primary"
                size="sm"
                onClick={() => handleGenerate(false)}
                disabled={generating}
              >
                {generating ? 'Generating your study plan...' : "Generate Today's Plan"}
              </Button>
            )}
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

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-500 font-medium mt-3">Loading study timetable...</p>
        </div>
      ) : viewMode === 'daily' ? (
        <div className="space-y-6">
          {/* Daily Metrics Summary Widget */}
          <PlanSummaryHeader
            totalPlannedMinutes={planData?.total_planned_minutes || 0}
            completedMinutes={planData?.completed_minutes || 0}
            pendingMinutes={planData?.pending_minutes || 0}
            availableMinutes={planData?.available_minutes || 180}
          />

          {/* Task List or Empty State */}
          {hasPlans ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Scheduled Study Blocks ({plans.length})
                </h3>
                <span className="text-xs text-slate-500">Sorted by Priority Index</span>
              </div>

              {plans.map((plan, index) => (
                <React.Fragment key={plan.id}>
                  <PlanTaskCard
                    plan={plan}
                    onStart={handleStartTask}
                    onComplete={handleCompleteTask}
                    onSkip={handleSkipTask}
                    isProcessing={actionProcessingId === plan.id}
                  />

                  {/* Rest Interval divider between tasks */}
                  {index < plans.length - 1 && plan.planned_minutes >= 50 && (
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
                <h3 className="text-base font-bold text-slate-900">No Study Plan for this Date</h3>
                <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
                  {planData?.message ||
                    'Click Generate to build a deterministic timetable fitted inside your daily study hours.'}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    icon={RefreshCw}
                    variant="primary"
                    onClick={() => handleGenerate(false)}
                    disabled={generating}
                  >
                    {generating ? 'Generating your study plan...' : "Generate Today's Plan"}
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
              const hasDayPlans = day.plans && day.plans.length > 0;

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
                      {day.total_planned_minutes > 0 ? `${(day.total_planned_minutes / 60).toFixed(1)}h planned` : 'Rest Day'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {hasDayPlans ? `${day.plans.length} task(s)` : 'No tasks'}
                    </p>

                    {day.completed_minutes > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" /> {(day.completed_minutes / 60).toFixed(1)}h done
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
    </div>
  );
};

export default Planner;
