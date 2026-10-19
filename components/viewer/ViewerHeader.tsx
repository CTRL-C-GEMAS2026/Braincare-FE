'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError, fetchReportPdf } from '@/lib/api/client';
import { toast } from '@/lib/hooks/useToast';
import { Badge } from '@/components/ui/Badge';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { severityBadge, statusBadge } from '@/lib/utils/badge';
import type { CaseDTO } from '@/types/case';

export function ViewerHeader({ activeCase, cameFrom, editingNarrative = false }: { activeCase: CaseDTO; cameFrom: string; editingNarrative?: boolean }) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await fetchReportPdf(activeCase.id, activeCase.reportRevision);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `BrainCare-${activeCase.id}-r${activeCase.reportRevision}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Laporan PDF gagal diunduh.');
    } finally { setDownloading(false); }
  }
  const sev = activeCase.isAnalyzing ? statusBadge(activeCase.status) : severityBadge(activeCase.severity);

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
        <BookmarkButton caseId={activeCase.id} className="border border-slate-200 bg-white" />
        <button
          onClick={() => void downloadPdf()}
          disabled={!activeCase.isFinalized || editingNarrative || downloading}
          title={activeCase.isFinalized ? 'Unduh laporan final yang disetujui' : 'Setujui dan finalisasi laporan untuk mengunduh PDF'}
          data-testid="download-report"
          className="flex items-center gap-1.75 gap-[7px] rounded-[9px] border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 md:px-3.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8">
            <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
            <path d="M15 2v5h5" />
            <path d="M9 15h6M9 18h6" />
          </svg>
          <span className="hidden md:inline">{downloading ? 'Mengunduh…' : 'Unduh PDF Final'}</span>
        </button>
        <Badge label={sev.label} className={sev.className} />
      </div>
    </div>
  );
}
