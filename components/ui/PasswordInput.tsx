'use client';

import { InputHTMLAttributes, useState } from 'react';

const EYE_OPEN = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_CLOSED = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8">
    <path d="M3 3l18 18" />
    <path d="M10.6 5.2A10.6 10.6 0 0112 5c6.5 0 10 7 10 7a17.9 17.9 0 01-3.2 4.1M6.2 6.2A17.7 17.7 0 002 12s3.5 7 10 7a10.4 10.4 0 004.8-1.1" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2" />
  </svg>
);

export function PasswordInput({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-slate-700">{label}</div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-3 pr-11 font-sans text-sm text-slate-900 outline-none transition-colors focus:border-brand-400"
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center p-1"
          tabIndex={-1}
        >
          {show ? EYE_OPEN : EYE_CLOSED}
        </button>
      </div>
    </div>
  );
}
