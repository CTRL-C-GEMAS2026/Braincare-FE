'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import { apiPatch } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { AvatarUpload } from './AvatarUpload';
import type { UserProfile } from '@/types/user';

export function ProfileCard({ profile }: { profile: UserProfile }) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftSpecialty, setDraftSpecialty] = useState(profile.specialty);
  const [draftSip, setDraftSip] = useState(profile.sip);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  const router = useRouter();

  const initials = profile.name
    .replace(/^dr\.\s*/i, '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function startEdit() {
    setDraftName(profile.name);
    setDraftSpecialty(profile.specialty);
    setDraftSip(profile.sip);
    setEditing(true);
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await apiPatch('/api/profile', { name: draftName, specialty: draftSpecialty, sip: draftSip });
      await mutate('/api/profile');
      setEditing(false);
    } catch (err) {
      console.error('Gagal menyimpan profil:', err);
      setError('Gagal menyimpan perubahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  async function onPhoto(dataUrl: string) {
    setError(null);
    try {
      await apiPatch('/api/profile', { photoUrl: dataUrl });
      await mutate('/api/profile');
    } catch (err) {
      console.error('Gagal mengunggah foto profil:', err);
      setError('Gagal mengunggah foto. Coba lagi.');
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 p-7 shadow-card">
      <div className="flex items-start gap-5">
        <AvatarUpload photoUrl={profile.photoUrl} initials={initials} onPick={onPhoto} />

        {editing ? (
          <div className="flex flex-1 flex-col gap-2.5">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Nama lengkap & gelar"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.25 py-[9px] text-[13.5px] font-semibold outline-none focus:border-brand-400"
            />
            <input
              value={draftSpecialty}
              onChange={(e) => setDraftSpecialty(e.target.value)}
              placeholder="Spesialisasi"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.25 py-[9px] text-[13px] outline-none focus:border-brand-400"
            />
            <input
              value={draftSip}
              onChange={(e) => setDraftSip(e.target.value)}
              placeholder="No. SIP"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.25 py-[9px] text-[13px] outline-none focus:border-brand-400"
            />
          </div>
        ) : (
          <div className="flex-1 pt-1.5">
            <div className="text-[17px] font-bold leading-tight">{profile.name}</div>
            <div className="mt-1 text-[13px] text-slate-500">{profile.specialty}</div>
            <div className="mt-0.5 text-[13px] text-slate-500">No. SIP: {profile.sip}</div>
          </div>
        )}
      </div>

      <div className="mt-5.5 mt-[22px] flex gap-2.5 border-t border-slate-100 pt-5">
        {!editing ? (
          <Button variant="secondary" onClick={startEdit} className="flex-shrink-0 whitespace-nowrap">
            Edit Profil
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} className="flex-shrink-0 whitespace-nowrap">
              Batal
            </Button>
            <Button onClick={save} disabled={saving} className="flex-shrink-0 whitespace-nowrap">
              {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </Button>
          </>
        )}
      </div>

      {error && <div className="mt-3 text-[13px] font-medium text-danger-700">{error}</div>}

      <div className="mt-5 rounded-2xl border border-slate-200 p-6">
        <div className="mb-4 text-[13px] font-bold text-slate-700">Data Fasilitas Kesehatan</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Rumah Sakit</div>
            <div className="mt-1 text-sm font-semibold">{profile.hospital}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Departemen</div>
            <div className="mt-1 text-sm font-semibold">{profile.department}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Email</div>
            <div className="mt-1 text-sm font-semibold">{profile.email}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Telepon</div>
            <div className="mt-1 text-sm font-semibold">{profile.phone}</div>
          </div>
        </div>
      </div>

      <Button
        variant="danger"
        onClick={() => {
          logout();
          router.push('/login');
        }}
        className="mt-5 w-full"
      >
        Keluar dari Akun
      </Button>
    </div>
  );
}
