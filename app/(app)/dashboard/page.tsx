'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/LoadingSpinner';
import { StatCardsRow } from '@/components/dashboard/StatCardsRow';
import { QueueTable } from '@/components/dashboard/QueueTable';
import type { CaseDTO } from '@/types/case';

export default function DashboardPage() {
  const router = useRouter();
  const { data: cases } = useSWR<CaseDTO[]>('/api/cases', fetcher);

  return (
    <div className="max-w-[1200px] px-8 py-7">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="text-xl font-bold">Antrian Pemeriksaan</div>
          <div className="mt-1 text-[13px] text-slate-500">
            Kasus MRI yang menunggu, sedang dianalisis, atau perlu tinjauan Anda.
          </div>
        </div>
        <Button onClick={() => router.push('/upload')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Unggah Pemeriksaan Baru
        </Button>
      </div>

      {!cases ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <StatCardsRow cases={cases} />
          <QueueTable cases={cases} />
        </>
      )}
    </div>
  );
}
