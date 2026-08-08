# Integrasi VLM (Narasi Klinis) & XAI (Grad-CAM/Attention) di FE — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyambungkan viewer FE (`mvp_ppl_gemas`) ke narasi klinis dan kedua peta XAI (Grad-CAM, Attention Weight Map) yang sekarang benar-benar dihasilkan `Braincare-BE` (commit `feat: integrate VLM Call and XAI`), menggantikan overlay Grad-CAM dekoratif lama.

**Architecture:** Lima perubahan berurutan dan saling bergantung: (1) `types/case.ts` mendapat field `gradcamUrl`/`attentionUrl` dan tipe `XaiLayer` bersama; (2) `ViewerToolbar` merender dua chip XAI saling-eksklusif dari data `activeCase`, bukan boolean tunggal; (3) `MriStage` fetch & render kedua peta XAI asli sebagai blob terautentikasi, overlay dekoratif lama dihapus total; (4) `NarrativePanel` menampilkan keterangan XAI yang menyesuaikan peta mana yang sedang aktif; (5) halaman viewer mengganti state `layerGradcam: boolean` dengan `xaiLayer: XaiLayer` dan menyambungkan seluruh props baru. Tidak ada perubahan di `Braincare-BE`.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript + SWR + Tailwind v4. Tidak ada framework test otomatis di proyek ini — verifikasi tiap task memakai `npx tsc --noEmit`, `npm run lint`, dan pengecekan manual lewat `npm run dev` melawan backend live yang sudah dikonfigurasi di `.env.local`.

## Global Constraints

- `gradcamUrl`/`attentionUrl` bisa `null` (peta belum/tidak tersedia untuk kasus itu) — setiap tempat yang memakainya harus menangani `null` tanpa error, mengikuti pola `imageUrl`/`maskUrl` yang sudah ada.
- Endpoint `GET /api/cases/{id}/xai/gradcam` dan `/xai/attention` mewajibkan header `Authorization: Bearer <token>` (sama seperti `/image` dan `/mask`) — harus lewat `fetchBlob` di `lib/api/client.ts`, tidak boleh dipakai langsung sebagai `<img src>`.
- Grad-CAM dan Attention Weight Map saling eksklusif di UI (radio-button behavior): menyalakan salah satu mematikan yang lain. "Segmentasi Tumor" tetap independen.
- Chip toolbar untuk tiap peta XAI hanya dirender kalau field URL-nya di `activeCase` tidak `null`.
- `Braincare-BE` tidak boleh diubah sama sekali dalam plan ini.
- Field `grade`/`location`/`edema` **tidak** disentuh — VLM saat ini hanya mengisi `narrative`, backend belum mengisi field terstruktur itu.
- Proyek ini tidak punya test runner terpasang; jangan tambahkan satu hanya untuk plan ini. Verifikasi otomatis = typecheck + lint.

---

### Task 1: Case Types — Field XAI & Tipe `XaiLayer`

**Files:**
- Modify: `types/case.ts`

**Interfaces:**
- Consumes: tidak ada dependensi baru.
- Produces: `Case.gradcamUrl: string | null`, `Case.attentionUrl: string | null` — dipakai Task 2, 3, 4 lewat `CaseDTO`. `export type XaiLayer = 'none' | 'gradcam' | 'attention'` — dipakai Task 2, 3, 4, 5.

- [ ] **Step 1: Tambahkan `XaiLayer` dan field XAI ke `types/case.ts`**

Ganti seluruh isi file menjadi:

```ts
export type Severity = 'normal' | 'rendah' | 'sedang' | 'tinggi';
export type CaseStatus = 'menunggu' | 'proses' | 'selesai' | 'perlu_review';
export type ReviewState = 'agree' | 'disagree' | 'none';

/** Peta XAI yang sedang ditampilkan di viewer -- saling eksklusif, lihat MriStage/ViewerToolbar. */
export type XaiLayer = 'none' | 'gradcam' | 'attention';

export interface Case {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: 'Laki-laki' | 'Perempuan';
  examDate: string;
  status: CaseStatus;
  severity: Severity;
  tumorType: string | null;
  grade: string | null;
  confidence: number | null;
  volume: number | null;
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
  /** null kalau peta XAI itu belum/tidak tersedia untuk kasus ini (mis. inferensi XAI gagal) */
  gradcamUrl: string | null;
  attentionUrl: string | null;
}

/** Case as returned by the API: raw enum fields plus the computed analyzing flag. */
export interface CaseDTO extends Case {
  isAnalyzing: boolean;
}
```

