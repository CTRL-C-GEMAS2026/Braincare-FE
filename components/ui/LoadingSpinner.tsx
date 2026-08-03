import clsx from 'clsx';

export function LoadingSpinner({
  label,
  size = 56,
  className,
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-4', className)}>
      <div
        className="animate-bc-spin rounded-full border-4 border-brand-100"
        style={{ width: size, height: size, borderTopColor: '#1D4ED8' }}
      />
      {label && <div className="text-sm font-semibold text-slate-800">{label}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-bc-pulse rounded-md bg-slate-200', className)} />;
}
