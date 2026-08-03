export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="2"
        className="absolute left-3.5 top-1/2 -translate-y-1/2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari nama pasien atau nomor MRN..."
        className="w-full rounded-xl border border-slate-200 py-2.75 py-[11px] pl-9.5 pl-[38px] pr-3.5 text-[13.5px] outline-none focus:border-brand-400"
      />
    </div>
  );
}
