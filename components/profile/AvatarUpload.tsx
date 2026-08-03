'use client';

import { useRef } from 'react';

export function AvatarUpload({
  photoUrl,
  initials,
  onPick,
}: {
  photoUrl: string | null;
  initials: string;
  onPick: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPick(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
      <button
        onClick={() => inputRef.current?.click()}
        className="group relative mt-0.5 h-16 w-16 flex-shrink-0 rounded-full border-none p-0"
      >
        <div
          className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-cover bg-center bg-brand-100 text-xl font-bold text-brand-600"
          style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
        >
          {!photoUrl && initials}
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/45 opacity-0 transition-opacity group-hover:opacity-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
            <path d="M4 7h3l2-2h6l2 2h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        </div>
      </button>
    </>
  );
}
