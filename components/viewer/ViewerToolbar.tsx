import clsx from 'clsx';

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
  layerSeg,
  layerGradcam,
  onToggleSeg,
  onToggleGradcam,
  showGradcam,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: {
  layerSeg: boolean;
  layerGradcam: boolean;
  onToggleSeg: () => void;
  onToggleGradcam: () => void;
  showGradcam: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between bg-theater-900 px-5 py-3">
      <div className="flex gap-2.5">
        <Chip on={layerSeg} dotColor="#3B82F6" label="Segmentasi Tumor" onClick={onToggleSeg} />
        {showGradcam && (
          <Chip on={layerGradcam} dotColor="#F97316" label="Grad-CAM (XAI)" onClick={onToggleGradcam} />
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
