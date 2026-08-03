'use client';

import { FormEvent, useState } from 'react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/lib/api/client';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}

function Field({ label, value, onChange, placeholder, type = 'text' }: FieldProps) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-slate-700">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.75 py-[11px] font-sans text-sm text-slate-900 outline-none transition-colors focus:border-brand-400"
      />
    </div>
  );
}

export function RegisterForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sip, setSip] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const valid =
    !!name && !!email && !!sip && !!hospital && password.length >= 8 && password === confirmPassword;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    setLoading(true);
    try {
      await apiPost('/api/auth/register', { name, email, sip, specialty, hospital, password, confirmPassword });
      onSuccess(email);
    } catch {
      setError('Registrasi gagal. Periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-1.5 text-2xl font-bold text-slate-900">Daftar sebagai dokter radiologi</div>
      <div className="mb-7 text-sm text-slate-500">Isi data berikut untuk mengajukan akses ke BrainCare.</div>

      <div className="flex flex-col gap-3.5">
        <Field label="Nama lengkap & gelar" value={name} onChange={setName} placeholder="dr. Nama Anda, Sp.Rad" />
        <Field label="Email institusi" value={email} onChange={setEmail} placeholder="nama@rsrujukan.go.id" type="email" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="No. SIP/STR" value={sip} onChange={setSip} placeholder="503/RAD/2019" />
          <Field label="Spesialisasi" value={specialty} onChange={setSpecialty} placeholder="Neuroradiologi" />
        </div>

        <Field
          label="Rumah sakit / fasilitas kesehatan"
          value={hospital}
          onChange={setHospital}
          placeholder="RS Rujukan Nasional Cipto"
        />

        <PasswordInput
          label="Kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 karakter"
        />

        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-slate-700">Konfirmasi kata sandi</div>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="Ulangi kata sandi"
            className={`w-full rounded-xl border px-3.5 py-3 font-sans text-sm text-slate-900 outline-none transition-colors focus:border-brand-400 ${
              mismatch ? 'border-danger-200' : 'border-slate-200'
            }`}
          />
          {mismatch && <div className="mt-1.5 text-xs text-danger-700">Kata sandi tidak cocok.</div>}
        </div>

        {error && <div className="text-[13px] font-medium text-danger-700">{error}</div>}

        <Button type="submit" disabled={!valid || loading} className="mt-1.5 w-full py-3.5 text-[15px]">
          {loading ? 'Memproses…' : 'Daftar Akun'}
        </Button>
      </div>
    </form>
  );
}
