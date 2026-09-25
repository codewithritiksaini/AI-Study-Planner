import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warn: AlertTriangle,
  info: Info
};

const TOAST_STYLES = {
  success: {
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    bgIcon: 'bg-emerald-50',
    title: 'text-emerald-950'
  },
  error: {
    border: 'border-rose-200',
    iconColor: 'text-rose-600',
    bgIcon: 'bg-rose-50',
    title: 'text-rose-950'
  },
  warn: {
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    bgIcon: 'bg-amber-50',
    title: 'text-amber-950'
  },
  info: {
    border: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    bgIcon: 'bg-indigo-50',
    title: 'text-indigo-950'
  }
};

export const ToastItem = ({ id, type = 'info', title, message, onDismiss, duration = 4000 }) => {
  const Icon = TOAST_ICONS[type] || Info;
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`flex items-start gap-3 w-80 sm:w-96 p-4 bg-white rounded-xl border ${style.border} shadow-lg shadow-slate-200/50 transition-all duration-300 animate-in fade-in slide-in-from-top-2`}
    >
      <div className={`p-1.5 rounded-lg ${style.bgIcon} ${style.iconColor} shrink-0 mt-0.5`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        {title && <h5 className={`text-sm font-semibold ${style.title}`}>{title}</h5>}
        <p className="text-xs text-slate-600 leading-relaxed break-words">{message}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Close notification"
        className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto max-w-full px-4 sm:px-0"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
