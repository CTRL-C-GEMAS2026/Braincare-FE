'use client';

import { useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/lib/api/client';
import type { AuditPage } from '@/types/case';

const labels: Record<string, string> = {
  analysis_completed: 'Draf AI tersedia', narrative_edited: 'Narasi disunting',
  report_finalized: 'Laporan disetujui & difinalisasi', review_disagreed: 'Koreksi diminta',
  review_reset: 'Tinjauan dibuka kembali', legacy_import: 'Arsip awal sebelum pembaruan',
};

export function AuditHistory({ caseId, revision }: { caseId: string; revision: number }) {
  const { data, error, size, setSize, mutate, isValidating } = useSWRInfinite<AuditPage>(
    (_index: number, previous: AuditPage | null) => {
      if (previous && previous.nextBeforeRevision === null) return null;
      return `/api/cases/${caseId}/audit?limit=10${previous ? `&beforeRevision=${previous.nextBeforeRevision}` : ''}`;
    }, fetcher,
  );
  useEffect(() => { void mutate().catch(() => {}); }, [revision, mutate]);
  const events = data?.flatMap((page) => page.events) ?? [];
  const more = data && data[data.length - 1].nextBeforeRevision !== null;
  return (
    <details className="mt-5 border-t border-slate-200 pt-4" data-testid="audit-history">
      <summary className="cursor-pointer text-xs font-bold text-slate-700">Riwayat laporan &amp; tinjauan ({events.length}{more ? '+' : ''})</summary>
      {error && <p role="alert" className="mt-2 text-xs text-danger-700">Riwayat gagal dimuat. <button onClick={() => void mutate().catch(() => {})} className="underline">Coba lagi</button></p>}
      {!data && !error && <p className="mt-2 text-xs text-slate-500">Memuat riwayat…</p>}
      {data && !events.length && <p className="mt-2 text-xs text-slate-500">Belum ada riwayat tersimpan.</p>}
      <ol className="mt-3 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="rounded-lg bg-slate-50 p-3 text-[11px]">
            <div className="font-semibold">{labels[event.action] ?? event.action} · revisi {event.revision}</div>
            <div className="mt-1 text-slate-500">{event.actorName} · {new Date(event.occurredAt).toLocaleString('id-ID')}</div>
            {event.note && <p className="mt-2 whitespace-pre-wrap">{event.note}</p>}
            {event.action === 'narrative_edited' && (
              <details className="mt-2">
                <summary className="cursor-pointer text-brand-700">Lihat perubahan narasi</summary>
                <div className="mt-2 font-semibold">Sebelum</div><p className="whitespace-pre-wrap">{event.before?.narrative ?? '—'}</p>
                <div className="mt-2 font-semibold">Sesudah</div><p className="whitespace-pre-wrap">{event.after.narrative}</p>
              </details>
            )}
          </li>
        ))}
      </ol>
      {more && <button disabled={isValidating} onClick={() => void setSize(size + 1).catch(() => {})} className="mt-3 text-xs font-semibold text-brand-700 disabled:opacity-50">{isValidating ? 'Memuat…' : 'Tampilkan riwayat lebih lama'}</button>}
    </details>
  );
}
