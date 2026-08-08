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
      // eslint-disable-next-line
      setSrc(null);
      return;
    }

    fetchBlob(url)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setSrc(null);
          return;
        }
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
