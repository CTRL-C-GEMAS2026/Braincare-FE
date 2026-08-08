# Menyesuaikan Integrasi FE dengan Braincare-BE Setelah AI Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyambungkan frontend (`mvp_ppl_gemas`) ke kontrak `Braincare-BE` yang berlaku setelah commit `feat: add ai integration` — upload gambar sungguhan, render citra/mask terautentikasi di viewer, dan penanganan field AI yang bisa kosong.

**Architecture:** Empat perubahan independen-tapi-berurutan: (1) `lib/api/client.ts` mendapat jalur `multipart/form-data` dan fetch blob terautentikasi; (2) `types/case.ts` + `NarrativePanel` menerima kenyataan bahwa `grade`/`location`/`edema`/`narrative` bisa `null`; (3) `MriStage` merender citra & mask asli lewat blob URL; (4) halaman Unggah mendapat toggle dua mode dan benar-benar mengirim file gambar. Tidak ada perubahan di `Braincare-BE`.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript + SWR + Tailwind v4. Tidak ada framework test otomatis di proyek ini (tidak ada Jest/Vitest, tidak ada file `*.test.*`) — verifikasi tiap task memakai `npx tsc --noEmit`, `npm run lint`, dan pengecekan manual lewat `npm run dev` melawan backend live yang sudah dikonfigurasi di `.env.local`.

## Global Constraints

- Backend hanya menerima `image/png` dan `image/jpeg` untuk `POST /api/cases` (`ALLOWED_IMAGE_TYPES` di `Braincare-BE/routers/cases.py`). Tipe lain harus ditolak di FE sebelum request terkirim.
- Semua request API lewat `lib/api/client.ts` dan `NEXT_PUBLIC_API_BASE_URL` — jangan hardcode origin backend di file lain.
- `Braincare-BE` tidak boleh diubah sama sekali dalam plan ini.
- `.env.local` sudah berisi `NEXT_PUBLIC_API_BASE_URL=https://relief-demographic-excessive-relocation.trycloudflare.com` (backend live) — pakai ini untuk verifikasi manual.
- Endpoint `GET /api/cases/{id}/image` dan `/mask` mewajibkan header `Authorization: Bearer <token>` (dependency di level router `cases.py`) — tidak bisa dipakai langsung sebagai `<img src>`.
- Proyek ini tidak punya test runner terpasang; jangan tambahkan satu hanya untuk plan ini (di luar scope spec). Verifikasi otomatis = typecheck + lint.

---

### Task 1: API Client — Multipart Upload & Authenticated Blob Fetch

**Files:**
- Modify: `lib/api/client.ts`

**Interfaces:**
- Consumes: `authHeader()` (sudah ada di file ini), `clearSession` dari `@/lib/auth/session` (sudah diimport).
- Produces: `apiUpload<T>(path: string, formData: FormData): Promise<T>` — dipakai Task 4 untuk kirim `POST /api/cases`. `fetchBlob(path: string): Promise<Blob | null>` — dipakai Task 3 untuk ambil citra/mask; mengembalikan `null` (bukan throw) kalau respons gagal (401 atau 404), supaya pemanggil bisa diam-diam tidak menampilkan layer tersebut.

- [ ] **Step 1: Tambahkan `apiUpload` dan `fetchBlob` ke `lib/api/client.ts`**

Tambahkan di akhir file (setelah `apiPatch`):

```ts
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeader() },
    body: formData,
  });
  return handle<T>(res);
}

export async function fetchBlob(path: string): Promise<Blob | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { ...authHeader() } });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return null;
  }
  return res.blob();
}
```

Catatan: jangan set header `Content-Type` di `apiUpload` — browser mengisinya otomatis dengan boundary multipart yang benar saat `body` adalah `FormData`. Menyetelnya manual akan merusak boundary dan membuat backend gagal parse.

- [ ] **Step 2: Verifikasi typecheck & lint**

Run: `npx tsc --noEmit`
Expected: tidak ada error baru dari `lib/api/client.ts` (fungsi ini belum dipakai di mana pun, jadi harus compile berdiri sendiri).

Run: `npm run lint`
Expected: bersih, tidak ada warning/error baru.

- [ ] **Step 3: Commit**

```bash
git add lib/api/client.ts
git commit -m "feat: add multipart upload and authenticated blob fetch to API client"
```

---

### Task 2: Case Type — Nullable AI Fields + NarrativePanel Conditional Rendering

**Files:**
- Modify: `types/case.ts`
- Modify: `components/viewer/NarrativePanel.tsx`

