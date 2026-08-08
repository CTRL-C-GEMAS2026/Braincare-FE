'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { severityBadge } from '@/lib/utils/badge';
import type { CaseDTO } from '@/types/case';

export function ViewerHeader({ activeCase, cameFrom }: { activeCase: CaseDTO; cameFrom: string }) {
  const router = useRouter();
  const sev = severityBadge(activeCase.severity);

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3.5 md:px-7">
      <div className="flex min-w-0 items-center gap-3.5">
        <button
          onClick={() => router.push(cameFrom === 'history' ? '/history' : '/dashboard')}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold">
            {activeCase.name} <span className="font-medium text-slate-400">· {activeCase.mrn}</span>
          </div>
          <div className="truncate text-xs text-slate-500">
            {activeCase.age} th, {activeCase.gender} · MRI Otak · {activeCase.examDate}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.75 gap-[7px] rounded-[9px] border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 md:px-3.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8">
            <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
            <path d="M15 2v5h5" />
            <path d="M9 15h6M9 18h6" />
          </svg>
          <span className="hidden md:inline">Ekspor PDF</span>
        </button>
        <Badge label={sev.label} className={sev.className} />
      </div>
    </div>
  );
}
