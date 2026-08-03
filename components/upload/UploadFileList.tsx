import clsx from 'clsx';
import type { UploadFile } from '@/types/upload';

export function UploadFileList({ files }: { files: UploadFile[] }) {
  if (files.length === 0) return null;

  return (
    <div className="mt-5 flex flex-col gap-2.5">
      {files.map((f) => {
        const done = f.progress >= 100;
        return (
          <div key={f.id} className="flex items-center gap-3.5 rounded-xl border border-slate-200 px-4.5 px-[18px] py-3.5">
            <div className="flex h-9.5 w-9.5 h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8">
                <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
                <path d="M15 2v5h5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-[13px] font-semibold">
                <div className="truncate">{f.name}</div>
                <div className={clsx(done ? 'text-success-700' : 'text-brand-600')}>
                  {done ? 'Valid, siap dianalisis' : `Mengunggah ${f.progress}%`}
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={clsx('h-full transition-all duration-300', done ? 'bg-success-500 bg-[#22C55E]' : 'bg-brand-600')}
                  style={{ width: `${f.progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