**Interfaces:**
- Consumes: tidak ada dependensi baru dari Task 1.
- Produces: `Case.grade`, `Case.location`, `Case.edema`, `Case.narrative` bertipe `string | null`. `Case.imageUrl: string | null`, `Case.maskUrl: string | null` — dipakai Task 3 di `MriStage`. `NarrativePanel` tidak lagi mengasumsikan field-field itu selalu terisi.

- [ ] **Step 1: Ubah `types/case.ts`**

Ganti isi `interface Case` (baris 5–26) menjadi:

```ts
export interface Case {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: 'Laki-laki' | 'Perempuan';
  examDate: string;
  status: CaseStatus;
  severity: Severity;
  tumorType: string;
  grade: string | null;
  confidence: number;
  volume: number;
  location: string | null;
  edema: string | null;
  narrative: string | null;
  review: ReviewState;
  reviewNote?: string;
  reviewedAt?: string;
  /** ISO 8601; when set and in the future, GET responses report isAnalyzing: true */
  analyzingUntil?: string | null;
  /** null kalau berkas belum diunggah / belum diproses oleh backend */
  imageUrl: string | null;
  maskUrl: string | null;
}
```

`tumorType` dan `confidence` tetap non-null — backend selalu mengisi keduanya begitu inferensi AI selesai (lihat `Braincare-BE/routers/cases.py::_run_inference_and_update`), berbeda dari `grade`/`location`/`edema`/`narrative` yang memang tidak pernah diisi oleh pipeline AI saat ini.

- [ ] **Step 2: Ubah `components/viewer/NarrativePanel.tsx` agar merender kondisional**

Ganti seluruh isi file menjadi:

```tsx
import type { CaseDTO } from '@/types/case';

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-slate-200 px-3.5 py-3">
      <div className="text-[11px] font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-[13.5px] font-semibold">{value}</div>
    </div>
  );
}

export function NarrativePanel({ activeCase }: { activeCase: CaseDTO }) {
  const infoCards = (
    [
      { label: 'Lokasi', value: activeCase.location },
      { label: 'Grading (WHO)', value: activeCase.grade },
      { label: 'Edema / Mass Effect', value: activeCase.edema },
    ] as const
  ).filter((c): c is { label: string; value: string } => c.value !== null);

  return (
    <div className="flex-1 overflow-auto px-6 py-5.5 py-[22px]">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Narasi Klinis Otomatis (AI)
      </div>
      <div className="mb-0.5 text-base font-bold">{activeCase.tumorType}</div>
      <div className="mb-4 text-[13px] text-slate-500">
        Estimasi kepercayaan model:{' '}
        <span className="font-mono font-semibold text-slate-700">{activeCase.confidence}%</span>
      </div>

      {activeCase.narrative && (
        <div className="mb-4.5 mb-[18px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13.5px] leading-relaxed text-slate-800">
          {activeCase.narrative}
        </div>
      )}

      {infoCards.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          {infoCards.map((c) => (
            <InfoCard key={c.label} label={c.label} value={c.value} />
          ))}
        </div>
      )}

      <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Keterangan Peta XAI
      </div>
      <div className="text-[12.5px] leading-relaxed text-slate-500">
        Grad-CAM menyorot area citra yang paling memengaruhi keputusan model, bukan batas anatomis pasti. Gunakan
        bersama mask segmentasi untuk verifikasi klinis.
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Cari pemakaian lain field yang berubah**

Run: `grep -rn "\.grade\b\|\.location\b\|\.edema\b\|\.narrative\b" --include="*.tsx" --include="*.ts" app components lib`
Expected: hanya muncul di `components/viewer/NarrativePanel.tsx` (yang baru saja diubah) dan kemungkinan `lastLogin.location` di `components/profile/SecurityCard.tsx` (field berbeda, milik `UserProfile`, bukan `Case` — abaikan kalau muncul).

- [ ] **Step 4: Verifikasi typecheck & lint**

Run: `npx tsc --noEmit`
Expected: tidak ada error.

Run: `npm run lint`
Expected: bersih.

- [ ] **Step 5: Commit**

```bash
git add types/case.ts components/viewer/NarrativePanel.tsx
git commit -m "fix: treat AI narrative fields (grade/location/edema/narrative) as nullable"
```

---

### Task 3: MriStage — Render Real Image & Mask via Authenticated Blob Fetch

**Files:**
- Modify: `components/viewer/MriStage.tsx`
- Modify: `app/(app)/viewer/[caseId]/page.tsx:60`

**Interfaces:**
- Consumes: `fetchBlob` dari `@/lib/api/client` (Task 1), `Case.imageUrl` / `Case.maskUrl` dari `@/types/case` (Task 2).
- Produces: `MriStage` sekarang butuh prop `activeCase: CaseDTO` tambahan di atas `zoom`/`slice`/`layerSeg`/`layerGradcam` yang sudah ada.

- [ ] **Step 1: Ganti isi `components/viewer/MriStage.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchBlob } from '@/lib/api/client';
import type { CaseDTO } from '@/types/case';

