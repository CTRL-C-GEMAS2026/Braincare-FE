import type { UserProfile } from '@/types/user';

/** In-memory mock store — resets on server restart, not a real DB. */
let profile: UserProfile = {
  name: 'dr. Ratna Kusuma, Sp.Rad(K)',
  specialty: 'Spesialis Radiologi Konsultan Neuroradiologi',
  sip: '503/RAD/2019/DKI',
  hospital: 'RS Rujukan Nasional Cipto',
  department: 'Radiologi & Pencitraan Diagnostik',
  email: 'ratna.kusuma@rsrujukan.go.id',
  phone: '(021) 555-0192',
  photoUrl: null,
  lastLogin: { at: '24 Jul 2026, 08:47', location: 'Jakarta, Indonesia', knownDevice: true },
  passwordLastChanged: '3 bulan lalu',
};

export function getProfile(): UserProfile {
  return profile;
}

export function updateProfile(
  patch: Partial<Pick<UserProfile, 'name' | 'specialty' | 'sip' | 'photoUrl'>>
): UserProfile {
  profile = { ...profile, ...patch };
  return profile;
}
