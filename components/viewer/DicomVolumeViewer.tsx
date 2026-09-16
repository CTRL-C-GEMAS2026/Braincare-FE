'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useAuthenticatedImage } from '@/lib/hooks/useAuthenticatedImage';
import type { CaseDTO } from '@/types/case';

type Plane = 'axial' | 'coronal' | 'sagittal';

const PLANE_LABELS: Record<Plane, string> = {
  axial: 'Axial',
  coronal: 'Coronal',
  sagittal: 'Sagittal',
};

export function DicomVolumeViewer({ activeCase }: { activeCase: CaseDTO }) {
  const shape = activeCase.volumeShape;
  const [plane, setPlane] = useState<Plane>('axial');
  const [index, setIndex] = useState(() => Math.floor((shape?.axial ?? 1) / 2));
  const url = shape ? `/api/cases/${activeCase.id}/volume/slice?plane=${plane}&index=${index}` : null;
  const slice = useAuthenticatedImage(url);

  if (!shape) return null;

  const count = shape[plane];

  function selectPlane(next: Plane) {
    setPlane(next);
    setIndex(Math.floor(shape![next] / 2));
  }

  return (
    <div className="flex flex-1 flex-col bg-theater-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theater-border px-4 py-2.5">
        <div className="flex gap-1.5">
          {(Object.keys(PLANE_LABELS) as Plane[]).map((p) => (
            <button
              key={p}
              onClick={() => selectPlane(p)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                plane === p ? 'bg-brand-600 text-white' : 'bg-theater-800 text-slate-400 hover:text-white'
              )}
            >
              {PLANE_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          {activeCase.modality ?? 'N/A'} · {shape.axial}×{shape.coronal}×{shape.sagittal} voxel
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {slice ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slice} alt={`Slice ${PLANE_LABELS[plane]}`} className="max-h-[65vh] max-w-full select-none" draggable={false} />
        ) : (
          <div className="text-[13px] text-slate-500">Memuat slice…</div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-theater-border px-4 py-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index <= 0}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-theater-border bg-theater-800 text-slate-400 hover:text-white disabled:opacity-40"
        >
          ‹
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, count - 1)}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="flex-1 accent-brand-500"
        />
        <button
          onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
          disabled={index >= count - 1}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-theater-border bg-theater-800 text-slate-400 hover:text-white disabled:opacity-40"
        >
          ›
        </button>
        <div className="w-20 flex-shrink-0 text-right font-mono text-[11px] text-slate-500">
          {index + 1} / {count}
        </div>
      </div>
    </div>
  );
}
