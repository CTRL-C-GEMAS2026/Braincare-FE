'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, streamCaseChat, type ChatTurn } from '@/lib/api/client';

const SUGGESTIONS = ['Apa yang ditunjukkan Grad-CAM?', 'Apakah jenis tumornya sudah pasti?', 'Apa yang belum dapat disimpulkan?'];

/** Q&A about the report on screen. History lives only here: nothing is stored server-side. */
export function ChatPanel({ caseId }: { caseId: string }) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [partial, setPartial] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [turns, partial]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatTurn[] = [...turns, { role: 'user', content: question }];
    setTurns(next); setInput(''); setPartial(''); setError(null); setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const answer = await streamCaseChat(caseId, next, setPartial, controller.signal);
      setTurns([...next, { role: 'assistant', content: answer }]);
    } catch (err) {
      if (controller.signal.aborted) return;
      setTurns(turns); setInput(question); // let the doctor retry without retyping
      setError(err instanceof ApiError ? err.message : 'Asisten tidak dapat menjawab saat ini.');
    } finally { setPartial(''); setBusy(false); }
  }

  return (
    <section className="mb-[18px]" data-testid="case-chat">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Tanya Asisten AI</div>
      <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-[13px] leading-relaxed">
        {turns.length === 0 && !busy && (
          <div>
            <p className="mb-2 text-slate-500">Tanyakan hal yang berkaitan dengan hasil analisis ini.</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => void send(s)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-brand-700">{s}</button>
              ))}
            </div>
          </div>
        )}
        {[...turns, ...(busy ? [{ role: 'assistant' as const, content: partial || '…' }] : [])].map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'text-right' : ''}>
            <span className={`inline-block max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-left ${t.role === 'user' ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>{t.content}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-danger-700">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="mt-2 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} disabled={busy} placeholder="Ketik pertanyaan…" aria-label="Pertanyaan untuk asisten AI" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-500" />
        <button type="submit" disabled={busy || !input.trim()} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Kirim</button>
      </form>
      <p className="mt-1 text-[10px] text-slate-400">Jawaban bantuan otomatis, bukan diagnosis; riwayat chat tidak disimpan dan perlu konfirmasi dokter.</p>
    </section>
  );
}
