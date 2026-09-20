'use client';

import clsx from 'clsx';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { toast } from '@/lib/hooks/useToast';

export function BookmarkButton({ caseId, className }: { caseId: string; className?: string }) {
  const { isBookmarked, toggle } = useBookmarks();
  const active = isBookmarked(caseId);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle(caseId);
        toast.success(active ? 'Bookmark dihapus.' : 'Ditandai sebagai bookmark.');
      }}
      aria-label={active ? 'Hapus bookmark' : 'Tandai kasus'}
      title={active ? 'Hapus bookmark' : 'Tandai kasus'}
      className={clsx(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-500',
        active && 'text-amber-500',
        className
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" />
      </svg>
    </button>
  );
}
