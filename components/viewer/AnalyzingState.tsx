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

export function AnalyzingState({ activeCase }: { activeCase: CaseDTO }) {
  const label = currentStageLabel(activeCase);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <LoadingSpinner label="AI sedang menganalisis studi MRI…" />
      <div key={label} className="animate-bc-fade-in text-[13px] text-slate-500">
        {label}
      </div>
    </div>
  );
}
