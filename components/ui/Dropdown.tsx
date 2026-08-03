'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

export function Dropdown({
  trigger,
  children,
}: {
  trigger: (opts: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div className="animate-bc-fade-in absolute right-0 top-[52px] z-20 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-elevated">
          {children}
        </div>
      )}
    </div>
  );
}
