'use client';

import React from 'react';

interface CustomCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomCheckbox({
  id,
  checked,
  onChange,
  label,
  sublabel,
  disabled = false,
  className = '',
}: CustomCheckboxProps) {
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-full p-3.5 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 select-none cursor-pointer focus:outline-none ${
        checked
          ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-400/80 shadow-xs'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Crisp Checkbox Box with explicit dimensions and sharp white SVG tick */}
      <div
        style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
        className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center transition-all duration-200 shrink-0 ${
          checked
            ? 'bg-emerald-600 border-2 border-emerald-600 shadow-xs'
            : 'border-2 border-slate-300 bg-white'
        }`}
      >
        {checked && (
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Label and Sublabel */}
      <div className="flex-1 min-w-0 break-words">
        <p
          className={`text-xs font-bold leading-snug transition-colors ${
            checked ? 'text-emerald-950 font-black' : 'text-slate-800'
          }`}
        >
          {label}
        </p>
        {sublabel && (
          <p
            className={`text-[11px] leading-normal mt-0.5 break-words transition-colors ${
              checked ? 'text-emerald-800 font-medium' : 'text-slate-500'
            }`}
          >
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
}
