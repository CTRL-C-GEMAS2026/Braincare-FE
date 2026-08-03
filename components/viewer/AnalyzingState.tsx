'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const STAGES = [
  'Memuat volumetrik DICOM…',
  'Menjalankan segmentasi tumor…',
  'Menghitung peta Grad-CAM (XAI)…',
  'Menyusun narasi klinis…',
];

export function AnalyzingState() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <LoadingSpinner label="AI sedang menganalisis studi MRI…" />
      <div key={stage} className="animate-bc-fade-in text-[13px] text-slate-500">
        {STAGES[stage]}
      </div>
    </div>
  );
}
