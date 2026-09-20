'use client';

import clsx from 'clsx';
import { useToasts } from '@/lib/hooks/useToast';

export function ToastHost() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'animate-bc-fade-in pointer-events-auto rounded-xl border px-4 py-3 text-[13px] font-semibold shadow-card',
            t.kind === 'success' ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
