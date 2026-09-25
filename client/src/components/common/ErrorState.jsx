import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`p-6 bg-red-50/60 rounded-xl border border-red-200/80 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2.5">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-red-900">{title}</h4>
      <p className="text-xs text-red-700 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-3.5">
          <Button variant="outline" size="sm" onClick={onRetry} icon={RefreshCw}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
