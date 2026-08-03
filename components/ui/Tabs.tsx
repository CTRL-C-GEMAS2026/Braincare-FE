import clsx from 'clsx';

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors',
            active === t.key ? 'bg-white text-brand-600 shadow-card' : 'text-slate-500'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
