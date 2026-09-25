import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Clock, 
  AlertTriangle, 
  Brain, 
  BookOpen, 
  HelpCircle,
  Search,
  Filter,
  Play
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import PerformanceBadge from '../components/quiz/PerformanceBadge.jsx';
import WeakTopicsCard from '../components/quiz/WeakTopicsCard.jsx';
import StrongTopicsCard from '../components/quiz/StrongTopicsCard.jsx';
import { subjectService } from '../services/subjects.js';
import performanceService from '../services/performance.js';

export const Progress = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    totalSubjects: 0,
    totalTopics: 0,
    overallSyllabusProgress: 0
  });
  const [subjects, setSubjects] = useState([]);
  const [topicPerformances, setTopicPerformances] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [strongTopics, setStrongTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state for topic mastery table
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [academicSummary, enrolledSubjects, allPerfs, weakList, strongList] = await Promise.all([
        subjectService.getDashboardSummary().catch(() => ({ totalSubjects: 0, totalTopics: 0, overallSyllabusProgress: 0 })),
        subjectService.getSubjects().catch(() => []),
        performanceService.getAllTopicPerformance().catch(() => []),
        performanceService.getWeakTopics().catch(() => []),
        performanceService.getStrongTopics().catch(() => [])
      ]);

      setSummary(academicSummary || {});
      setSubjects(enrolledSubjects || []);
      setTopicPerformances(allPerfs || []);
      setWeakTopics(weakList || []);
      setStrongTopics(strongList || []);
    } catch (err) {
      console.error('Failed to load academic progress data:', err);
      setError('Unable to load progress metrics. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute overall average quiz score
  const assessedCount = topicPerformances.length;
  const avgQuizScore = assessedCount > 0
    ? Math.round(topicPerformances.reduce((acc, curr) => acc + Number(curr.composite_score || 0), 0) / assessedCount)
    : 0;

  // Filter topics for the mastery table
  const filteredTopics = topicPerformances.filter((tp) => {
    if (selectedSubjectId !== 'ALL' && tp.subject_id !== selectedSubjectId) {
      return false;
    }
    if (selectedTier !== 'ALL' && tp.performance_level !== selectedTier) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTopic = tp.topic_name?.toLowerCase().includes(q);
      const matchSubject = tp.subject_name?.toLowerCase().includes(q);
      if (!matchTopic && !matchSubject) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic & Topic Mastery Progress"
        subtitle="Track your curriculum coverage, syllabus completion rates, and verified quiz mastery."
        badge={<Badge variant="primary">Phase 7 Active</Badge>}
        action={
          <Button
            icon={Brain}
            onClick={() => navigate('/quiz')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            Take AI Quiz
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* 1. Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Curriculum Progress */}
        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Syllabus Coverage</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {summary.overallSyllabusProgress || 0}%
              </h3>
              <p className="text-[11px] text-indigo-600 font-medium">
                {summary.totalTopics || 0} topics in curriculum
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Quiz Accuracy Average */}
        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Avg Quiz Mastery</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {assessedCount > 0 ? `${avgQuizScore}%` : '—'}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium">
                {assessedCount} assessed topic{assessedCount === 1 ? '' : 's'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Weak Topics Count */}
        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Needs Practice</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {weakTopics.length}
              </h3>
              <p className="text-[11px] text-amber-600 font-medium">
                Score &lt; 70% threshold
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Mastered Topics Count */}
        <Card hover>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Mastered Topics</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {strongTopics.length}
              </h3>
              <p className="text-[11px] text-purple-600 font-medium">
                Score &ge; 85% high retention
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Architectural Pedagogical Guidance Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed">
          <span className="font-bold text-slate-900">
            Pedagogical Distinction: Syllabus Progress vs. Topic Mastery
          </span>
          <p className="text-slate-600 mt-0.5">
            Marking a syllabus topic as completed indicates curriculum coverage (reading notes or attending lectures). In contrast, 
            <span className="font-semibold text-slate-800"> Topic Mastery</span> is continuously computed from objective AI quiz evaluations. Even if your syllabus shows 100% complete, a low quiz score designates that topic as <span className="font-bold text-rose-600">WEAK</span> for targeted revision.
          </p>
        </div>
      </div>

      {/* 3. Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Comprehensive Topic Mastery Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-slate-900">
                    Topic Performance & Mastery Matrix
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Objective evaluation across all attempted syllabus modules
                  </p>
                </div>
                <Badge variant="neutral" size="sm">
                  {filteredTopics.length} Module{filteredTopics.length === 1 ? '' : 's'}
                </Badge>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-100">
                {/* Search query */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search topic or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                {/* Filter by Subject */}
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white text-slate-700"
                >
                  <option value="ALL">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {/* Filter by Tier */}
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white text-slate-700"
                >
                  <option value="ALL">All Mastery Tiers</option>
                  <option value="STRONG">Strong (&ge;85%)</option>
                  <option value="AVERAGE">Average (70–84%)</option>
                  <option value="NEEDS_PRACTICE">Needs Practice (50–69%)</option>
                  <option value="WEAK">Weak (&lt;50%)</option>
                </select>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Topic</th>
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Mastery Status</th>
                    <th className="py-3 px-3">Composite Score</th>
                    <th className="py-3 px-3">Attempts</th>
                    <th className="py-3 px-5 text-right">Practice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTopics.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No topic performance records match the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTopics.map((tp) => (
                      <tr key={tp.topic_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-slate-900">{tp.topic_name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Last tested: {tp.last_assessed_at ? new Date(tp.last_assessed_at).toLocaleDateString() : 'Recent'}
                          </p>
                        </td>

                        <td className="py-3.5 px-3">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{ 
                              backgroundColor: `${tp.subject_color || '#4f46e5'}15`,
                              color: tp.subject_color || '#4f46e5'
                            }}
                          >
                            {tp.subject_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <PerformanceBadge level={tp.performance_level} size="sm" />
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="text-sm font-bold text-slate-900">
                            {Math.round(tp.composite_score)}%
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-500">
                          {tp.attempt_count}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Brain}
                            className="text-xs"
                            onClick={() => navigate(`/quiz?subjectId=${tp.subject_id}&topicId=${tp.topic_id}`)}
                          >
                            Quiz
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Subject-Wise Syllabus Breakdown */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm text-slate-900">
                Curriculum Coverage by Subject
              </CardTitle>
              <p className="text-xs text-slate-500">Syllabus topic completion rates</p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {subjects.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No enrolled subjects found.</p>
              ) : (
                subjects.map((sub) => {
                  const pct = Math.round(sub.syllabus_progress_percentage || 0);

                  return (
                    <div key={sub.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: sub.color || '#4f46e5' }}
                          />
                          {sub.name}
                        </span>
                        <span>{pct}% ({sub.completed_topic_count || 0}/{sub.topic_count || 0} topics)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${pct}%`,
                            backgroundColor: sub.color || '#4f46e5'
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Weak Topics + Strong Topics */}
        <div className="space-y-6">
          <WeakTopicsCard topics={weakTopics} limit={6} />
          <StrongTopicsCard topics={strongTopics} limit={6} />
        </div>
      </div>
    </div>
  );
};

export default Progress;