- [ ] **Step 2: Verifikasi typecheck & lint**

Run: `npx tsc --noEmit`
Expected: error muncul di file-file yang masih memakai props/field lama (`ViewerToolbar`, `MriStage`, `NarrativePanel`, halaman viewer) — ini diharapkan, akan hilang setelah Task 2-5. Pastikan tidak ada error yang berasal dari `types/case.ts` sendiri.

- [ ] **Step 3: Commit**

```bash
git add types/case.ts
git commit -m "feat: add gradcamUrl/attentionUrl and XaiLayer type to Case"
```

---

### Task 2: ViewerToolbar — Dua Chip XAI Saling Eksklusif

**Files:**
- Modify: `components/viewer/ViewerToolbar.tsx`

**Interfaces:**
- Consumes: `CaseDTO`, `XaiLayer` dari `@/types/case` (Task 1).
- Produces: `ViewerToolbar` dengan props baru `activeCase: CaseDTO`, `xaiLayer: XaiLayer`, `onSelectXai: (layer: 'gradcam' | 'attention') => void` (menggantikan `layerGradcam`, `onToggleGradcam`, `showGradcam`) — dipakai Task 5 di halaman viewer.

- [ ] **Step 1: Ganti seluruh isi `components/viewer/ViewerToolbar.tsx`**

```tsx
import clsx from 'clsx';
import type { CaseDTO, XaiLayer } from '@/types/case';

function Chip({
  on,
  dotColor,
  label,
  onClick,
}: {
  on: boolean;
  dotColor: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 rounded-[9px] border px-3.5 py-2 text-[12.5px] font-semibold transition-colors',
        on ? 'border-brand-600 bg-brand-600/20 text-brand-300' : 'border-theater-border bg-theater-800 text-slate-400'
      )}
    >
      <span
        className="inline-block h-2 w-2 rounded-full transition-colors"
        style={{ background: on ? dotColor : '#4B5563' }}
      />
      {label}
    </button>
  );
}

export function ViewerToolbar({
  activeCase,
  layerSeg,
  xaiLayer,
  onToggleSeg,
  onSelectXai,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  activeCase: CaseDTO;
  layerSeg: boolean;
  xaiLayer: XaiLayer;
  onToggleSeg: () => void;
  onSelectXai: (layer: 'gradcam' | 'attention') => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between bg-theater-900 px-5 py-3">
      <div className="flex gap-2.5">
        <Chip on={layerSeg} dotColor="#3B82F6" label="Segmentasi Tumor" onClick={onToggleSeg} />
        {activeCase.gradcamUrl !== null && (
          <Chip
            on={xaiLayer === 'gradcam'}
            dotColor="#F97316"
            label="Grad-CAM (XAI)"
            onClick={() => onSelectXai('gradcam')}
          />
        )}
        {activeCase.attentionUrl !== null && (
          <Chip
            on={xaiLayer === 'attention'}
            dotColor="#A855F7"
            label="Attention Weight Map"
            onClick={() => onSelectXai('attention')}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="h-7.5 w-7.5 h-[30px] w-[30px] rounded-lg border border-theater-border bg-theater-800 text-lg text-white"
        >
          −
        </button>
        <div className="w-11 text-center font-mono text-xs text-slate-300">{Math.round(zoom * 100)}%</div>
        <button
          onClick={onZoomIn}
          className="h-7.5 w-7.5 h-[30px] w-[30px] rounded-lg border border-theater-border bg-theater-800 text-lg text-white"
        >
          +
        </button>
        <button
          onClick={onZoomReset}
          className="ml-1.5 h-7.5 h-[30px] rounded-lg border border-theater-border bg-theater-800 px-3 text-xs text-slate-400"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verifikasi typecheck & lint**

Run: `npx tsc --noEmit`
Expected: error yang tersisa hanya dari pemanggil `ViewerToolbar` di halaman viewer (belum diupdate sampai Task 5) dan dari `MriStage`/`NarrativePanel` (Task 3, 4) — tidak ada error baru yang berasal dari `ViewerToolbar.tsx` sendiri.

Run: `npm run lint`
Expected: tidak ada warning/error baru dari `ViewerToolbar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/viewer/ViewerToolbar.tsx
git commit -m "feat: make Grad-CAM and Attention Weight Map mutually exclusive toolbar chips"
```

---

### Task 3: MriStage — Render Grad-CAM & Attention Weight Map Asli

**Files:**
- Modify: `components/viewer/MriStage.tsx`

**Interfaces:**
- Consumes: `XaiLayer` dari `@/types/case` (Task 1). `fetchBlob` dari `@/lib/api/client` (sudah ada).
- Produces: `MriStage` dengan props `{ activeCase, zoom, slice, layerSeg, xaiLayer }` (menggantikan `layerGradcam`) — dipakai Task 5.

- [ ] **Step 1: Ganti seluruh isi `components/viewer/MriStage.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchBlob } from '@/lib/api/client';
import type { CaseDTO, XaiLayer } from '@/types/case';

