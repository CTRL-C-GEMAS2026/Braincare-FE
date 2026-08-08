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
import type { CaseDTO } from '@/types/case';

export default function ViewerPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const searchParams = useSearchParams();
  const cameFrom = searchParams.get('from') ?? 'dashboard';

  const [layerSeg, setLayerSeg] = useState(true);
  const [layerGradcam, setLayerGradcam] = useState(true);
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

  return (
    <div id="bc-print-area" className="flex h-full flex-col">
      <ViewerHeader activeCase={activeCase} cameFrom={cameFrom} />

      {activeCase.isAnalyzing ? (
        <AnalyzingState />
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col bg-theater-950">
            <ViewerToolbar
              layerSeg={layerSeg}
              layerGradcam={layerGradcam}
              onToggleSeg={() => setLayerSeg((v) => !v)}
              onToggleGradcam={() => setLayerGradcam((v) => !v)}
              showGradcam={!activeCase.imageUrl}
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
                layerGradcam={layerGradcam}
              />
              <SliceControls
                slice={slice}
                onUp={() => setSlice((s) => Math.min(156, s + 1))}
                onDown={() => setSlice((s) => Math.max(1, s - 1))}
              />
            </div>
          </div>

          <div className="flex w-[400px] flex-shrink-0 flex-col border-l border-slate-200">
            <NarrativePanel activeCase={activeCase} />
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
