import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
