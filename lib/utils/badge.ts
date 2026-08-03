import type { CaseStatus, ReviewState, Severity } from '@/types/case';

interface BadgeMeta {
  label: string;
  className: string;
}

const SEVERITY_META: Record<Severity, BadgeMeta> = {
  normal: { label: 'Normal', className: 'bg-slate-100 text-slate-500' },
  rendah: { label: 'Risiko Rendah', className: 'bg-success-100 text-success-700' },
  sedang: { label: 'Risiko Sedang', className: 'bg-warning-100 text-warning-700' },
  tinggi: { label: 'Risiko Tinggi', className: 'bg-danger-100 text-danger-700' },
};

const STATUS_META: Record<CaseStatus, BadgeMeta> = {
  menunggu: { label: 'Menunggu Analisis', className: 'bg-brand-50 text-brand-700' },
  proses: { label: 'Dianalisis AI', className: 'bg-info-100 text-info-700' },
  selesai: { label: 'Selesai', className: 'bg-success-100 text-success-700' },
  perlu_review: { label: 'Perlu Perhatian', className: 'bg-orange-100 text-orange-700' },
};

const REVIEW_META: Record<ReviewState, BadgeMeta> = {
  agree: { label: 'Dikonfirmasi', className: 'bg-success-100 text-success-700' },
  disagree: { label: 'Dikoreksi Dokter', className: 'bg-danger-100 text-danger-700' },
  none: { label: 'Belum Ditinjau', className: 'bg-slate-100 text-slate-500' },
};

export function severityBadge(s: Severity): BadgeMeta {
  return SEVERITY_META[s];
}
export function statusBadge(s: CaseStatus): BadgeMeta {
  return STATUS_META[s];
}
export function reviewBadge(r: ReviewState): BadgeMeta {
  return REVIEW_META[r];
}

export const SEVERITY_FILTERS: { key: Severity | 'semua'; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'tinggi', label: 'Risiko Tinggi' },
  { key: 'sedang', label: 'Risiko Sedang' },
  { key: 'rendah', label: 'Risiko Rendah' },
  { key: 'normal', label: 'Normal' },
];
