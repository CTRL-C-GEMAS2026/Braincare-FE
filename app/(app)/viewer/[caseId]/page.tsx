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
    <div id="bc-print-area" className="flex flex-col md:h-full">
      <ViewerHeader activeCase={activeCase} cameFrom={cameFrom} />

      {activeCase.isAnalyzing ? (
        <AnalyzingState />
      ) : (
        <div className="flex flex-col md:min-h-0 md:flex-1 md:flex-row">
          <div className="flex min-w-0 flex-col bg-theater-950 md:flex-1">
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
            <div className="relative flex h-[45vh] md:h-auto md:flex-1">
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

          <div className="flex w-full flex-shrink-0 flex-col border-t border-slate-200 md:w-[400px] md:border-l md:border-t-0">
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
