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
