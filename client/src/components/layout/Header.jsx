import React from 'react';
import { Menu, Sparkles, UserCircle } from 'lucide-react';
import Badge from '../common/Badge.jsx';

export const Header = ({ onOpenSidebar, pageTitle }) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-semibold text-slate-800">{pageTitle || 'AI Study Planner'}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>API Connected</span>
        </div>

        {/* User Profile Avatar / Chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            RS
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Student</p>
            <p className="text-[10px] text-slate-400 mt-0.5">B.Tech CSE</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
