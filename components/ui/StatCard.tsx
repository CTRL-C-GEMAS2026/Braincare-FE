import clsx from 'clsx';
import { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  icon,
  iconBg,
  valueClassName,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-3.5 bg-white px-5 py-4.5 py-[18px]">
      <div
        className={clsx('flex h-8.5 w-8.5 h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg', iconBg)}
      >
        {icon}
      </div>
      <div>
        <div className={clsx('font-mono text-2xl font-bold leading-none', valueClassName ?? 'text-slate-900')}>
          {value}
        </div>
        <div className="mt-1.5 text-xs font-semibold text-slate-500">{label}</div>
      </div>
    </div>
  );
}
