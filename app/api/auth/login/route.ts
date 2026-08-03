import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/data/profile';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan kata sandi wajib diisi.' }, { status: 400 });
  }

  const profile = getProfile();
  return NextResponse.json({ data: { user: { email, name: profile.name } } });
}
