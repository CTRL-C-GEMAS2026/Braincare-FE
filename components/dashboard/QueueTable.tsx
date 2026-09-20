'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { severityBadge, statusBadge } from '@/lib/utils/badge';
import type { CaseDTO } from '@/types/case';

const COLS = '1.6fr 1fr 1fr 1fr 1fr 40px';

export function QueueTable({ cases }: { cases: CaseDTO[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-card">
      <div
        className="hidden gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"
        style={{ gridTemplateColumns: COLS }}
      >
        <div>Pasien</div>
        <div>Tanggal Unggah</div>
        <div>Jenis Pemeriksaan</div>
        <div>Status</div>
        <div>Tingkat Risiko</div>
        <div />
      </div>
      {cases.map((c) => {
        const sev = severityBadge(c.severity);
        const st = statusBadge(c.status);
        return (
          <div
            key={c.id}
            onClick={() => router.push(`/viewer/${c.id}?from=dashboard`)}
            className="relative flex cursor-pointer flex-col gap-2 border-b border-slate-100 py-4 pl-5 pr-11 transition-colors last:border-b-0 hover:bg-slate-50 md:grid md:items-center md:gap-4 md:pr-5"
            style={{ gridTemplateColumns: COLS }}
          >
            <div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.mrn}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 md:contents">
              <span className="font-mono md:text-[13px] md:text-slate-700">{c.examDate}</span>
              <span className="md:text-[13px] md:text-slate-700">
                <span className="md:hidden">· </span>
                MRI Otak (T1/T2/FLAIR)
              </span>
            </div>
            <div className="flex gap-2 md:contents">
              <Badge label={st.label} className={st.className} />
              <Badge label={sev.label} className={sev.className} />
            </div>
            <div className="absolute right-4 top-4 text-slate-400 md:static">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        );
      })}

      {cases.length === 0 && (
        <EmptyState
          title="Belum ada kasus di antrian"
          description="Unggah pemeriksaan MRI baru untuk mulai dianalisis oleh AI."
        />
      )}
    </div>
  );
}