function useAuthenticatedImage(url: string | null): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    // Reset on every url change so a stale image from the previous case never lingers on screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(null);

    if (!url) return;

    fetchBlob(url)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
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
  xaiLayer,
}: {
  activeCase: CaseDTO;
  zoom: number;
  slice: number;
  layerSeg: boolean;
  xaiLayer: XaiLayer;
}) {
  const imageSrc = useAuthenticatedImage(activeCase.imageUrl);
  const maskSrc = useAuthenticatedImage(activeCase.maskUrl);
  const gradcamSrc = useAuthenticatedImage(activeCase.gradcamUrl);
  const attentionSrc = useAuthenticatedImage(activeCase.attentionUrl);

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
          {gradcamSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gradcamSrc}
              alt="Peta Grad-CAM"
              className="absolute inset-0 h-full w-full select-none transition-opacity duration-300"
              style={{ opacity: xaiLayer === 'gradcam' ? 0.85 : 0 }}
              draggable={false}
            />
          )}
          {attentionSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attentionSrc}
              alt="Peta Attention Weight"
              className="absolute inset-0 h-full w-full select-none transition-opacity duration-300"
              style={{ opacity: xaiLayer === 'attention' ? 0.85 : 0 }}
              draggable={false}
            />
          )}
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

Catatan penting: `gradcamSrc`/`attentionSrc` di-fetch lewat `useAuthenticatedImage` sama seperti `maskSrc` -- keduanya tetap ter-mount begitu tersedia, ditoggle lewat `opacity` (bukan mount/unmount kondisional) supaya perpindahan `xaiLayer` antara `'gradcam'`/`'attention'` terasa sebagai crossfade halus, bukan flicker.

- [ ] **Step 2: Verifikasi typecheck & lint**

Run: `npx tsc --noEmit`
Expected: error yang tersisa hanya dari pemanggil `MriStage` di halaman viewer (Task 5 belum jalan) -- tidak ada error dari `MriStage.tsx` sendiri.

Run: `npm run lint`
Expected: bersih dari `MriStage.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/viewer/MriStage.tsx
git commit -m "feat: render real Grad-CAM and Attention Weight Map via authenticated blob fetch"
```

---

### Task 4: NarrativePanel — Keterangan XAI Dinamis

**Files:**
- Modify: `components/viewer/NarrativePanel.tsx`

**Interfaces:**
- Consumes: `XaiLayer` dari `@/types/case` (Task 1).
- Produces: `NarrativePanel` dengan props `{ activeCase, xaiLayer }` (menambah `xaiLayer`) -- dipakai Task 5.

