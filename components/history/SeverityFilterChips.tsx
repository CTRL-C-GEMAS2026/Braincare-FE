import clsx from 'clsx';
import { SEVERITY_FILTERS } from '@/lib/utils/badge';
import type { Severity } from '@/types/case';

export function SeverityFilterChips({
  active,
  onChange,
}: {
  active: Severity | 'semua';
  onChange: (key: Severity | 'semua') => void;
}) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {SEVERITY_FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={clsx(
            'rounded-full border px-3.5 py-1.75 py-[7px] text-[12.5px] font-semibold transition-colors',
            active === f.key
              ? 'border-brand-600 bg-brand-50 text-brand-600'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
