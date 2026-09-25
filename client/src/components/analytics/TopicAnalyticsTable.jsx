import React, { useState, useMemo } from 'react';
import { Search, Filter, Layers, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';

/**
 * TopicAnalyticsTable
 * Searchable, filterable breakdown of topics across subjects.
 */
export const TopicAnalyticsTable = ({ topics = [], subjects = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (t.name || '').toLowerCase().includes(q);
        const matchesSub = (t.subject_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSub) return false;
      }

      // Subject
      if (selectedSubject !== 'ALL' && t.subject_id !== selectedSubject) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL') {
        const st = (t.status || 'NOT_STARTED').toUpperCase();
        if (st !== selectedStatus) return false;
      }

      return true;
    });
  }, [topics, searchQuery, selectedSubject, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredTopics.length / pageSize) || 1;
  const paginatedTopics = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTopics.slice(start, start + pageSize);
  }, [filteredTopics, page]);

  const getStatusBadge = (status, pct) => {
    const st = (status || '').toUpperCase();
    if (pct >= 100 || st === 'COMPLETED') {
      return <Badge variant="success" size="sm">Completed</Badge>;
    }
    if (pct > 0 || st === 'IN_PROGRESS') {
      return <Badge variant="warning" size="sm">In Progress</Badge>;
    }
    return <Badge variant="neutral" size="sm">Not Started</Badge>;
  };

  const getDifficultyBadge = (diff) => {
    switch ((diff || '').toUpperCase()) {
      case 'HARD':
        return <Badge variant="danger" size="sm" className="text-[10px]">Hard</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm" className="text-[10px]">Medium</Badge>;
      default:
        return <Badge variant="neutral" size="sm" className="text-[10px]">Easy</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Topic Syllabus Breakdown</CardTitle>
            <p className="text-xs text-slate-500">Track progress, time estimates, and status across your curriculum</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Input
              type="text"
              placeholder="Search topic..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="text-xs h-8"
            />
          </div>

          <div className="w-36">
            <Select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setPage(1);
              }}
              className="text-xs h-8 py-0"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(s => (
                <option key={s.subject_id || s.id} value={s.subject_id || s.id}>
                  {s.subject_name || s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-32">
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs h-8 py-0"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NOT_STARTED">Not Started</option>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 px-0 pb-0">
        {filteredTopics.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-xs text-slate-400">
            <Layers className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            <p className="font-semibold text-slate-600">No topics match your filters</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try clearing search or subject filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Topic</th>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3">Est. Time</th>
                    <th className="py-2.5 px-4">Progress</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedTopics.map((topic) => {
                    const pct = topic.completion_percentage || 0;
                    return (
                      <tr
                        key={topic.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                          {topic.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 border border-slate-200">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: topic.subject_color || '#6366f1' }}
                            />
                            <span className="truncate max-w-[120px]">{topic.subject_name || 'Subject'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {getDifficultyBadge(topic.difficulty)}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {topic.estimated_minutes ? `${topic.estimated_minutes}m` : '—'}
                        </td>
                        <td className="py-3 px-4 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span>Completion</span>
                              <span className="font-bold text-slate-700">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-indigo-600 transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {getStatusBadge(topic.status, pct)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredTopics.length)} of {filteredTopics.length} topics
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <span className="px-2 font-medium text-slate-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicAnalyticsTable;
