import type { CaseDTO, XaiLayer } from '@/types/case';

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-slate-200 px-3.5 py-3">
      <div className="text-[11px] font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-[13.5px] font-semibold">{value}</div>
    </div>
  );
}

export function NarrativePanel({ activeCase, xaiLayer }: { activeCase: CaseDTO; xaiLayer: XaiLayer }) {
  const hasGradcam = activeCase.gradcamUrl !== null;
  const hasAttention = activeCase.attentionUrl !== null;
  const hasXai = hasGradcam || hasAttention;
  const effectiveXai: 'gradcam' | 'attention' =
    xaiLayer === 'gradcam' && hasGradcam
      ? 'gradcam'
      : xaiLayer === 'attention' && hasAttention
        ? 'attention'
        : hasGradcam
          ? 'gradcam'
          : 'attention';

  const infoCards = [
    { label: 'Lokasi', value: activeCase.location },
    { label: 'Grading (WHO)', value: activeCase.grade },
    { label: 'Edema / Mass Effect', value: activeCase.edema },
  ].filter((c): c is { label: string; value: string } => c.value !== null);

  return (
    <div className="px-6 py-5.5 py-[22px] md:flex-1 md:overflow-auto">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Narasi Klinis Otomatis (AI)
      </div>

      {activeCase.tumorType === null ? (
        <div className="mb-4 text-[13px] font-medium text-danger-700">
          Analisis AI gagal atau belum tersedia untuk kasus ini. Hubungi tim teknis atau unggah ulang studi.
        </div>
      ) : (
        <>
          <div className="mb-0.5 text-base font-bold">{activeCase.tumorType}</div>
          <div className="mb-4 text-[13px] text-slate-500">
            Estimasi kepercayaan model:{' '}
            <span className="font-mono font-semibold text-slate-700">{activeCase.confidence}%</span>
          </div>
        </>
      )}

      {activeCase.narrative && (
        <div className="mb-4.5 mb-[18px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13.5px] leading-relaxed text-slate-800">
          {activeCase.narrative}
        </div>
      )}

      {infoCards.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          {infoCards.map((c) => (
            <InfoCard key={c.label} label={c.label} value={c.value} />
          ))}
        </div>
      )}

      {hasXai && (
        <>
          <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Keterangan Peta XAI
          </div>
          <div className="text-[12.5px] leading-relaxed text-slate-500">
            {effectiveXai === 'attention'
              ? 'Attention Weight Map menunjukkan area yang menjadi fokus perhatian model selama proses analisis, sebagai fitur bawaan arsitektur AttentionUNet — bukan indikasi lokasi tumor secara langsung. Gunakan bersama Grad-CAM dan mask segmentasi untuk interpretasi yang lebih utuh.'
              : 'Grad-CAM menyorot area citra yang paling memengaruhi keputusan model, bukan batas anatomis pasti. Gunakan bersama mask segmentasi untuk verifikasi klinis.'}
          </div>
        </>
      )}
    </div>
  );
}
