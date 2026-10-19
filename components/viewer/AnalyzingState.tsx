'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { CaseDTO } from '@/types/case';

/** Tahap ditentukan dari field yang benar-benar sudah terisi di case (hasil polling
 * GET /cases/:id, lihat page.tsx), bukan timer buatan -- backend commit bertahap per
 * tahap (segmentasi -> XAI -> narasi), lihat _run_inference_and_update di routers/cases.py. */
function currentStageLabel(activeCase: CaseDTO): string {
  if (!activeCase.maskUrl) return 'Menjalankan segmentasi tumor…';
  if (!activeCase.gradcamUrl && !activeCase.attentionUrl) return 'Menghitung peta Grad-CAM (XAI)…';
  if (!activeCase.narrative) return 'Menyusun narasi klinis…';
  return 'Menyelesaikan analisis…';
}

export function AnalyzingState({ activeCase, narrative = '' }: { activeCase: CaseDTO; narrative?: string }) {
  const label = narrative ? 'Menyusun narasi klinis…' : currentStageLabel(activeCase);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-8">
      <LoadingSpinner label="AI sedang menganalisis studi MRI…" />
      <div key={label} className="animate-bc-fade-in text-[13px] text-slate-500">
        {label}
      </div>
      {narrative && (
        <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-slate-50 p-5" aria-busy="true">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Narasi sementara · sedang disusun
          </div>
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate-800">
            {narrative}
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brand-600 align-middle" aria-hidden="true" />
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Teks dapat berubah setelah pemeriksaan akhir. Tunggu analisis selesai sebelum meninjau hasil.
          </p>
        </div>
      )}
    </div>
  );
}
