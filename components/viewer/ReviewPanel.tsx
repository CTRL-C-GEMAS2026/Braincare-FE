'use client';

import { useState } from 'react';
import { apiPatch } from '@/lib/api/client';
import type { CaseDTO } from '@/types/case';

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function ReviewPanel({
  activeCase,
  onUpdated,
}: {
  activeCase: CaseDTO;
  onUpdated: (updated: CaseDTO) => void;
}) {
  const [showDisagreeForm, setShowDisagreeForm] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function act(body: { action: 'agree' } | { action: 'disagree'; note: string } | { action: 'reset' }) {
    setBusy(true);
    try {
      const updated = await apiPatch<CaseDTO>(`/api/cases/${activeCase.id}/review`, body);
      onUpdated(updated);
      setShowDisagreeForm(false);
      setNote('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-5">
      <div className="mb-1 flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
          <path d="M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
        <div className="text-[13px] font-bold text-slate-900">Tinjauan Dokter</div>
      </div>
      <div className="mb-3.5 text-xs text-slate-400">
        Konfirmasi hasil AI, atau ajukan koreksi jika ada ketidaksesuaian.
      </div>

      {activeCase.review === 'none' && !showDisagreeForm && (
        <div className="animate-bc-fade-in flex gap-2.5">
          <button
            disabled={busy}
            onClick={() => act({ action: 'agree' })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-success-200 bg-success-50 py-3 text-[13px] font-semibold text-success-700 transition-transform active:scale-[0.98]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.4">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Setuju
          </button>
          <button
            disabled={busy}
            onClick={() => setShowDisagreeForm(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-danger-200 bg-danger-50 py-3 text-[13px] font-semibold text-danger-700 transition-transform active:scale-[0.98]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Tidak Setuju / Koreksi
          </button>
        </div>
      )}

      {showDisagreeForm && (
        <div className="animate-bc-fade-in">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Jelaskan ketidaksesuaian: mis. batas segmentasi meleset di kutub temporal, grading dinilai terlalu tinggi, dsb."
            className="min-h-[74px] w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-brand-400"
          />
          <div className="mt-2.5 flex gap-2.5">
            <button
              onClick={() => {
                setShowDisagreeForm(false);
                setNote('');
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700"
            >
              Batal
            </button>
            <button
              disabled={busy || !note.trim()}
              onClick={() => act({ action: 'disagree', note })}
              className="flex-1 rounded-xl bg-danger-700 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Kirim Koreksi
            </button>
          </div>
        </div>
      )}

      {activeCase.review === 'agree' && (
        <div className="animate-bc-fade-in flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-3.5 py-3">
          <div className="flex h-6.5 w-6.5 h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-success-100">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="flex-1 text-[12.5px] font-semibold text-success-700">
            Dikonfirmasi sesuai hasil AI{activeCase.reviewedAt ? ` · ${formatTimestamp(activeCase.reviewedAt)}` : ''}
          </div>
          <button onClick={() => act({ action: 'reset' })} className="text-xs text-success-700 underline">
            Ubah
          </button>
        </div>
      )}

      {activeCase.review === 'disagree' && (
        <div className="animate-bc-fade-in rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-6.5 w-6.5 h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-danger-100">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.4">
                <path d="M12 9v4m0 4h.01M10.3 3.9L2.4 18a1.5 1.5 0 001.3 2.2h16.6a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-2.6 0z" />
              </svg>
            </div>
            <div className="flex-1 text-[12.5px] font-semibold text-danger-700">Ditandai perlu peninjauan ulang</div>
            <button onClick={() => act({ action: 'reset' })} className="text-xs text-danger-700 underline">
              Ubah
            </button>
          </div>
          <div className="mt-2 pl-[38px] text-[12.5px] text-danger-900">&quot;{activeCase.reviewNote}&quot;</div>
        </div>
      )}
    </div>
  );
}
