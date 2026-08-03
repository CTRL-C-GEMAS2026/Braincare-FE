'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LogoMark } from './Logo';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Beranda', icon: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z' },
  { href: '/upload', label: 'Unggah', icon: 'M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3' },
  { href: '/history', label: 'Riwayat', icon: 'M12 8v4l3 3M4 12a8 8 0 108-8' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-[76px] flex-shrink-0 flex-col items-center gap-7 border-r border-slate-200 bg-slate-50 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-brand-600 shadow-cta">
        <LogoMark size={20} />
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex h-13 w-13 h-[52px] w-[52px] flex-col items-center justify-center gap-1 rounded-xl transition-colors',
              active ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d={item.icon} />
            </svg>
            <div className="text-[10px] font-semibold">{item.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
