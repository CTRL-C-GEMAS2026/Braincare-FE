export interface UserProfile {
  name: string;
  specialty: string;
  sip: string;
  hospital: string;
  department: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  lastLogin: { at: string; location: string; knownDevice: boolean };
  passwordLastChanged: string;
}

export interface AuthUser {
  email: string;
  name: string;
}
