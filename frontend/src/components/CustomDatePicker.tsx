'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CustomDatePickerProps {
  label?: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
}

export function CustomDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  className = '',
  minDate,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse initial date or default to current date
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() ?? new Date().getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside to close
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${mm}-${dd}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setViewYear(yyyy);
    setViewMonth(today.getMonth());
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Calculate calendar grid days
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Format display text
  const formatDisplay = (val: string) => {
    if (!val) return '';
    try {
      const d = new Date(val + 'T00:00:00');
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return val;
    }
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
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-10 px-3.5 py-2 text-xs rounded-xl border bg-slate-50 hover:bg-white focus:bg-white transition flex items-center justify-between gap-2 cursor-pointer ${
          isOpen
            ? 'border-slate-900 ring-2 ring-slate-900/5 bg-white shadow-2xs'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`font-semibold truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>

        <span className="text-[10px] font-mono text-slate-400">
          {value || 'YYYY-MM-DD'}
        </span>
      </button>

      {/* Custom Calendar Card Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Month & Year Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span className="text-xs font-bold text-slate-900">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[10px] font-bold font-mono text-slate-400 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Previous month padding */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const prevDateNum = daysInPrevMonth - firstDayIndex + i + 1;
              return (
                <span
                  key={`prev-${i}`}
                  className="w-8 h-8 flex items-center justify-center text-[11px] text-slate-300 select-none"
                >
                  {prevDateNum}
                </span>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const dayNum = i + 1;
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(dayNum).padStart(2, '0');
              const cellDateStr = `${viewYear}-${mm}-${dd}`;
              const isSelected = value === cellDateStr;
              const isToday =
                new Date().toISOString().split('T')[0] === cellDateStr;

              return (
                <button
                  key={`cur-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-2xs scale-105'
                      : isToday
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold hover:bg-emerald-100'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
