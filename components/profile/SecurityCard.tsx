import type { UserProfile } from '@/types/user';

export function SecurityCard({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-6 shadow-card">
      <div className="text-[13px] font-bold text-slate-700">Keamanan Akun</div>

      <div>
        <div className="text-[13.5px] font-semibold">Kata Sandi</div>
        <div className="mt-0.5 text-xs text-slate-400">Terakhir diubah {profile.passwordLastChanged}</div>
        <button className="mt-2.5 w-full rounded-lg border border-slate-200 bg-white py-2.25 py-[9px] text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50">
          Ubah Kata Sandi
        </button>
      </div>

      <div className="h-px bg-slate-100" />

      <div>
        <div className="text-[13.5px] font-semibold">Aktivitas Masuk Terakhir</div>
        <div className="mt-0.5 text-xs text-slate-400">
          {profile.lastLogin.at} · {profile.lastLogin.location}
        </div>
        {profile.lastLogin.knownDevice && (
          <span className="mt-2 inline-block rounded-full bg-success-50 px-2.5 py-1 text-[11.5px] font-semibold text-success-700">
            Perangkat dikenal
          </span>
        )}
      </div>
    </div>
  );
}