function useAuthenticatedImage(url: string | null): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    if (!url) {
      setSrc(null);
      return;
    }

    fetchBlob(url).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return src;
}

export function MriStage({
  activeCase,
  zoom,
  slice,
  layerSeg,
  layerGradcam,
}: {
  activeCase: CaseDTO;
  zoom: number;
  slice: number;
  layerSeg: boolean;
  layerGradcam: boolean;
}) {
  const imageSrc = useAuthenticatedImage(activeCase.imageUrl);
  const maskSrc = useAuthenticatedImage(activeCase.maskUrl);

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-theater-950">
      {imageSrc ? (
        <div
          className="relative transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="Citra MRI"
            className="max-h-[70vh] max-w-full select-none"
            draggable={false}
          />
          {maskSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={maskSrc}
              alt="Hasil segmentasi AI"
              className="absolute inset-0 h-full w-full select-none transition-opacity duration-300"
              style={{ opacity: layerSeg ? 0.85 : 0 }}
              draggable={false}
            />
          )}

          {/* Overlay Grad-CAM dekoratif -- backend belum expose peta XAI terpisah dari mask */}
          <div
            className="pointer-events-none absolute left-[52%] top-[30%] h-[150px] w-[170px] rounded-full transition-all duration-300"
            style={{
              transform: 'translate(-50%,-50%)',
              opacity: layerGradcam ? 0.8 : 0,
              background:
                'radial-gradient(circle at 50% 45%, #FDE047 0%, #F97316 35%, #DC2626 58%, transparent 75%)',
              filter: 'blur(10px)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
      ) : (
        <div className="text-[13px] text-slate-500">Citra belum tersedia untuk kasus ini.</div>
      )}

      <div className="absolute bottom-4 left-5 font-mono text-[11px] text-slate-500">
        Slice {slice} / 156 · Axial T1c
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update pemanggil di `app/(app)/viewer/[caseId]/page.tsx`**

Ganti baris 60:

```tsx
              <MriStage zoom={zoom} slice={slice} layerSeg={layerSeg} layerGradcam={layerGradcam} />
```

menjadi:

```tsx
              <MriStage
                activeCase={activeCase}
                zoom={zoom}
                slice={slice}
                layerSeg={layerSeg}
                layerGradcam={layerGradcam}
              />
```

- [ ] **Step 3: Verifikasi typecheck & lint**

Run: `npx tsc --noEmit`
Expected: tidak ada error.

Run: `npm run lint`
Expected: bersih.

- [ ] **Step 4: Commit**

```bash
git add components/viewer/MriStage.tsx "app/(app)/viewer/[caseId]/page.tsx"
git commit -m "feat: render real MRI image and segmentation mask via authenticated blob fetch"
```

(Verifikasi manual end-to-end untuk task ini digabung ke pengecekan manual Task 4, karena butuh case sungguhan hasil upload untuk punya `imageUrl`/`maskUrl` yang valid.)

---

### Task 4: Upload Page — Real Image Upload with Dual Mode Toggle

**Files:**
- Modify: `components/upload/Dropzone.tsx`
- Modify: `app/(app)/upload/page.tsx`

**Interfaces:**
- Consumes: `apiUpload` dari `@/lib/api/client` (Task 1). `CaseDTO` dari `@/types/case` (Task 2, sudah termasuk `imageUrl`/`maskUrl` yang akan dipakai di viewer lewat Task 3).
- Produces: tidak ada interface baru untuk task lain — ini titik akhir dari alur (dikonsumsi manusia lewat browser).

- [ ] **Step 1: Ganti isi `components/upload/Dropzone.tsx` agar mendukung file asli & mode simulasi**

```tsx
'use client';

import { useRef, useState, type DragEvent } from 'react';
import clsx from 'clsx';

type DropzoneProps =
  | {
      mode: 'file';
      accept: string;
      title: string;
      description: string;
      onFile: (file: File) => void;
    }
  | {
      mode: 'simulate';
      title: string;
      description: string;
      onPick: () => void;
    };

export function Dropzone(props: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleClick() {
    if (props.mode === 'file') {
      inputRef.current?.click();
    } else {
      props.onPick();
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (props.mode !== 'file') return;
    const file = e.dataTransfer.files?.[0];
    if (file) props.onFile(file);
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={(e) => {
        if (props.mode !== 'file') return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={clsx(
        'cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
        dragOver ? 'border-brand-500 bg-brand-50/60' : 'border-brand-300 bg-slate-50 hover:bg-brand-50/40'
      )}
    >
      {props.mode === 'file' && (
        <input
          ref={inputRef}
          type="file"
          accept={props.accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) props.onFile(file);
            e.target.value = '';
          }}
        />
      )}
      <div className="mx-auto mb-4 flex h-13 w-13 h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand-100">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="1.8">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
        </svg>
      </div>
      <div className="text-[15px] font-semibold text-slate-900">{props.title}</div>
      <div className="mt-1.5 text-[13px] text-slate-500">{props.description}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verifikasi typecheck sebagian**

Run: `npx tsc --noEmit`
Expected: error muncul di `app/(app)/upload/page.tsx` karena masih memanggil `<Dropzone onPick={onPickFile} />` dengan API lama — ini yang akan diperbaiki di Step 3. Konfirmasi errornya memang dari file itu, bukan dari `Dropzone.tsx` sendiri.

- [ ] **Step 3: Ganti isi `app/(app)/upload/page.tsx`**

```tsx
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
```

- [ ] **Step 4: Verifikasi typecheck & lint**

Run: `npx tsc --noEmit`
Expected: tidak ada error di seluruh proyek.

Run: `npm run lint`
Expected: bersih.

- [ ] **Step 5: Verifikasi manual end-to-end lewat browser**

Run: `npm run dev`, buka `http://localhost:3000`.

1. Kalau belum punya akun, buka tab "Daftar" di `/login`, isi form registrasi (nama, email baru, SIP, RS, password ≥ 8 karakter), submit, lalu login dengan akun tsb.
2. Dari dashboard, klik "Unggah Pemeriksaan Baru".
3. Pastikan mode default adalah "Gambar MRI (PNG/JPG)". Isi data pasien (nama, MRN, umur, jenis kelamin, tanggal periksa).
4. Klik dropzone, pilih satu berkas `.png` atau `.jpg` (gambar apa saja, mis. screenshot MRI dari internet atau file test manapun berformat PNG/JPEG) — pastikan nama & ukuran file muncul di kartu "Siap dianalisis".
5. Klik "Mulai Analisis AI". Pastikan redirect ke `/viewer/<id>` dan menampilkan `AnalyzingState` (spinner) sampai `isAnalyzing` menjadi `false` lewat polling SWR yang sudah ada.
6. Setelah analisis selesai: pastikan citra MRI yang dipilih tampil sungguhan di `MriStage` (bukan lagi gradasi CSS bulat), dan toggle "Seg" di `ViewerToolbar` menampilkan/menyembunyikan overlay mask.
7. Di `NarrativePanel`, pastikan `tumorType` & `confidence` tampil, dan kartu `Lokasi`/`Grading`/`Edema` serta blok narasi **tidak muncul** (karena backend belum mengisinya) — bukan tampil kosong/`null` sebagai teks.
8. Klik "Setuju" di panel Tinjauan Dokter, pastikan berhasil tersimpan (regression check jalur review yang sudah ada).
9. Kembali ke halaman Unggah, ganti ke mode "Studi DICOM/NII", pastikan tombol submit nonaktif dengan pesan "Mode ini belum didukung backend...".
10. Coba pilih berkas bertipe selain PNG/JPEG (mis. `.txt` lewat picker kalau memungkinkan, atau ubah sementara `accept` untuk tes) di mode gambar — pastikan pesan error "Berkas harus berformat PNG atau JPEG." muncul dan tombol submit tetap nonaktif.

Kalau ada langkah yang gagal, catat perilaku sebenarnya vs yang diharapkan sebelum lanjut commit.

- [ ] **Step 6: Commit**

```bash
git add components/upload/Dropzone.tsx "app/(app)/upload/page.tsx"
git commit -m "feat: send real image uploads with dual-mode toggle on the upload page"
```

---

## Ringkasan Urutan Eksekusi

1. Task 1 (API client) — fondasi, tidak bergantung pada task lain.
2. Task 2 (types + NarrativePanel) — tidak bergantung pada Task 1, bisa paralel.
3. Task 3 (MriStage) — butuh Task 1 (`fetchBlob`) dan Task 2 (`imageUrl`/`maskUrl` di tipe).
4. Task 4 (halaman Unggah) — butuh Task 1 (`apiUpload`) dan Task 3 sudah selesai duluan supaya verifikasi manual end-to-end di Step 5 bisa menampilkan hasilnya di viewer.
