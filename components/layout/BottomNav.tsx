'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NAV_ITEMS } from './Sidebar';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex h-16 flex-shrink-0 items-stretch justify-around border-t border-slate-200 bg-white md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-1 flex-col items-center justify-center gap-1',
              active ? 'text-brand-600' : 'text-slate-500'
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
