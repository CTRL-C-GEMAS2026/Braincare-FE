import { NextResponse } from 'next/server';
import { createCaseFromUpload, listCases } from '@/lib/data/cases';

export async function GET() {
  return NextResponse.json({ data: listCases() });
}

export async function POST() {
  const created = createCaseFromUpload();
  return NextResponse.json({ data: created }, { status: 201 });
}
