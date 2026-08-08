'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { reviewBadge, severityBadge } from '@/lib/utils/badge';
import type { CaseDTO } from '@/types/case';

const COLS = '1.6fr 1fr 1.2fr 1fr 1.2fr 90px';

export function HistoryTable({ cases }: { cases: CaseDTO[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-card">
      <div
        className="hidden gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"
        style={{ gridTemplateColumns: COLS }}
      >
        <div>Pasien</div>
        <div>Tanggal</div>
        <div>Jenis Tumor</div>
        <div>Risiko</div>
        <div>Status Tinjauan</div>
        <div />
      </div>

      {cases.map((c) => {
        const sev = severityBadge(c.severity);
        const rev = reviewBadge(c.review);
        return (
          <div
            key={c.id}
            className="relative flex flex-col gap-2 border-b border-slate-100 py-4 pl-5 pr-5 last:border-b-0 md:grid md:items-center md:gap-4"
            style={{ gridTemplateColumns: COLS }}
          >
            <div className="pr-28 md:pr-0">
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.mrn}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 md:contents">
              <span className="font-mono md:text-[13px] md:text-slate-700">{c.examDate}</span>
              <span className="md:text-[13px] md:text-slate-700">
                <span className="md:hidden">· </span>
                {c.tumorType}
              </span>
            </div>
            <div className="flex gap-2 md:contents">
              <Badge label={sev.label} className={sev.className} />
              <Badge label={rev.label} className={rev.className} />
            </div>
            <button
              onClick={() => router.push(`/viewer/${c.id}?from=history`)}
              className="absolute right-5 top-4 rounded-lg border border-slate-200 bg-white px-3 py-1.75 py-[7px] text-[12.5px] font-semibold text-brand-600 hover:bg-slate-50 md:static"
            >
              Bandingkan
            </button>
          </div>
        );
      })}

      {cases.length === 0 && (
        <EmptyState
          title="Tidak ada kasus yang cocok"
          description="Coba ubah kata kunci pencarian atau filter risiko."
        />
      )}
    </div>
  );
}