- [ ] **Step 1: Ganti seluruh isi `components/viewer/NarrativePanel.tsx`**

```tsx
import type { CaseDTO, XaiLayer } from '@/types/case';

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-slate-200 px-3.5 py-3">
      <div className="text-[11px] font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-[13.5px] font-semibold">{value}</div>
    </div>
  );
}

export function NarrativePanel({ activeCase, xaiLayer }: { activeCase: CaseDTO; xaiLayer: XaiLayer }) {
  const hasXai = activeCase.gradcamUrl !== null || activeCase.attentionUrl !== null;
  const effectiveXai: 'gradcam' | 'attention' =
    xaiLayer !== 'none' ? xaiLayer : activeCase.gradcamUrl !== null ? 'gradcam' : 'attention';

  const infoCards = [
    { label: 'Lokasi', value: activeCase.location },
    { label: 'Grading (WHO)', value: activeCase.grade },
    { label: 'Edema / Mass Effect', value: activeCase.edema },
  ].filter((c): c is { label: string; value: string } => c.value !== null);

  return (
    <div className="flex-1 overflow-auto px-6 py-5.5 py-[22px]">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Narasi Klinis Otomatis (AI)
      </div>

      {activeCase.tumorType === null ? (
        <div className="mb-4 text-[13px] font-medium text-danger-700">
          Analisis AI gagal atau belum tersedia untuk kasus ini. Hubungi tim teknis atau unggah ulang studi.
        </div>
      ) : (
        <>
          <div className="mb-0.5 text-base font-bold">{activeCase.tumorType}</div>
          <div className="mb-4 text-[13px] text-slate-500">
            Estimasi kepercayaan model:{' '}
            <span className="font-mono font-semibold text-slate-700">{activeCase.confidence}%</span>
          </div>
        </>
      )}

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

      {hasXai && (
        <>
          <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Keterangan Peta XAI
          </div>
          <div className="text-[12.5px] leading-relaxed text-slate-500">
            {effectiveXai === 'attention'
              ? 'Attention Weight Map menunjukkan area yang menjadi fokus perhatian model selama proses analisis, sebagai fitur bawaan arsitektur AttentionUNet — bukan indikasi lokasi tumor secara langsung. Gunakan bersama Grad-CAM dan mask segmentasi untuk interpretasi yang lebih utuh.'
              : 'Grad-CAM menyorot area citra yang paling memengaruhi keputusan model, bukan batas anatomis pasti. Gunakan bersama mask segmentasi untuk verifikasi klinis.'}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verifikasi typecheck & lint**

Run: `npx tsc --noEmit`
Expected: error yang tersisa hanya dari pemanggil `NarrativePanel` di halaman viewer (Task 5 belum jalan) -- tidak ada error dari `NarrativePanel.tsx` sendiri.

Run: `npm run lint`
Expected: bersih dari `NarrativePanel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/viewer/NarrativePanel.tsx
git commit -m "feat: show dynamic XAI caption based on active layer in NarrativePanel"
```

---

### Task 5: Viewer Page — Wiring `xaiLayer` State

**Files:**
- Modify: `app/(app)/viewer/[caseId]/page.tsx`

**Interfaces:**
- Consumes: `XaiLayer` dari `@/types/case` (Task 1); `ViewerToolbar` props baru (Task 2); `MriStage` props baru (Task 3); `NarrativePanel` props baru (Task 4).
- Produces: halaman viewer yang berfungsi penuh end-to-end -- tidak ada task lanjutan yang bergantung pada ini.

- [ ] **Step 1: Ganti seluruh isi `app/(app)/viewer/[caseId]/page.tsx`**

```tsx
'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ViewerHeader } from '@/components/viewer/ViewerHeader';
import { AnalyzingState } from '@/components/viewer/AnalyzingState';
import { MriStage } from '@/components/viewer/MriStage';
import { ViewerToolbar } from '@/components/viewer/ViewerToolbar';
import { SliceControls } from '@/components/viewer/SliceControls';
import { NarrativePanel } from '@/components/viewer/NarrativePanel';
import { ReviewPanel } from '@/components/viewer/ReviewPanel';
import type { CaseDTO, XaiLayer } from '@/types/case';

