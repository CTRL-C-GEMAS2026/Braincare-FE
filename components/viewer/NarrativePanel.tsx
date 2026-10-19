'use client';

import { useState } from 'react';
import { apiPatch, ApiError } from '@/lib/api/client';
import { toast } from '@/lib/hooks/useToast';
import { RegionSummary } from '@/components/viewer/RegionSummary';
import { AuditHistory } from '@/components/viewer/AuditHistory';
import type { CaseDTO, XaiLayer } from '@/types/case';

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-slate-200 px-3.5 py-3">
      <div className="text-[11px] font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-[13.5px] font-semibold">{value}</div>
    </div>
  );
}

export function NarrativePanel({ activeCase, xaiLayer, onUpdated, onEditingChange }: {
  activeCase: CaseDTO; xaiLayer: XaiLayer;
  onUpdated: (updated: CaseDTO) => void; onEditingChange: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [editRevision, setEditRevision] = useState(activeCase.reportRevision);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function toggleEditor(value: boolean) {
    setEditing(value); onEditingChange(value); setError(null);
    if (value) { setDraft(activeCase.narrative ?? ''); setEditRevision(activeCase.reportRevision); }
  }
  async function saveNarrative() {
    setSaving(true); setError(null);
    try {
      const updated = await apiPatch<CaseDTO>(`/api/cases/${activeCase.id}/narrative`, { narrative: draft, expectedRevision: editRevision });
      onUpdated(updated); toggleEditor(false);
      toast.success('Narasi tersimpan. Tinjau dan setujui revisi ini sebelum mengunduh PDF.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Narasi gagal disimpan. Perubahan Anda tetap ada di editor.');
    } finally { setSaving(false); }
  }
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
      <RegionSummary activeCase={activeCase} />
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {activeCase.isFinalized ? 'Narasi Laporan Final' : 'Narasi Klinis'}
      </div>

      {activeCase.tumorType === null ? (
        <div className="mb-4 text-[13px] font-medium text-danger-700">
          Analisis AI gagal atau belum tersedia untuk kasus ini. Hubungi tim teknis atau unggah ulang studi.
        </div>
      ) : (
        <>
          <div className="mb-1 text-[10px] text-slate-400">Klasifikasi model (AI)</div>
          <div className="mb-0.5 text-base font-bold">{activeCase.tumorType}</div>
          <div className="mb-4 text-[13px] text-slate-500">
            Estimasi kepercayaan model:{' '}
            <span className="font-mono font-semibold text-slate-700">{activeCase.confidence}%</span>
          </div>
        </>
      )}

      {activeCase.narrative && (
        <section className="mb-[18px]">
          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>{activeCase.isFinalized ? 'Laporan final' : 'Draf · menunggu tinjauan'} · revisi {activeCase.reportRevision}</span>
            {!editing && <button data-testid="edit-narrative" onClick={() => toggleEditor(true)} className="font-semibold text-brand-700">Sunting narasi</button>}
          </div>
          {editing ? (
            <>
              <label htmlFor="clinical-narrative" className="mb-2 block text-xs font-semibold">Sunting narasi laporan</label>
              {activeCase.isFinalized && <p className="mb-2 text-xs text-amber-700">Menyimpan perubahan akan membatalkan finalisasi. Laporan perlu disetujui kembali.</p>}
              <textarea id="clinical-narrative" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={30000} disabled={saving} className="min-h-[230px] w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-[13px] leading-relaxed outline-none focus:border-brand-500" />
              <div className="mt-1 text-right text-[10px] text-slate-400">{draft.length.toLocaleString('id-ID')} / 30.000 karakter</div>
              {error && <p role="alert" className="mt-2 text-xs text-danger-700">{error}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <button disabled={saving || !draft.trim()} onClick={() => void saveNarrative()} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan…' : 'Simpan narasi'}</button>
                <button disabled={saving} onClick={() => toggleEditor(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">Batal</button>
                {activeCase.aiNarrative && <button disabled={saving} onClick={() => setDraft(activeCase.aiNarrative!)} className="text-xs text-brand-700">Gunakan draf AI asli</button>}
              </div>
            </>
          ) : <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13.5px] leading-relaxed text-slate-800" data-testid="report-narrative">{activeCase.narrative}</div>}
          {activeCase.aiNarrative && activeCase.aiNarrative !== activeCase.narrative && (
            <details className="mt-2 text-xs text-slate-500"><summary className="cursor-pointer">Lihat draf AI asli</summary><p className="mt-2 whitespace-pre-wrap">{activeCase.aiNarrative}</p></details>
          )}
        </section>
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
      <AuditHistory caseId={activeCase.id} revision={activeCase.reportRevision} />
    </div>
  );
}
