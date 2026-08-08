'use client';

import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Dropdown } from '@/components/ui/Dropdown';
import type { UserProfile } from '@/types/user';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/upload': 'Unggah Pemeriksaan',
  '/history': 'Riwayat Pemeriksaan',
  '/profile': 'Profil & Manajemen Pengguna',
};

function titleFor(pathname: string): string {
  if (pathname.startsWith('/viewer')) return 'Viewer Analisis MRI';
  return TITLES[pathname] ?? '';
}

export function Header() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { logout } = useAuth();
  const { data: profile } = useSWR<UserProfile>('/api/profile', fetcher);

  const initials = profile
    ? profile.name
        .replace(/^dr\.\s*/i, '')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  return (
    <div className="flex h-15 h-[60px] flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 md:px-7">
      <div className="text-[17px] font-bold text-slate-900">{titleFor(pathname)}</div>
      <Dropdown
        trigger={({ toggle }) => (
          <button
            onClick={toggle}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-50"
          >
            <div className="text-right">
              <div className="text-[13px] font-semibold text-slate-900">{profile?.name}</div>
              <div className="hidden text-[11px] text-slate-500 md:block">{profile?.hospital}</div>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cover bg-center bg-brand-100 text-[13px] font-bold text-brand-600"
              style={profile?.photoUrl ? { backgroundImage: `url(${profile.photoUrl})` } : undefined}
            >
              {!profile?.photoUrl && initials}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.4">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      >
        <button
          onClick={() => router.push('/profile')}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8">
            <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6M12 12a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
          Profil &amp; Manajemen Pengguna
        </button>
        <div className="my-1 h-px bg-slate-100" />
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-danger-700 hover:bg-slate-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Keluar
        </button>
      </Dropdown>
    </div>
  );
}
