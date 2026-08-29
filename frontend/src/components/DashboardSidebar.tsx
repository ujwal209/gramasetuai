'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageDropdown } from '@/components/LanguageDropdown';
import { dashboardTranslations } from '@/lib/dashboardTranslations';

interface DashboardSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSection {
  title?: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
    sublinks?: Array<{ href: string; label: string }>;
  }>;
}

export function DashboardSidebar({
  mobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, handleLogout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const t = dashboardTranslations[language]?.sidebar || dashboardTranslations.en.sidebar;

  const navSections: NavSection[] = [
    {
      title: 'Platform',
      items: [
        {
          href: '/dashboard',
          label: t.overview || 'Overview',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          ),
        },
        {
          href: '/dashboard/schemes',
          label: t.schemes || 'Scheme Directory',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          ),
          sublinks: [
            { href: '/dashboard/schemes', label: 'All Schemes' },
            { href: '/dashboard/schemes/history', label: 'Search History' },
          ],
        },
      ],
    },
    {
      title: 'Advisory & Voice',
      items: [
        {
          href: '/dashboard/nitirag',
          label: t.nitirag || 'Legal Advisory',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
            </svg>
          ),
          sublinks: [
            { href: '/dashboard/nitirag/chat', label: 'Legal Advisor Chat' },
            { href: '/dashboard/nitirag/documents', label: 'Gazettes & Documents' },
            { href: '/dashboard/nitirag/upload', label: 'Upload Document' },
          ],
        },
        {
          href: '/dashboard/vanibot',
          label: t.vanibot || 'Vani Voice Assistant',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          ),
          sublinks: [
            { href: '/dashboard/vanibot', label: 'Voice Session' },
            { href: '/dashboard/vanibot/history', label: 'Call History' },
          ],
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          href: '/dashboard/chaupal',
          label: 'Kisan Chaupal',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          ),
          sublinks: [
            { href: '/dashboard/chaupal', label: 'Feed & Updates' },
            { href: '/dashboard/chaupal/explore', label: 'Explore Network' },
            { href: '/dashboard/chaupal/messages', label: 'Direct Messages' },
            { href: '/dashboard/chaupal/marketplace', label: 'Marketplace' },
            { href: '/dashboard/chaupal/create', label: 'New Post' },
            { href: '/dashboard/chaupal/profile/me', label: 'My Social Profile' },
          ],
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          href: '/dashboard/profile',
          label: t.profile || 'Profile & Land Records',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const handleLogoutClick = () => {
    handleLogout();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Professional Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-200 ease-in-out ${
          isCollapsed ? 'lg:w-16' : 'lg:w-60'
        } w-60 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-slate-100 shrink-0 bg-white space-y-2.5">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <Link href="/dashboard" className="flex items-center gap-2.5 focus:outline-none overflow-hidden">
              <img
                src="/logo.png"
                alt="GramSetu"
                className="h-6 w-auto object-contain shrink-0"
              />
              {!isCollapsed && (
                <span className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                  GramSetu
                </span>
              )}
            </Link>

            {/* Header controls (only when expanded or on mobile) */}
            <div className="flex items-center gap-1">
              {onToggleCollapse && !isCollapsed && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}

              {/* Mobile Close */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Close sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Expand Button (when collapsed) */}
          {onToggleCollapse && isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex w-full p-1 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Language Selector (Expanded Mode) */}
          {!isCollapsed && (
            <div className="pt-1">
              <LanguageDropdown value={language} onChange={setLanguage} />
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-3.5 bg-white min-h-0">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {!isCollapsed && section.title && (
                <div className="px-2 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </span>
                </div>
              )}

              {section.items.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);

                const hasSublinks = item.sublinks && item.sublinks.length > 0;
                const isSublinksOpen = hasSublinks && pathname.startsWith(item.href) && !isCollapsed;

                return (
                  <div key={item.href} className="space-y-0.5">
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-normal'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>

                    {/* Sublinks */}
                    {isSublinksOpen && (
                      <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-slate-100 ml-3.5 my-0.5">
                        {item.sublinks?.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={onCloseMobile}
                              className={`block px-2 py-1 rounded text-[11px] transition truncate ${
                                isSubActive
                                  ? 'text-slate-900 font-semibold bg-slate-100'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Profile and Actions */}
        <div className="p-2.5 border-t border-slate-100 bg-white space-y-1.5 shrink-0">
          {/* User Account Link */}
          <Link
            href="/dashboard/profile"
            onClick={onCloseMobile}
            title={isCollapsed ? user?.name || 'Citizen' : undefined}
            className={`flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100/70 transition group ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-semibold text-slate-600">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {user?.name || 'Citizen User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  @{user?.handle || 'citizen'}
                </p>
              </div>
            )}
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className={`w-full py-1.5 px-2 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 rounded-lg transition flex items-center gap-2 cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? t.logout || 'Logout' : undefined}
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {!isCollapsed && <span>{t.logout || 'Sign out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
