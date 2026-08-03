'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/LoadingSpinner';
import { SearchBar } from '@/components/history/SearchBar';
import { SeverityFilterChips } from '@/components/history/SeverityFilterChips';
import { HistoryTable } from '@/components/history/HistoryTable';
import type { CaseDTO, Severity } from '@/types/case';

export default function HistoryPage() {
  const { data: cases } = useSWR<CaseDTO[]>('/api/cases', fetcher);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<Severity | 'semua'>('semua');

  const filtered = useMemo(() => {
    if (!cases) return [];
    const q = search.trim().toLowerCase();
    return cases
      .filter((c) => c.status === 'selesai' || c.status === 'perlu_review')
      .filter((c) => severity === 'semua' || c.severity === severity)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.mrn.toLowerCase().includes(q));
  }, [cases, search, severity]);

  return (
    <div className="max-w-[1200px] px-8 py-7">
      <div className="mb-1 text-xl font-bold">Riwayat Pemeriksaan</div>
      <div className="mb-5 text-[13px] text-slate-500">
        Arsip kasus yang sudah selesai dianalisis, untuk membandingkan dengan kasus baru dan melacak status
        tinjauan Anda.
      </div>

      <div className="mb-3.5 flex gap-3">
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <SeverityFilterChips active={severity} onChange={setSeverity} />

      {!cases ? <Skeleton className="h-64 w-full rounded-2xl" /> : <HistoryTable cases={filtered} />}
    </div>
  );
}
