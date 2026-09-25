import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import Badge from '../common/Badge.jsx';

/**
 * Reusable Badge for displaying Topic Performance / Mastery levels.
 * STRICT LIGHT THEME ONLY.
 */
export const PerformanceBadge = ({ level, size = 'sm', showIcon = true, className = '' }) => {
  const normLevel = String(level || 'NOT_ASSESSED').toUpperCase();

  switch (normLevel) {
    case 'WEAK':
      return (
        <Badge variant="danger" size={size} className={`gap-1 font-semibold ${className}`}>
          {showIcon && <AlertCircle className="w-3 h-3 text-red-600" />}
          <span>Weak</span>
        </Badge>
      );

    case 'NEEDS_PRACTICE':
      return (
        <Badge variant="warning" size={size} className={`gap-1 font-semibold ${className}`}>
          {showIcon && <AlertTriangle className="w-3 h-3 text-amber-600" />}
          <span>Needs Practice</span>
        </Badge>
      );

    case 'AVERAGE':
      return (
        <Badge variant="primary" size={size} className={`gap-1 font-semibold ${className}`}>
          {showIcon && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
          <span>Average</span>
        </Badge>
      );

    case 'STRONG':
      return (
        <Badge variant="success" size={size} className={`gap-1 font-semibold ${className}`}>
          {showIcon && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          <span>Strong</span>
        </Badge>
      );

    case 'NOT_ASSESSED':
    default:
      return (
        <Badge variant="neutral" size={size} className={`gap-1 text-slate-500 ${className}`}>
          {showIcon && <HelpCircle className="w-3 h-3 text-slate-400" />}
          <span>Not Assessed</span>
        </Badge>
      );
  }
};

export default PerformanceBadge;
