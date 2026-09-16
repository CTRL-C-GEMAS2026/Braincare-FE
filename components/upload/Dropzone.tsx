'use client';

import { useRef, useState, type DragEvent } from 'react';
import clsx from 'clsx';

interface DropzoneProps {
  accept: string;
  title: string;
  description: string;
  onFile: (file: File) => void;
}

export function Dropzone({ accept, title, description, onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={clsx(
        'cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
        dragOver ? 'border-brand-500 bg-brand-50/60' : 'border-brand-300 bg-slate-50 hover:bg-brand-50/40'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <div className="mx-auto mb-4 flex h-13 w-13 h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand-100">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="1.8">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
        </svg>
      </div>
      <div className="text-[15px] font-semibold text-slate-900">{title}</div>
      <div className="mt-1.5 text-[13px] text-slate-500">{description}</div>
    </div>
  );
}
