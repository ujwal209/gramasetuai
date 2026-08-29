'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SuggestionItem } from './AutoSuggestInput';

interface MultiTagAutoSuggestProps {
  label?: string;
  sublabel?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[] | SuggestionItem[];
  fetchSuggestions?: (query: string) => Promise<SuggestionItem[]>;
  quickSuggestions?: string[];
  className?: string;
}

export function MultiTagAutoSuggest({
  label,
  sublabel,
  tags = [],
  onChange,
  placeholder = 'Type to search or add...',
  suggestions = [],
  fetchSuggestions,
  quickSuggestions = [],
  className = '',
}: MultiTagAutoSuggestProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SuggestionItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizedStatic: SuggestionItem[] = typeof suggestions[0] === 'string'
    ? (suggestions as string[]).map((s) => ({ id: s, title: s }))
    : (suggestions as SuggestionItem[]);

  const handleFetch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setItems(normalizedStatic.filter((s) => !tags.includes(s.title)).slice(0, 6));
        return;
      }

      if (fetchSuggestions) {
        setLoading(true);
        try {
          const res = await fetchSuggestions(q);
          setItems(res.filter((s) => !tags.includes(s.title)));
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      } else {
        const filtered = normalizedStatic.filter(
          (item) =>
            !tags.includes(item.title) &&
            (item.title.toLowerCase().includes(q.toLowerCase()) ||
              (item.subtitle && item.subtitle.toLowerCase().includes(q.toLowerCase())))
        );
        setItems(filtered.slice(0, 6));
      }
    },
    [fetchSuggestions, normalizedStatic, tags]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        handleFetch(query);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query, isOpen, handleFetch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        addTag(query);
      }
    } else if (e.key === 'Backspace' && !query && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className={`space-y-1.5 relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-foreground block">
            {label}
          </label>
          {sublabel && (
            <span className="text-[10px] text-muted-foreground">{sublabel}</span>
          )}
        </div>
      )}

      {/* Selected Tag Chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold animate-sleek"
            >
              <span className="truncate max-w-[200px]">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center text-[10px] transition cursor-pointer"
                aria-label={`Remove ${tag}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search & Add Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={tags.length > 0 ? 'Type to add more...' : placeholder}
          onFocus={() => {
            setIsOpen(true);
            handleFetch(query);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="input-sleek h-9 pr-16 text-xs"
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
          )}
          {query.trim() && (
            <button
              type="button"
              onClick={() => addTag(query)}
              className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary text-white hover:bg-primary/90 transition cursor-pointer shadow-xs"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Quick Suggestions Chips */}
      {quickSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
            Quick Add:
          </span>
          {quickSuggestions
            .filter((s) => !tags.includes(s))
            .slice(0, 4)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-border bg-slate-50 text-foreground hover:bg-white hover:border-primary transition cursor-pointer"
              >
                + {s}
              </button>
            ))}
        </div>
      )}

      {/* Auto-Suggestion Dropdown Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-white border border-border shadow-xl py-1 animate-sleek max-h-52 overflow-y-auto">
          {query.trim() && !items.some((i) => i.title.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={() => addTag(query)}
              className="w-full px-3 py-2 text-left text-xs bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-bold flex items-center justify-between border-b border-border transition cursor-pointer"
            >
              <span>+ Add &ldquo;{query.trim()}&rdquo; (Custom)</span>
              <span className="text-[10px] text-emerald-700">Press Enter</span>
            </button>
          )}

          <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
            Suggested Options
          </div>

          {items.length === 0 && !query.trim() ? (
            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
              Type any name to add custom items
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addTag(item.title)}
                className="w-full px-3 py-2 text-left text-xs transition cursor-pointer hover:bg-slate-50 flex items-center justify-between border-b border-border/20 last:border-0"
              >
                <div className="truncate pr-2">
                  <p className="font-bold text-foreground truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold text-primary shrink-0">+ Add</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
