export function Dropzone({ onPick }: { onPick: () => void }) {
  return (
    <div
      onClick={onPick}
      className="cursor-pointer rounded-2xl border-2 border-dashed border-brand-300 bg-slate-50 px-6 py-12 text-center transition-colors hover:bg-brand-50/40"
    >
      <div className="mx-auto mb-4 flex h-13 w-13 h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand-100">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="1.8">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
        </svg>
      </div>
      <div className="text-[15px] font-semibold text-slate-900">Seret berkas ke sini, atau klik untuk memilih</div>
      <div className="mt-1.5 text-[13px] text-slate-500">
        Data pasien akan divalidasi otomatis (integritas header DICOM, anonimisasi)
      </div>
    </div>
  );
}
