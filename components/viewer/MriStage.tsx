import clsx from 'clsx';

export function MriStage({
  zoom,
  slice,
  layerSeg,
  layerGradcam,
}: {
  zoom: number;
  slice: number;
  layerSeg: boolean;
  layerGradcam: boolean;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      <div
        className="relative transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        <div
          className="relative h-[420px] w-[420px] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse 70% 65% at 50% 48%, #5b5b5f 0%, #38383c 38%, #141416 72%, #000 100%)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
          }}
        >
          <div className="absolute inset-[8%] overflow-hidden rounded-full">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 75% at 45% 42%, #7a7a80 0%, #4c4c52 45%, #232326 78%, #0a0a0b 100%)',
              }}
            />
            <div
              className="absolute inset-[8%] opacity-85 rounded-[48%_52%_55%_45%/50%_48%_52%_50%]"
              style={{
                background: 'radial-gradient(circle at 40% 35%, #8c8c92 0%, #5a5a60 55%, #2a2a2d 100%)',
              }}
            />
            <div className="animate-bc-scan absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-white/25 to-transparent" />
          </div>

          {/* Grad-CAM overlay */}
          <div
            className="pointer-events-none absolute left-[52%] top-[30%] h-[150px] w-[170px] rounded-full transition-all duration-300"
            style={{
              transform: 'translate(-50%,-50%)',
              opacity: layerGradcam ? 0.8 : 0,
              background: 'radial-gradient(circle at 50% 45%, #FDE047 0%, #F97316 35%, #DC2626 58%, transparent 75%)',
              filter: 'blur(10px)',
              mixBlendMode: 'screen',
            }}
          />

          {/* Segmentation overlay */}
          <div
            className={clsx(
              'pointer-events-none absolute left-[52%] top-[30%] h-[74px] w-[88px] rounded-[58%_42%_50%_50%/55%_45%_55%_45%] border-2 border-brand-500 transition-all duration-300',
            )}
            style={{
              transform: 'translate(-50%,-50%)',
              opacity: layerSeg ? 1 : 0,
              background: 'rgba(59,130,246,0.28)',
            }}
          />
        </div>
      </div>

      <div className="absolute bottom-4 left-5 font-mono text-[11px] text-slate-500">
        Slice {slice} / 156 · Axial T1c
      </div>
    </div>
  );
}
