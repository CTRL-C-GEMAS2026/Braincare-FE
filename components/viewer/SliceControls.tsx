const MAX_SLICE = 156;

export function SliceControls({
  slice,
  onUp,
  onDown,
}: {
  slice: number;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="absolute bottom-4 right-5 flex items-center gap-2.5">
      <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-brand-400 transition-all"
          style={{ width: `${(slice / MAX_SLICE) * 100}%` }}
        />
      </div>
      <button
        onClick={onDown}
        className="flex h-6.5 w-6.5 h-[26px] w-[26px] items-center justify-center rounded-md border border-theater-border bg-theater-800 text-slate-400 hover:text-white"
      >
        ‹
      </button>
      <button
        onClick={onUp}
        className="flex h-6.5 w-6.5 h-[26px] w-[26px] items-center justify-center rounded-md border border-theater-border bg-theater-800 text-slate-400 hover:text-white"
      >
        ›
      </button>
    </div>
  );
}
