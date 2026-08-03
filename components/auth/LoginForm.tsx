'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';

export function LoginForm({ initialEmail }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-1.5 text-2xl font-bold text-slate-900">Masuk ke akun Anda</div>
      <div className="mb-8 text-sm text-slate-500">Khusus dokter spesialis radiologi terverifikasi.</div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-slate-700">Email institusi</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="nama@rsrujukan.go.id"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-3 font-sans text-sm text-slate-900 outline-none transition-colors focus:border-brand-400"
          />
        </div>

        <PasswordInput
          label="Kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between text-[13px]">
          <label className="flex items-center gap-2 text-slate-500">
            <input type="checkbox" className="accent-brand-600" />
            Ingat saya
          </label>
          <a href="#" className="font-semibold text-brand-600 hover:text-brand-700">
            Lupa kata sandi?
          </a>
        </div>

        {error && <div className="text-[13px] font-medium text-danger-700">{error}</div>}

        <Button type="submit" disabled={loading} className="mt-2 w-full py-3.5 text-[15px]">
          {loading ? 'Memproses…' : 'Masuk'}
        </Button>

        <div className="mt-2 flex items-center gap-2.5 text-xs text-slate-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 018 0v4" />
          </svg>
          Koneksi terenkripsi, sesuai standar keamanan data rekam medis.
        </div>
      </div>
    </form>
  );
}
