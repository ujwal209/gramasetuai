'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface SuggestionItem {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
}

interface AutoSuggestInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: SuggestionItem) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  // Either static suggestions or dynamic API fetcher
  suggestions?: string[] | SuggestionItem[];
  fetchSuggestions?: (query: string) => Promise<SuggestionItem[]>;
}

export function AutoSuggestInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Type to search...',
  required = false,
  disabled = false,
  className = '',
  suggestions = [],
  fetchSuggestions,
}: AutoSuggestInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Normalize static suggestions if provided
  const normalizedStatic: SuggestionItem[] = typeof suggestions[0] === 'string'
    ? (suggestions as string[]).map((s) => ({ id: s, title: s }))
    : (suggestions as SuggestionItem[]);

  const handleFetch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setItems(normalizedStatic.slice(0, 8));
        return;
      }

      if (fetchSuggestions) {
        setLoading(true);
        try {
          const res = await fetchSuggestions(q);
          setItems(res);
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      } else {
        const filtered = normalizedStatic.filter((item) =>
          item.title.toLowerCase().includes(q.toLowerCase()) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(q.toLowerCase()))
        );
        setItems(filtered.slice(0, 8));
      }
    },
    [fetchSuggestions, normalizedStatic]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        handleFetch(value);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [value, isOpen, handleFetch]);

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
    <div ref={containerRef} className={`space-y-1 relative ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-foreground block">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            handleFetch(value);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          className="input-sleek h-9 pr-8"
        />

        {loading ? (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>

      {isOpen && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-white border border-border shadow-xl py-1 animate-sleek max-h-52 overflow-y-auto">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
            Suggested Matches
          </div>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChange(item.title);
                if (onSelect) onSelect(item);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs transition cursor-pointer hover:bg-emerald-50/70 flex items-center justify-between border-b border-border/30 last:border-0"
            >
              <div className="truncate">
                <p className="font-bold text-foreground truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                )}
              </div>
              {item.category && (
                <span className="badge-saas badge-saas-neutral text-[8px] shrink-0 ml-2">
                  {item.category}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
