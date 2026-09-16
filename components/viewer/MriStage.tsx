'use client';

import { useAuthenticatedImage } from '@/lib/hooks/useAuthenticatedImage';
import type { CaseDTO, XaiLayer } from '@/types/case';

export function MriStage({
  activeCase,
  zoom,
  layerSeg,
  xaiLayer,
}: {
  activeCase: CaseDTO;
  zoom: number;
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
              style={{ opacity: layerSeg ? 0.85 : 0, pointerEvents: layerSeg ? 'auto' : 'none' }}
              draggable={false}
            />
          )}
          {gradcamSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gradcamSrc}
              alt="Peta Grad-CAM"
              className="absolute inset-0 h-full w-full select-none transition-opacity duration-300"
              style={{
                opacity: xaiLayer === 'gradcam' ? 0.85 : 0,
                pointerEvents: xaiLayer === 'gradcam' ? 'auto' : 'none',
              }}
              draggable={false}
            />
          )}
          {attentionSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attentionSrc}
              alt="Peta Attention Weight"
              className="absolute inset-0 h-full w-full select-none transition-opacity duration-300"
              style={{
                opacity: xaiLayer === 'attention' ? 0.85 : 0,
                pointerEvents: xaiLayer === 'attention' ? 'auto' : 'none',
              }}
              draggable={false}
            />
          )}
        </div>
      ) : (
        <div className="text-[13px] text-slate-500">Citra belum tersedia untuk kasus ini.</div>
      )}

    </div>
  );
}
