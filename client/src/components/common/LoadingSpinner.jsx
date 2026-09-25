import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', message, className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-indigo-600 animate-spin`} />
      {message && <p className="mt-3 text-xs text-slate-500 font-medium">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