export default function ViewerPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const searchParams = useSearchParams();
  const cameFrom = searchParams.get('from') ?? 'dashboard';

  const [layerSeg, setLayerSeg] = useState(true);
  const [xaiLayer, setXaiLayer] = useState<XaiLayer>('gradcam');
  const [zoom, setZoom] = useState(1);
  const [slice, setSlice] = useState(78);

  const key = `/api/cases/${caseId}`;
  const { data: activeCase } = useSWR<CaseDTO>(key, fetcher, {
    refreshInterval: (data) => (data?.isAnalyzing ? 700 : 0),
  });

  if (!activeCase) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleSelectXai = (layer: 'gradcam' | 'attention') =>
    setXaiLayer((current) => (current === layer ? 'none' : layer));

  return (
    <div id="bc-print-area" className="flex h-full flex-col">
      <ViewerHeader activeCase={activeCase} cameFrom={cameFrom} />

      {activeCase.isAnalyzing ? (
        <AnalyzingState />
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col bg-theater-950">
            <ViewerToolbar
              activeCase={activeCase}
              layerSeg={layerSeg}
              xaiLayer={xaiLayer}
              onToggleSeg={() => setLayerSeg((v) => !v)}
              onSelectXai={handleSelectXai}
              zoom={zoom}
              onZoomIn={() => setZoom((z) => Math.min(2.2, z + 0.2))}
              onZoomOut={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              onZoomReset={() => setZoom(1)}
            />
            <div className="relative flex flex-1">
              <MriStage
                activeCase={activeCase}
                zoom={zoom}
                slice={slice}
                layerSeg={layerSeg}
                xaiLayer={xaiLayer}
              />
              <SliceControls
                slice={slice}
                onUp={() => setSlice((s) => Math.min(156, s + 1))}
                onDown={() => setSlice((s) => Math.max(1, s - 1))}
              />
            </div>
          </div>

          <div className="flex w-[400px] flex-shrink-0 flex-col border-l border-slate-200">
            <NarrativePanel activeCase={activeCase} xaiLayer={xaiLayer} />
            <ReviewPanel
              activeCase={activeCase}
              onUpdated={(updated) => {
                mutate(key, updated, false);
                mutate('/api/cases');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verifikasi typecheck & lint bersih di seluruh proyek**

Run: `npx tsc --noEmit`
Expected: tidak ada error sama sekali (ini task terakhir, semua pemanggil sudah konsisten).

Run: `npm run lint`
Expected: bersih, tidak ada warning/error.

- [ ] **Step 3: Verifikasi manual di browser**

Jalankan `npm run dev` (port 3000, `.env.local` sudah mengarah ke backend live). Login, buka sebuah kasus yang sudah selesai dianalisis dengan `imageUrl` terisi, lalu di halaman viewer periksa:

- Chip "Segmentasi Tumor" tetap berfungsi seperti sebelumnya.
- Chip "Grad-CAM (XAI)" muncul kalau `gradcamUrl` kasus itu tidak null, dan menampilkan heatmap asli (bukan gradient dekoratif) saat aktif.
- Chip "Attention Weight Map" muncul kalau `attentionUrl` tidak null, menyala saling eksklusif dengan Grad-CAM (menyalakan satu mematikan yang lain), dan klik ulang pada chip yang aktif mematikannya.
- Panel kanan menampilkan narasi klinis (`narrative`) kalau backend berhasil membuatnya, dan blok "Keterangan Peta XAI" teksnya berubah sesuai chip XAI mana yang sedang aktif.
- Kasus dengan `gradcamUrl`/`attentionUrl` null (mis. kasus lama dari sebelum kolom ini ada, atau XAI gagal dihitung) -- pastikan chip terkait tidak muncul dan tidak ada error di console.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/viewer/[caseId]/page.tsx"
git commit -m "feat: wire mutually-exclusive XAI layer state into viewer page"
```
