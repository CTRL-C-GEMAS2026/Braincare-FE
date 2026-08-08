'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import clsx from 'clsx';
import { apiUpload } from '@/lib/api/client';
import { Dropzone } from '@/components/upload/Dropzone';
import { UploadFileList } from '@/components/upload/UploadFileList';
import { Button } from '@/components/ui/Button';
import type { UploadFile } from '@/types/upload';
import type { CaseDTO } from '@/types/case';

const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function UploadPage() {
  const [uploadMode, setUploadMode] = useState<'image' | 'dicom'>('image');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [files, setFiles] = useState<UploadFile[]>([]);
  const counterRef = useRef(0);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [mrn, setMrn] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [examDate, setExamDate] = useState(todayIso());

  const patientDataValid = mrn.trim() !== '' && name.trim() !== '' && Number(age) > 0 && examDate !== '';
  const readyToAnalyze =
    uploadMode === 'image' ? imageFile !== null : files.length > 0 && files.every((f) => f.progress >= 100);
  const canSubmit = uploadMode === 'image' && readyToAnalyze && patientDataValid && !starting;

  function handleImageFile(file: File) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      setImageError('Berkas harus berformat PNG atau JPEG.');
      return;
    }
    setImageError(null);
    setImageFile(file);
  }

  function onPickFile() {
    counterRef.current += 1;
    const id = `f${counterRef.current}`;
    const fileName = `studi_mri_${counterRef.current}.dcm`;
    setFiles((prev) => [...prev, { id, name: fileName, progress: 0 }]);

    for (let step = 1; step <= 5; step++) {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: Math.min(100, f.progress + 20) } : f))
        );
      }, step * 220);
    }
  }

  async function onStartAnalysis() {
    if (!canSubmit || !imageFile) return;
    setError(null);
    setStarting(true);
    try {
      const formData = new FormData();
      formData.append('mrn', mrn.trim());
      formData.append('name', name.trim());
      formData.append('age', String(Number(age)));
      formData.append('gender', gender);
      formData.append('examDate', examDate);
      formData.append('image', imageFile);

      const created = await apiUpload<CaseDTO>('/api/cases', formData);
      await mutate('/api/cases');
      router.push(`/viewer/${created.id}`);
    } catch (err) {
      console.error('Gagal memulai analisis:', err);
      setError('Gagal memulai analisis. Periksa kembali data pasien dan coba lagi.');
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
        <div className="mb-1 text-xl font-bold">Unggah Berkas MRI</div>
        <div className="mb-5 text-[13px] text-slate-500">
          Studi akan dianalisis otomatis setelah berkas tervalidasi.
        </div>

        <div className="mb-5 flex gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setUploadMode('image')}
            className={clsx(
              'flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors',
              uploadMode === 'image' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
            )}
          >
            Gambar MRI (PNG/JPG)
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('dicom')}
            className={clsx(
              'flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors',
              uploadMode === 'dicom' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
            )}
          >
            Studi DICOM/NII
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-[13px] font-semibold text-slate-700">Nama Pasien</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap pasien"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.75 py-[11px] text-sm text-slate-900 outline-none transition-colors focus:border-brand-400"
            />
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold text-slate-700">No. MRN</div>
            <input
              value={mrn}
              onChange={(e) => setMrn(e.target.value)}
              placeholder="MRN-000000"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.75 py-[11px] text-sm text-slate-900 outline-none transition-colors focus:border-brand-400"
            />
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold text-slate-700">Umur</div>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              type="number"
              min={0}
              max={150}
              placeholder="Tahun"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.75 py-[11px] text-sm text-slate-900 outline-none transition-colors focus:border-brand-400"
            />
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold text-slate-700">Jenis Kelamin</div>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Laki-laki' | 'Perempuan')}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.75 py-[11px] text-sm text-slate-900 outline-none transition-colors focus:border-brand-400"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div className="col-span-2">
            <div className="mb-1.5 text-[13px] font-semibold text-slate-700">Tanggal Periksa</div>
            <input
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              type="date"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.75 py-[11px] text-sm text-slate-900 outline-none transition-colors focus:border-brand-400"
            />
          </div>
        </div>

        <div className="mb-5.5 mb-[22px] flex flex-wrap gap-2">
          {(uploadMode === 'image' ? ['.png', '.jpg', '.jpeg'] : ['.dcm', '.nii', '.nii.gz', 'Maks. 500MB']).map(
            (t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-2.75 px-[11px] py-1.25 py-[5px] text-[11.5px] font-semibold text-slate-500"
              >
                {t}
              </span>
            )
          )}
        </div>

        {uploadMode === 'image' ? (
          <>
            <Dropzone
              mode="file"
              accept="image/png,image/jpeg"
              title="Seret gambar MRI ke sini, atau klik untuk memilih"
              description="Satu berkas PNG atau JPEG hasil scan MRI (mis. slice axial T1c)."
              onFile={handleImageFile}
            />
            {imageError && <div className="mt-3.5 text-[13px] font-medium text-danger-700">{imageError}</div>}
            {imageFile && (
              <div className="mt-5 flex items-center gap-3.5 rounded-xl border border-slate-200 px-4.5 px-[18px] py-3.5">
                <div className="flex h-9.5 w-9.5 h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8">
                    <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
                    <path d="M15 2v5h5" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{imageFile.name}</div>
                  <div className="mt-0.5 text-[12px] text-success-700">
                    {(imageFile.size / 1024).toFixed(0)} KB · Siap dianalisis
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Ganti
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <Dropzone
              mode="simulate"
              title="Seret berkas ke sini, atau klik untuk memilih"
              description="Data pasien akan divalidasi otomatis (integritas header DICOM, anonimisasi)"
              onPick={onPickFile}
            />
            <UploadFileList files={files} />
            <div className="mt-3.5 text-[13px] font-medium text-warning-700">
              Mode ini belum didukung backend — gunakan mode &quot;Gambar MRI (PNG/JPG)&quot; untuk menjalankan
              analisis AI.
            </div>
          </>
        )}

        {error && <div className="mt-3.5 text-[13px] font-medium text-danger-700">{error}</div>}

        <Button
          onClick={onStartAnalysis}
          disabled={!canSubmit}
          className="mt-5.5 mt-[22px] w-full py-3.5 text-[14.5px]"
        >
          {starting ? 'Memulai…' : uploadMode === 'dicom' ? 'Mode Belum Tersedia' : 'Mulai Analisis AI'}
        </Button>
      </div>
    </div>
  );
}
