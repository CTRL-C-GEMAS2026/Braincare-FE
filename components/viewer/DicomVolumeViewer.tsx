'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useAuthenticatedImage } from '@/lib/hooks/useAuthenticatedImage';
import { Chip } from '@/components/viewer/ViewerToolbar';
import type { CaseDTO } from '@/types/case';

type Plane = 'axial' | 'coronal' | 'sagittal';
// ponytail: 'attention' dihapus -- backend sekarang UNet v2 (plain U-Net), tidak punya
// attention gate seperti AttentionUNet lama, jadi tidak ada peta attention buat dikirim.
type Overlay = 'none' | 'mask' | 'gradcam';
type Layout = 'single' | 'triplanar';

const PLANES: Plane[] = ['axial', 'coronal', 'sagittal'];
// Urutan sama seperti angka axis di PLANE_AXES/axisLabels: 0=axial,1=coronal,2=sagittal.
const AXIS_PLANES: Plane[] = PLANES;

const PLANE_LABELS: Record<Plane, string> = {
  axial: 'Axial',
  coronal: 'Coronal',
  sagittal: 'Sagittal',
};

// Untuk tiap bidang, axis mana (indeks di axisLabels/"IPL"-style: 0=axial,1=coronal,2=sagittal)
// yang jadi baris (atas/bawah) dan kolom (kiri/kanan) gambar 2D -- lihat komentar axis di
// ai/volume.py backend (arr[i,:,:] axial -> baris=coronal, kolom=sagittal, dst).
const PLANE_AXES: Record<Plane, { row: number; col: number }> = {
  axial: { row: 1, col: 2 },
  coronal: { row: 0, col: 2 },
  sagittal: { row: 0, col: 1 },
};

const OPPOSITE: Record<string, string> = { L: 'R', R: 'L', A: 'P', P: 'A', S: 'I', I: 'S' };

// ponytail: dipakai kalau case tidak punya axisLabels (berkas sumber tanpa info orientasi) --
// konvensi radiologi umum, bisa saja tidak sesuai orientasi asli berkas.
const FALLBACK_EDGES: Record<Plane, EdgeLabels> = {
  axial: { top: 'A', bottom: 'P', left: 'R', right: 'L' },
  coronal: { top: 'S', bottom: 'I', left: 'R', right: 'L' },
  sagittal: { top: 'S', bottom: 'I', left: 'A', right: 'P' },
};

