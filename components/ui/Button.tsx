import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-cta hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:text-slate-300',
  danger:
    'bg-danger-50 text-danger-700 border border-danger-200 hover:bg-danger-100',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold font-sans transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
