import { NextRequest, NextResponse } from 'next/server';
import { updateCaseReview } from '@/lib/data/cases';

type ReviewBody =
  | { action: 'agree' }
  | { action: 'disagree'; note: string }
  | { action: 'reset' };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as ReviewBody;

  if (!body || !['agree', 'disagree', 'reset'].includes(body.action)) {
    return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  }
  if (body.action === 'disagree' && !body.note?.trim()) {
    return NextResponse.json({ error: 'Catatan koreksi wajib diisi.' }, { status: 400 });
  }

  const updated = updateCaseReview(
    id,
    body.action,
    body.action === 'disagree' ? body.note : undefined
  );
  if (!updated) {
    return NextResponse.json({ error: 'Kasus tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json({ data: updated });
}
