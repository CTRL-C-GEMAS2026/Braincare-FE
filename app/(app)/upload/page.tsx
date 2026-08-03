'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import { apiPost } from '@/lib/api/client';
import { Dropzone } from '@/components/upload/Dropzone';
import { UploadFileList } from '@/components/upload/UploadFileList';
import { Button } from '@/components/ui/Button';
import type { UploadFile } from '@/types/upload';
import type { CaseDTO } from '@/types/case';

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [starting, setStarting] = useState(false);
  const counterRef = useRef(0);
  const router = useRouter();

  const allDone = files.length > 0 && files.every((f) => f.progress >= 100);

  function onPickFile() {
    counterRef.current += 1;
    const id = `f${counterRef.current}`;
    const name = `studi_mri_${counterRef.current}.dcm`;
    setFiles((prev) => [...prev, { id, name, progress: 0 }]);

    for (let step = 1; step <= 5; step++) {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: Math.min(100, f.progress + 20) } : f))
        );
      }, step * 220);
    }
  }

  async function onStartAnalysis() {
    if (!allDone || starting) return;
    setStarting(true);
    try {
      const created = await apiPost<CaseDTO>('/api/cases');
      await mutate('/api/cases');
      router.push(`/viewer/${created.id}`);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center px-8 py-8">
      <div className="w-full max-w-[600px] rounded-2xl border border-slate-200 bg-white p-10 shadow-card">
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-6.5 w-6.5 h-[26px] w-[26px] items-center justify-center rounded-lg bg-brand-50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
            Langkah 1 dari 2: Unggah
          </div>
        </div>
        <div className="mb-1 text-xl font-bold">Unggah Berkas DICOM/MRI</div>
        <div className="mb-5 text-[13px] text-slate-500">
          Studi akan dianalisis otomatis setelah semua berkas tervalidasi.
        </div>

        <div className="mb-5.5 mb-[22px] flex flex-wrap gap-2">
          {['.dcm', '.nii', '.nii.gz', 'Maks. 500MB'].map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2.75 px-[11px] py-1.25 py-[5px] text-[11.5px] font-semibold text-slate-500">
              {t}
            </span>
          ))}
        </div>

        <Dropzone onPick={onPickFile} />
        <UploadFileList files={files} />

        <Button
          onClick={onStartAnalysis}
          disabled={!allDone || starting}
          className="mt-5.5 mt-[22px] w-full py-3.5 text-[14.5px]"
        >
          {starting ? 'Memulai…' : 'Mulai Analisis AI'}
        </Button>
      </div>
    </div>
  );
}
