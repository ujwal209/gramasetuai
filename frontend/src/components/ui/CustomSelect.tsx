'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  required = false,
  disabled = false,
  className = '',
  searchable = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && search.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`space-y-1.5 relative w-full text-left ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-800 block leading-tight">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 px-3.5 rounded-xl border bg-slate-50 text-xs font-semibold flex items-center justify-between transition cursor-pointer focus:outline-none focus:bg-white focus:border-emerald-500 shadow-2xs ${
          isOpen ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <span className={`truncate text-left flex-1 ${selectedOption ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-emerald-700' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 animate-sleek max-h-60 overflow-y-auto w-full min-w-full">
          {searchable && (
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to filter..."
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
              />
            </div>
          )}

          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-slate-400 text-center">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3.5 py-2.5 text-left text-xs transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold'
                        : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-xs shrink-0 font-bold text-white">✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