interface EdgeLabels {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

function edgeLabelsFor(plane: Plane, axisLabels: string | null): EdgeLabels {
  if (!axisLabels || axisLabels.length !== 3) return FALLBACK_EDGES[plane];
  const { row, col } = PLANE_AXES[plane];
  const bottom = axisLabels[row];
  const right = axisLabels[col];
  return { top: OPPOSITE[bottom] ?? bottom, bottom, left: OPPOSITE[right] ?? right, right };
}

type Shape = { axial: number; coronal: number; sagittal: number };

export function DicomVolumeViewer({
  activeCase,
  initialIndex,
  initialOverlay = 'none',
}: {
  activeCase: CaseDTO;
  /** Slice axial awal (mis. bestSliceIndex, lihat page.tsx) -- default tengah volume kalau tidak diisi. */
  initialIndex?: number;
  initialOverlay?: Overlay;
}) {
  const shape = activeCase.volumeShape;
  const [layout, setLayout] = useState<Layout>('single');
  const [plane, setPlane] = useState<Plane>('axial');
  const [indices, setIndices] = useState<Shape>(() => ({
    axial: initialIndex ?? Math.floor((shape?.axial ?? 1) / 2),
    coronal: Math.floor((shape?.coronal ?? 1) / 2),
    sagittal: Math.floor((shape?.sagittal ?? 1) / 2),
  }));
  const [overlay, setOverlay] = useState<Overlay>(initialOverlay);

  if (!shape) return null;

  function setIndexFor(p: Plane, updater: (i: number) => number) {
    setIndices((prev) => {
      const count = shape![p];
      const next = Math.max(0, Math.min(count - 1, updater(prev[p])));
      return { ...prev, [p]: next };
    });
  }

  function selectOverlay(next: Overlay) {
    setOverlay((current) => (current === next ? 'none' : next));
  }

  function handleCrosshair(updates: Partial<Shape>) {
    setIndices((prev) => {
      const next = { ...prev };
      (Object.keys(updates) as Plane[]).forEach((p) => {
        next[p] = Math.max(0, Math.min(shape![p] - 1, updates[p]!));
      });
      return next;
    });
  }

  const visiblePlanes = layout === 'single' ? [plane] : PLANES;

  return (
    <div className="flex flex-1 flex-col bg-theater-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theater-border px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {layout === 'single' &&
              PLANES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlane(p)}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    plane === p ? 'bg-brand-600 text-white' : 'bg-theater-800 text-slate-400 hover:text-white'
                  )}
                >
                  {PLANE_LABELS[p]}
                </button>
              ))}
          </div>
          <div className="flex gap-1 rounded-lg bg-theater-800 p-0.5">
            {(
              [
                ['single', '1 Bidang'],
                ['triplanar', '3 Bidang'],
              ] as [Layout, string][]
            ).map(([l, label]) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className={clsx(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                  layout === l ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          {activeCase.modality ?? 'N/A'} · {shape.axial}×{shape.coronal}×{shape.sagittal} voxel
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-theater-border px-4 py-2.5">
        <Chip on={overlay === 'mask'} dotColor="#3B82F6" label="Segmentasi Tumor" onClick={() => selectOverlay('mask')} />
        <Chip on={overlay === 'gradcam'} dotColor="#F97316" label="Grad-CAM (XAI)" onClick={() => selectOverlay('gradcam')} />
      </div>

      <div
        className={clsx(
          'flex-1 overflow-hidden',
          layout === 'triplanar' && 'grid grid-cols-1 gap-2 p-2 sm:grid-cols-3'
        )}
      >
        {visiblePlanes.map((p) => (
          <PlaneView
            key={p}
            plane={p}
            indices={indices}
            shape={shape}
            caseId={activeCase.id}
            overlay={overlay}
            axisLabels={activeCase.axisLabels}
            compact={layout === 'triplanar'}
            onIndexChange={(updater) => setIndexFor(p, updater)}
            onCrosshair={handleCrosshair}
          />
        ))}
      </div>
    </div>
  );
}

function PlaneView({
  plane,
  indices,
  shape,
  caseId,
  overlay,
  axisLabels,
  compact,
  onIndexChange,
  onCrosshair,
}: {
  plane: Plane;
  indices: Shape;
  shape: Shape;
  caseId: string;
  overlay: Overlay;
  axisLabels: string | null;
  compact: boolean;
  onIndexChange: (updater: (i: number) => number) => void;
  onCrosshair: (updates: Partial<Shape>) => void;
}) {
  const index = indices[plane];
  const count = shape[plane];
  const url = `/api/cases/${caseId}/volume/slice?plane=${plane}&index=${index}&overlay=${overlay}`;
  const slice = useAuthenticatedImage(url, { keepPrevious: true });
  const edges = edgeLabelsFor(plane, axisLabels);

  // Bidang lain yang jadi baris/kolom gambar ini -- posisi silang (crosshair) menandai
  // slice yang sedang aktif di kedua bidang itu, lihat komentar PLANE_AXES di atas.
  const rowPlane = AXIS_PLANES[PLANE_AXES[plane].row];
  const colPlane = AXIS_PLANES[PLANE_AXES[plane].col];
  const rowFrac = (indices[rowPlane] + 0.5) / shape[rowPlane];
  const colFrac = (indices[colPlane] + 0.5) / shape[colPlane];

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    onIndexChange((i) => i + (e.deltaY > 0 ? 1 : -1));
  }

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    if (!compact) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const colIndex = Math.floor(((e.clientX - rect.left) / rect.width) * shape[colPlane]);
    const rowIndex = Math.floor(((e.clientY - rect.top) / rect.height) * shape[rowPlane]);
    onCrosshair({ [colPlane]: colIndex, [rowPlane]: rowIndex });
  }

  return (
    <div className={clsx('flex flex-col', compact && 'overflow-hidden rounded-xl border border-theater-border')}>
      {compact && (
        <div className="flex items-center justify-between bg-theater-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400">
          {PLANE_LABELS[plane]}
          <span className="font-mono text-slate-500">
            {index + 1}/{count}
          </span>
        </div>
      )}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onWheel={handleWheel}
      >
        {slice ? (
          <div className="relative inline-block leading-[0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slice}
              alt={`Slice ${PLANE_LABELS[plane]}`}
              onClick={handleImageClick}
              className={clsx(
                'max-w-full select-none',
                compact ? 'max-h-[38vh] cursor-crosshair' : 'max-h-[65vh]'
              )}
              draggable={false}
            />
            <OrientationLabels edges={edges} />
            {compact && <CrosshairLines rowFrac={rowFrac} colFrac={colFrac} />}
          </div>
        ) : (
          <div className="text-[13px] text-slate-500">Memuat slice…</div>
        )}
      </div>

      <div className={clsx('flex items-center gap-3 border-t border-theater-border', compact ? 'px-2.5 py-2' : 'px-4 py-3')}>
        <button
          onClick={() => onIndexChange((i) => i - 1)}
          disabled={index <= 0}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-theater-border bg-theater-800 text-slate-400 hover:text-white disabled:opacity-40"
        >
          ‹
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, count - 1)}
          value={index}
          onChange={(e) => onIndexChange(() => Number(e.target.value))}
          className="flex-1 accent-brand-500"
        />
        <button
          onClick={() => onIndexChange((i) => i + 1)}
          disabled={index >= count - 1}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-theater-border bg-theater-800 text-slate-400 hover:text-white disabled:opacity-40"
        >
          ›
        </button>
        {!compact && (
          <div className="w-20 flex-shrink-0 text-right font-mono text-[11px] text-slate-500">
            {index + 1} / {count}
          </div>
        )}
      </div>
    </div>
  );
}

function CrosshairLines({ rowFrac, colFrac }: { rowFrac: number; colFrac: number }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-0 right-0 h-px bg-amber-400/70" style={{ top: `${rowFrac * 100}%` }} />
      <div className="absolute top-0 bottom-0 w-px bg-amber-400/70" style={{ left: `${colFrac * 100}%` }} />
    </div>
  );
}

function OrientationLabels({ edges }: { edges: EdgeLabels }) {
  const cls = 'absolute font-mono text-xs font-bold text-white/70';
  return (
    <>
      <div className={clsx(cls, 'left-1/2 top-2 -translate-x-1/2')}>{edges.top}</div>
      <div className={clsx(cls, 'bottom-2 left-1/2 -translate-x-1/2')}>{edges.bottom}</div>
      <div className={clsx(cls, 'left-2 top-1/2 -translate-y-1/2')}>{edges.left}</div>
      <div className={clsx(cls, 'right-2 top-1/2 -translate-y-1/2')}>{edges.right}</div>
    </>
  );
}
