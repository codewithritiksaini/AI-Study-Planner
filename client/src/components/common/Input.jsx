import React from 'react';

export const Input = ({
  label,
  id,
  error,
  helperText,
  className = '',
  required = false,
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:ring-red-400 focus:border-red-400'
            : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
