import React from 'react';

export const Select = ({
  label,
  id,
  options = [],
  error,
  helperText,
  className = '',
  required = false,
  ...props
}) => {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:ring-red-400 focus:border-red-400'
            : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Select;
