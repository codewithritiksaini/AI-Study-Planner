import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Download,
  Eye,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Power,
  UserCheck,
  UserX
} from 'lucide-react';
import adminService from '../services/admin.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal.jsx';
import { useToast } from '../hooks/useToast.js';

export default function AdminStudents() {
  const toast = useToast();
  const { user } = useAuth();

  // Data states
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [platformMetrics, setPlatformMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal inspection state
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Deletion modal state
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle status loading state (tracks student ID being toggled)
  const [togglingId, setTogglingId] = useState(null);

  // Fetch overview metrics
  const fetchOverview = async () => {
    setMetricsLoading(true);
    try {
      const res = await adminService.getOverview();
      const data = res?.data || res;
      setPlatformMetrics(data?.metrics || null);
    } catch (err) {
      console.warn('Failed to fetch platform metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Fetch student roster
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await adminService.getStudents({
        limit,
        offset,
        search,
        role: roleFilter,
        status: statusFilter,
        branch: branchFilter,
        semester: semesterFilter
      });
      const list = res?.data?.students || res?.students || [];
      const total = res?.data?.pagination?.total ?? res?.pagination?.total ?? list.length;
      setStudents(list);
      setTotalCount(total);
    } catch (err) {
      console.error('Failed to fetch students roster:', err);
      toast.error('Failed to load student directory: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  // Initial load & when filters change
  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, limit, roleFilter, statusFilter, branchFilter, semesterFilter]);

  // Handle Search submit / enter
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    fetchStudents();
  };

  // Open detailed student view
  const handleViewStudent = async (studentId) => {
    setSelectedStudentId(studentId);
    setDetailsLoading(true);
    setStudentDetails(null);
    try {
      const res = await adminService.getStudentById(studentId);
      const data = res?.data || res;
      setStudentDetails(data);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      toast.error('Could not load student detailed dossier: ' + (err.message || 'Server error'));
    } finally {
      setDetailsLoading(false);
    }
  };

  // Toggle student status (Active vs Inactive)
  const handleToggleStatus = async (student) => {
    if (student.id === user?.id) {
      toast.error('Administrators cannot deactivate their own active account.');
      return;
    }

    const currentStatus = student.is_active !== false;
    const newStatus = !currentStatus;
    setTogglingId(student.id);

    try {
      await adminService.updateStudentStatus(student.id, newStatus);
      toast.success(
        `Student "${student.full_name || student.email}" marked as ${newStatus ? 'Active' : 'Inactive'}.`
      );

      // Optimistically update list
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, is_active: newStatus } : s))
      );

      // Update details modal if open
      if (studentDetails && studentDetails.id === student.id) {
        setStudentDetails((prev) => ({ ...prev, is_active: newStatus }));
      }

      fetchOverview();
    } catch (err) {
      console.error('Error toggling student status:', err);
      toast.error(err.message || 'Failed to update student account status.');
    } finally {
      setTogglingId(null);
    }
  };

  // Confirm and execute student deletion
  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    if (studentToDelete.id === user?.id) {
      toast.error('Administrators cannot delete their own account.');
      setStudentToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await adminService.deleteStudent(studentToDelete.id);
      toast.success(
        `Student "${studentToDelete.full_name || studentToDelete.email}" and all associated data were deleted.`
      );
      setStudentToDelete(null);

      // Close details modal if open on this student
      if (selectedStudentId === studentToDelete.id) {
        setSelectedStudentId(null);
      }

      fetchStudents();
      fetchOverview();
    } catch (err) {
      console.error('Error deleting student account:', err);
      toast.error(err.message || 'Failed to delete student account.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export roster to CSV
  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      toast.error('No students available to export.');
      return;
    }

    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Role',
      'Status',
      'Branch',
      'Semester',
      'Target CGPA',
      'Enrolled Subjects',
      'Study Sessions',
      'Registration Date'
    ];

    const rows = students.map((s) => [
      `"${s.id || ''}"`,
      `"${(s.full_name || 'Student').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${s.role || 'student'}"`,
      `"${s.is_active !== false ? 'Active' : 'Inactive'}"`,
      `"${s.branch || 'CSE'}"`,
      `"${s.semester || 1}"`,
      `"${s.target_cgpa || '8.5'}"`,
      `"${s.subject_count || 0}"`,
      `"${s.session_count || 0}"`,
      `"${s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `studyplanner_students_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${students.length} student records to CSV.`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setBranchFilter('all');
    setSemesterFilter('all');
    setPage(1);
  };

  // Sorted and displayed list
  const sortedStudents = useMemo(() => {
    if (!students) return [];
    const copy = [...students];
    copy.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [students, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Page Header */}
      <PageHeader
        title="Student & User Management"
        subtitle="Manage registered student accounts, toggle active/inactive statuses, inspect academic dossiers, and delete accounts"
        badge={
          <Badge variant="warning" size="md" className="flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Admin Directory
          </Badge>
        }
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={loading || metricsLoading}
              onClick={() => {
                fetchOverview();
                fetchStudents();
              }}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
              disabled={students.length === 0}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* 2. Platform Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {platformMetrics?.total_students ?? totalCount}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-emerald-600 font-semibold">
              {platformMetrics?.active_students ?? (platformMetrics?.total_students || 0)} Active
            </span>
            {platformMetrics?.inactive_students > 0 && (
              <span className="text-rose-500 font-medium">
                • {platformMetrics.inactive_students} Inactive
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Users</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {platformMetrics?.total_users ?? totalCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {platformMetrics?.total_admins ? `${platformMetrics.total_admins} Admin · ` : ''}All Registered Profiles
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Curriculum Scale</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {platformMetrics?.total_subjects ?? 0}
          </p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            {platformMetrics?.total_topics ? `${platformMetrics.total_topics} Topics Across Courses` : 'Active Subjects'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Study Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {platformMetrics?.total_study_sessions ?? 0}
          </p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            {platformMetrics?.completed_sessions ? `${platformMetrics.completed_sessions} Completed Slots` : 'Total Logged Sessions'}
          </p>
        </div>
      </div>

      {/* 3. Filter Toolbar & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or email..."
              className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button type="submit" variant="primary" size="sm" icon={Search}>
              Search
            </Button>

            {/* Role Filter */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  roleFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Roles
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('student');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  roleFilter === 'student'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Students
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleFilter('admin');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  roleFilter === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admins
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>

            {/* Semester Filter */}
            <select
              value={semesterFilter}
              onChange={(e) => {
                setSemesterFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>

            {(search || roleFilter !== 'all' || statusFilter !== 'all' || branchFilter !== 'all' || semesterFilter !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-rose-600"
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 4. Student Roster Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Registered User Directory
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {totalCount} Total
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-5">Student / User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Branch & Semester</th>
                <th className="py-3 px-3">Target CGPA</th>
                <th className="py-3 px-3 text-center">Subjects</th>
                <th className="py-3 px-3 text-center">Sessions</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-slate-200 rounded" />
                          <div className="w-40 h-3 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3"><div className="w-16 h-5 bg-slate-100 rounded-full" /></td>
                    <td className="py-3.5 px-3"><div className="w-16 h-5 bg-slate-100 rounded-full" /></td>
                    <td className="py-3.5 px-3"><div className="w-20 h-4 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-3"><div className="w-12 h-4 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-3 text-center"><div className="w-8 h-4 bg-slate-100 rounded mx-auto" /></td>
                    <td className="py-3.5 px-3 text-center"><div className="w-8 h-4 bg-slate-100 rounded mx-auto" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-3.5 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-5 text-right"><div className="w-20 h-7 bg-slate-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : sortedStudents.length > 0 ? (
                sortedStudents.map((st) => {
                  const isActive = st.is_active !== false;
                  const isCurrentAdmin = st.id === user?.id;
                  const isToggling = togglingId === st.id;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            {getInitials(st.full_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 text-sm">{st.full_name || 'Student User'}</p>
                              {isCurrentAdmin && (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{st.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={st.role === 'admin' ? 'warning' : 'primary'}
                          size="sm"
                          className="font-semibold"
                        >
                          {st.role === 'admin' ? 'Admin' : 'Student'}
                        </Badge>
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          disabled={isCurrentAdmin || isToggling}
                          onClick={() => handleToggleStatus(st)}
                          title={isCurrentAdmin ? 'Cannot change own status' : 'Click to toggle Active / Inactive'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
                          } ${isCurrentAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {isToggling ? 'Saving...' : isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Branch & Semester */}
                      <td className="py-3.5 px-3 text-slate-700">
                        <span className="font-semibold text-slate-900">{st.branch || 'CSE'}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span>Sem {st.semester || 1}</span>
                      </td>

                      {/* Target CGPA */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px]">
                          🎯 {st.target_cgpa ? Number(st.target_cgpa).toFixed(2) : '8.50'}
                        </span>
                      </td>

                      {/* Enrolled Subjects */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                          {st.subject_count || 0}
                        </span>
                      </td>

                      {/* Study Sessions */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                          {st.session_count || 0}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {st.created_at ? new Date(st.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>

                      {/* Actions: Details, Toggle, Delete */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleViewStudent(st.id)}
                            className="text-xs"
                          >
                            Details
                          </Button>

                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              onClick={() => setStudentToDelete(st)}
                              title="Permanently Delete Student"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                              aria-label="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12">
                    <EmptyState
                      icon={Users}
                      title="No registered students found"
                      description={
                        search || roleFilter !== 'all' || statusFilter !== 'all' || branchFilter !== 'all'
                          ? 'No student profiles matched your filter criteria. Try resetting filters.'
                          : 'No registered student accounts in the platform yet.'
                      }
                      actionLabel={search || roleFilter !== 'all' || statusFilter !== 'all' ? 'Reset Filters' : undefined}
                      onAction={resetFilters}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-900">{Math.min((page - 1) * limit + 1, totalCount)}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(page * limit, totalCount)}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> registered users
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                          page === p
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Student Details Dossier Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {getInitials(studentDetails?.full_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {studentDetails?.full_name || 'Student Details'}
                    </h3>
                    {studentDetails && (
                      <Badge
                        variant={studentDetails.is_active !== false ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {studentDetails.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{studentDetails?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {studentDetails && studentDetails.id !== user?.id && (
                  <Button
                    variant={studentDetails.is_active !== false ? 'outline' : 'primary'}
                    size="sm"
                    icon={studentDetails.is_active !== false ? UserX : UserCheck}
                    isLoading={togglingId === studentDetails.id}
                    onClick={() => handleToggleStatus(studentDetails)}
                    className="text-xs"
                  >
                    {studentDetails.is_active !== false ? 'Deactivate' : 'Activate'}
                  </Button>
                )}
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {detailsLoading ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Loading student dossier...</p>
                </div>
              ) : studentDetails ? (
                <>
                  {/* Academic Profile Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Academic Scope & Profile Parameters
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Role</span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5 capitalize">
                          {studentDetails.role || 'student'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Account Status</span>
                        <p className={`text-xs font-bold mt-0.5 ${studentDetails.is_active !== false ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {studentDetails.is_active !== false ? 'Active Account' : 'Deactivated'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Branch</span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {studentDetails.branch || 'CSE'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Semester</span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          Semester {studentDetails.semester || 1}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Target CGPA</span>
                        <p className="text-xs font-bold text-indigo-700 mt-0.5">
                          🎯 {studentDetails.target_cgpa || '8.50'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Daily Available Hours</span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {studentDetails.daily_available_hours ? `${studentDetails.daily_available_hours} hrs` : '3.00 hrs'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Preferred Study Window</span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {studentDetails.preferred_study_start_time?.slice(0, 5) || '18:00'} -{' '}
                          {studentDetails.preferred_study_end_time?.slice(0, 5) || '22:00'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Registered Since</span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {studentDetails.created_at ? new Date(studentDetails.created_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enrolled Subjects */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Enrolled Curriculum Subjects</span>
                      <span className="font-semibold text-slate-600">
                        {studentDetails.subjects?.length || 0} Total
                      </span>
                    </h4>

                    {studentDetails.subjects && studentDetails.subjects.length > 0 ? (
                      <div className="space-y-2">
                        {studentDetails.subjects.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: sub.color || '#4f46e5' }}
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900">{sub.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {sub.topic_count || 0} curriculum topics
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold text-indigo-600 font-mono">
                                Target: {sub.target_score || 85}%
                              </span>
                              {sub.exam_date && (
                                <p className="text-[10px] text-rose-600 font-medium">
                                  Exam: {new Date(sub.exam_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-400">
                        No subjects enrolled by this student yet.
                      </div>
                    )}
                  </div>

                  {/* Recent Study Sessions */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Recent Study Sessions</span>
                      <span className="font-semibold text-emerald-600">
                        {studentDetails.total_study_minutes || 0} min total focus time
                      </span>
                    </h4>

                    {studentDetails.recent_sessions && studentDetails.recent_sessions.length > 0 ? (
                      <div className="space-y-2">
                        {studentDetails.recent_sessions.map((sess) => (
                          <div
                            key={sess.id}
                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-slate-800">
                                {sess.topic_name || sess.subject_name || 'Study Session'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Recent'} • {sess.duration_minutes || 0} mins logged
                              </p>
                            </div>
                            <Badge
                              variant={sess.status === 'COMPLETED' || sess.status === 'completed' ? 'success' : 'neutral'}
                              size="sm"
                              className="font-semibold capitalize"
                            >
                              {sess.status || 'Active'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-400">
                        No study sessions recorded yet.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Could not load student information.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              {studentDetails && studentDetails.id !== user?.id ? (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => {
                    setStudentToDelete(studentDetails);
                  }}
                  className="text-xs"
                >
                  Delete Student
                </Button>
              ) : (
                <div />
              )}

              <Button variant="outline" size="sm" onClick={() => setSelectedStudentId(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {studentToDelete && (
        <DeleteConfirmModal
          isOpen={Boolean(studentToDelete)}
          isDeleting={isDeleting}
          onClose={() => setStudentToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Student Account"
          message={`Are you sure you want to permanently delete "${studentToDelete.full_name || studentToDelete.email}"? This action will remove all enrolled subjects, topics, study plans, quiz records, and study telemetry. This cannot be undone.`}
          confirmText="Yes, Permanently Delete"
        />
      )}
    </div>
  );
}
