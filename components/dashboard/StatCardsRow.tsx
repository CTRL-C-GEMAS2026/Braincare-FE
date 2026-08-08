import { StatCard } from '@/components/ui/StatCard';
import type { CaseDTO } from '@/types/case';

function Icon({ path, color }: { path: string; color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d={path} />
    </svg>
  );
}

export function StatCardsRow({ cases }: { cases: CaseDTO[] }) {
  const total = cases.length;
  const waiting = cases.filter((c) => c.status === 'menunggu' || c.status === 'proses').length;
  const attention = cases.filter((c) => c.severity === 'tinggi' || c.status === 'perlu_review').length;
  const done = cases.filter((c) => c.status === 'selesai').length;

  return (
    <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-card md:flex">
      <StatCard
        label="Total Pemeriksaan"
        value={total}
        iconBg="bg-slate-100"
        icon={<Icon path="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z M15 2v5h5" color="#334155" />}
      />
      <StatCard
        label="Menunggu / Diproses"
        value={waiting}
        iconBg="bg-brand-50"
        icon={<Icon path="M12 8v4l3 3M4 12a8 8 0 108-8" color="#1D4ED8" />}
      />
      <StatCard
        label="Perlu Perhatian"
        value={attention}
        valueClassName="text-danger-700"
        iconBg="bg-danger-50"
        icon={
          <Icon
            path="M12 9v4m0 4h.01M10.3 3.9L2.4 18a1.5 1.5 0 001.3 2.2h16.6a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-2.6 0z"
            color="#B91C1C"
          />
        }
      />
      <StatCard
        label="Selesai Ditinjau"
        value={done}
        iconBg="bg-success-50"
        icon={<Icon path="M20 6L9 17l-5-5" color="#15803D" />}
      />
    </div>
  );
}
