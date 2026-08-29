'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  label: string;
  value: string;
  badge?: string;
  desc?: string;
}

interface CustomDropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | DropdownOption)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Normalize options
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-1.5 text-left relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-10 px-3.5 py-2 text-xs rounded-xl border bg-slate-50 hover:bg-white focus:bg-white transition flex items-center justify-between gap-2 cursor-pointer ${
          isOpen
            ? 'border-slate-900 ring-2 ring-slate-900/5 bg-white shadow-2xs'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`font-semibold truncate ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-200 text-slate-700 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-900' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto scrollbar-thin">
          <div className="p-1.5 space-y-0.5">
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate">{opt.label}</div>
                    {opt.desc && (
                      <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {opt.desc}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <svg className="w-4 h-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
