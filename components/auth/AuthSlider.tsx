'use client';

import { useState } from 'react';
import { LogoMark } from '@/components/layout/Logo';
import { Tabs } from '@/components/ui/Tabs';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthSlider() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState('');

  return (
    <div className="flex h-screen w-full">
      <div className="relative hidden flex-[1.1] flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-600 to-brand-500 p-14 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/15">
            <LogoMark />
          </div>
          <div className="text-xl font-bold tracking-tight">BrainCare</div>
        </div>
        <div className="max-w-[440px]">
          <div className="mb-4 text-[34px] font-bold leading-tight">
            Dukungan interpretasi MRI tumor otak berbasis AI.
          </div>
          <div className="text-[15px] leading-relaxed text-white/85">
            Segmentasi otomatis, peta explainability, dan narasi klinis sebagai second opinion. Keputusan akhir
            tetap di tangan dokter.
          </div>
        </div>
        <div className="text-[13px] text-white/65">
          © 2026 BrainCare Clinical Systems. Untuk penggunaan tenaga medis profesional.
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto p-10">
        <div className="w-full max-w-[380px] py-6">
          <Tabs
            tabs={[
              { key: 'login', label: 'Masuk' },
              { key: 'register', label: 'Daftar' },
            ]}
            active={mode}
            onChange={(k) => {
              setMode(k as 'login' | 'register');
              if (k === 'register') setRegisterSuccess(false);
            }}
          />

          {registerSuccess && (
            <div className="animate-bc-fade-in mt-5 flex items-start gap-2.5 rounded-xl border border-success-200 bg-success-50 px-3.5 py-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#15803D"
                strokeWidth="2.4"
                className="mt-0.5 flex-shrink-0"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <div className="text-[12.5px] leading-relaxed text-success-700">
                Registrasi berhasil. Akun Anda akan diverifikasi oleh admin fasilitas kesehatan sebelum dapat
                digunakan untuk masuk.
              </div>
            </div>
          )}

          <div className="mt-7 overflow-hidden">
            <div
              className="flex w-[200%] items-start transition-transform duration-[380ms] ease-out"
              style={{ transform: mode === 'login' ? 'translateX(0%)' : 'translateX(-50%)' }}
            >
              <div className="w-1/2 flex-shrink-0 pr-2">
                <LoginForm key={prefillEmail} initialEmail={prefillEmail} />
              </div>
              <div className="w-1/2 flex-shrink-0 pl-2">
                <RegisterForm
                  onSuccess={(email) => {
                    setMode('login');
                    setRegisterSuccess(true);
                    setPrefillEmail(email);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
