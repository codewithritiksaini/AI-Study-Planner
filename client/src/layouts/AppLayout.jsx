import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { navigationItems } from '../components/layout/Sidebar.jsx';
import Header from '../components/layout/Header.jsx';

export const AppLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Find active page title from route
  const currentNav = navigationItems.find((item) => item.path === location.pathname);
  let pageTitle = currentNav?.label;
  if (!pageTitle) {
    if (location.pathname === '/admin') pageTitle = 'Admin Console & Diagnostics';
    else if (location.pathname === '/admin/students') pageTitle = 'Student & User Directory';
    else pageTitle = 'AI Study Planner';
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Desktop Fixed Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <Sidebar />
      </div>

      {/* 2. Mobile Slide-Over Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 h-full bg-white z-50 shadow-2xl">
            <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main Viewport */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        <Header onOpenSidebar={() => setIsMobileSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
