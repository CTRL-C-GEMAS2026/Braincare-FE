import clsx from 'clsx';

export function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={clsx(
        'inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        className
      )}
    >
      {label}
    </span>
  );
}
