import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Timer,
  HelpCircle,
  CheckCircle2,
  BarChart3,
  Sparkles,
  User,
  Settings,
  X,
  GraduationCap
} from 'lucide-react';
import Badge from '../common/Badge.jsx';

export const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Planner', path: '/planner', icon: Calendar },
  { label: 'Subjects', path: '/subjects', icon: BookOpen },
  { label: 'Study', path: '/study', icon: Timer },
  { label: 'Quiz', path: '/quiz', icon: HelpCircle },
  { label: 'Progress', path: '/progress', icon: CheckCircle2 },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'AI Tutor', path: '/ai-tutor', icon: Sparkles, badge: 'AI' },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings }
];

export const Sidebar = ({ onClose }) => {
  return (
    <aside className="flex flex-col h-full bg-white text-slate-700 w-64 border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 text-slate-900 font-bold text-base tracking-tight" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span>StudyPlanner</span>
        </NavLink>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Academic Navigation
        </p>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge variant="purple" size="sm" className="bg-purple-100 text-purple-700 border-purple-200 font-semibold text-[9px]">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info / Project Status */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-600">CSE Capstone</span>
          <Badge variant="primary" size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
            Phase 2
          </Badge>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Adaptive Engine & Gemini AI integration in later phases.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
