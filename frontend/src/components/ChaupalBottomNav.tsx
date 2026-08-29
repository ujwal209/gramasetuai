'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function ChaupalBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      href: '/dashboard/chaupal',
      label: 'Feed',
      icon: (isActive: boolean) => (
        <svg
          className={`w-6 h-6 transition ${isActive ? 'text-slate-900 stroke-[2.5]' : 'text-slate-500 hover:text-slate-800'}`}
          fill={isActive ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isActive ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/dashboard/chaupal/explore',
      label: 'Explore',
      icon: (isActive: boolean) => (
        <svg
          className={`w-6 h-6 transition ${isActive ? 'text-slate-900 stroke-[2.5]' : 'text-slate-500 hover:text-slate-800'}`}
          fill={isActive ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isActive ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/chaupal/create',
      label: 'Create',
      isCreate: true,
      icon: (isActive: boolean) => (
        <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition ${isActive ? 'bg-emerald-700 ring-2 ring-emerald-400' : 'bg-slate-900'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      ),
    },
    {
      href: '/dashboard/chaupal/marketplace',
      label: 'Market',
      icon: (isActive: boolean) => (
        <svg
          className={`w-6 h-6 transition ${isActive ? 'text-slate-900 stroke-[2.5]' : 'text-slate-500 hover:text-slate-800'}`}
          fill={isActive ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isActive ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/chaupal/messages',
      label: 'Messages',
      icon: (isActive: boolean) => (
        <svg
          className={`w-6 h-6 transition ${isActive ? 'text-slate-900 stroke-[2.5]' : 'text-slate-500 hover:text-slate-800'}`}
          fill={isActive ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={isActive ? 0 : 2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/chaupal/profile/me',
      label: 'Profile',
      icon: (isActive: boolean) => (
        <div className={`w-6 h-6 rounded-full overflow-hidden border-2 transition ${isActive ? 'border-slate-900 scale-110' : 'border-transparent'}`}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <nav aria-label="Kisan Chaupal Navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 shadow-lg flex items-center justify-around max-w-lg mx-auto sm:rounded-t-2xl sm:bottom-2 sm:border sm:border-slate-200">
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard/chaupal'
            ? pathname === '/dashboard/chaupal'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center justify-center p-1.5 min-w-[54px] cursor-pointer"
          >
            {item.icon(isActive)}
            {!item.isCreate && (
              <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
