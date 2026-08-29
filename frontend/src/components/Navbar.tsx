'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LanguageDropdown, type LanguageType } from '@/components/LanguageDropdown';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export type TabType =
  | 'home'
  | 'find'
  | 'explore'
  | 'vanibot'
  | 'kagazcheck'
  | 'parchaa'
  | 'applications'
  | 'profile';

export type { LanguageType };

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  language?: LanguageType;
  onLanguageChange?: (lang: LanguageType) => void;
  onOpenAssistant?: () => void;
  applicationsCount?: number;
}

export function Navbar({
  currentTab,
  onTabChange,
  language: propLanguage,
  onLanguageChange: propOnLanguageChange,
}: NavbarProps) {
  const globalLang = useLanguage();
  const activeLanguage = propLanguage || globalLang.language;
  const handleLanguageChange = propOnLanguageChange || globalLang.setLanguage;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, handleLogout } = useAuth();

  const handleNav = (tab: TabType) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home' as TabType, label: 'Overview' },
    { id: 'explore' as TabType, label: 'Schemes' },
    { id: 'find' as TabType, label: 'Check Eligibility' },
    { id: 'vanibot' as TabType, label: 'Voice Assistant' },
    { id: 'kagazcheck' as TabType, label: 'Document Check' },
    { id: 'parchaa' as TabType, label: 'Application Form' },
    { id: 'applications' as TabType, label: 'My Applications' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full navbar-solid text-foreground shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Brand Logo - Standalone Large Image */}
          <button
            onClick={() => handleNav('home')}
            className="text-left focus:outline-none cursor-pointer shrink-0 flex items-center py-1"
          >
            <img
              src="/logo.png"
              alt="GramSetu"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
          </button>

          {/* Desktop Navigation Links - Simple & Jargon Free */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((nav) => {
              const isCurrent = currentTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => handleNav(nav.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageDropdown value={activeLanguage} onChange={handleLanguageChange} />

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="btn-primary-sleek py-2 px-4 text-xs h-9 font-bold"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-outline-sleek py-2 px-3.5 text-xs h-9"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary-sleek py-2 px-4 text-xs h-9 font-bold"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg border border-border bg-card text-foreground text-xs font-bold uppercase transition hover:bg-muted cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-border bg-card p-4 space-y-3 animate-sleek shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`p-2.5 text-xs font-semibold rounded-lg text-left transition ${
                  currentTab === item.id
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-border flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex-1 btn-primary-sleek h-9 text-xs font-bold text-center justify-center"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-outline-sleek h-9 px-4 text-xs font-bold text-destructive hover:bg-destructive/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="flex-1 btn-outline-sleek h-9 text-xs font-bold text-center justify-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex-1 btn-primary-sleek h-9 text-xs font-bold text-center justify-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
