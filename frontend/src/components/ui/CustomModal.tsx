'use client';

import React, { useEffect } from 'react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
}

const MAX_WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export function CustomModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '3xl',
  className = '',
}: CustomModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Surface */}
      <div
        className={`relative z-10 w-full ${MAX_WIDTHS[maxWidth]} bg-card border border-border corner-tick shadow-2xl overflow-hidden flex flex-col text-left animate-reveal ${className}`}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="p-5 sm:p-6 border-b border-border bg-card flex items-start justify-between gap-4">
            <div className="space-y-1">
              {title && (
                <h3 className="text-lg font-black text-foreground tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-code font-bold uppercase text-muted-foreground hover:text-foreground border border-border cursor-pointer shrink-0"
            >
              [ Close ]
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-card">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
