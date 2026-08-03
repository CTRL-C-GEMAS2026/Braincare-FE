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
        className="grid gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
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
            className="grid items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
            style={{ gridTemplateColumns: COLS }}
          >
            <div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.mrn}</div>
            </div>
            <div className="font-mono text-[13px] text-slate-700">{c.examDate}</div>
            <div className="text-[13px] text-slate-700">{c.tumorType}</div>
            <div>
              <Badge label={sev.label} className={sev.className} />
            </div>
            <div>
              <Badge label={rev.label} className={rev.className} />
            </div>
            <button
              onClick={() => router.push(`/viewer/${c.id}?from=history`)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.75 py-[7px] text-[12.5px] font-semibold text-brand-600 hover:bg-slate-50"
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
