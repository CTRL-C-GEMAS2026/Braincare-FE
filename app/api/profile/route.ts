import { NextRequest, NextResponse } from 'next/server';
import { getProfile, updateProfile } from '@/lib/data/profile';

export async function GET() {
  return NextResponse.json({ data: getProfile() });
}

export async function PATCH(req: NextRequest) {
  const patch = await req.json().catch(() => ({}));
  const updated = updateProfile(patch);
  return NextResponse.json({ data: updated });
}
