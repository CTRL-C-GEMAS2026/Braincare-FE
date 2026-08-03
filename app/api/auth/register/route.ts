import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, sip, hospital, password, confirmPassword } = body ?? {};

  const valid =
    !!name && !!email && !!sip && !!hospital && typeof password === 'string' &&
    password.length >= 8 && password === confirmPassword;

  if (!valid) {
    return NextResponse.json(
      { error: 'Data pendaftaran tidak lengkap atau kata sandi tidak memenuhi syarat.' },
      { status: 400 }
    );
  }

  return NextResponse.json({ data: { ok: true } }, { status: 201 });
}
