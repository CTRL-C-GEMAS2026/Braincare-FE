'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { severityBadge, statusBadge } from '@/lib/utils/badge';
import type { CaseDTO } from '@/types/case';

const COLS = '1.6fr 1fr 1fr 1fr 1fr 40px';

export function QueueTable({ cases }: { cases: CaseDTO[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-card">
      <div
        className="grid gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
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
            className="grid cursor-pointer items-center gap-4 border-b border-slate-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50"
            style={{ gridTemplateColumns: COLS }}
          >
            <div>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{c.mrn}</div>
            </div>
            <div className="font-mono text-[13px] text-slate-700">{c.examDate}</div>
            <div className="text-[13px] text-slate-700">MRI Otak (T1/T2/FLAIR)</div>
            <div>
              <Badge label={st.label} className={st.className} />
            </div>
            <div>
              <Badge label={sev.label} className={sev.className} />
            </div>
            <div className="text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
