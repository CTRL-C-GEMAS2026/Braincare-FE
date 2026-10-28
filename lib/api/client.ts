import { clearSession, getToken } from '@/lib/auth/session';
import { readServerEvents } from '@/lib/api/sse';
import type { CaseDTO } from '@/types/case';

export class ApiError extends Error {}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    throw new ApiError(json.error ?? 'Terjadi kesalahan.');
  }
  return json.data as T;
}

export async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { ...authHeader() } });
  return handle<T>(res);
}

export type NarrativeEvent =
  | { type: 'narrative'; text: string }
  | { type: 'complete'; case: CaseDTO };

export async function streamCaseNarrative(
  caseId: string,
  onEvent: (event: NarrativeEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/cases/${encodeURIComponent(caseId)}/narrative/stream`, {
    headers: { ...authHeader(), Accept: 'text/event-stream' },
    cache: 'no-store',
    signal,
  });
  if (!res.ok) await handle(res);
  if (!res.body || !res.headers.get('content-type')?.includes('text/event-stream')) {
    throw new ApiError('Koneksi narasi belum tersedia.');
  }
  let complete = false;
  await readServerEvents(res.body, (event, data) => {
    if (event === 'narrative') {
      const value = JSON.parse(data) as { text: string };
      onEvent({ type: 'narrative', text: value.text });
    } else if (event === 'complete') {
      complete = true;
      onEvent({ type: 'complete', case: JSON.parse(data) as CaseDTO });
    } else if (event === 'error') {
      throw new ApiError('Koneksi narasi terputus.');
    }
  });
  if (!complete) throw new ApiError('Narasi belum selesai.');
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res);
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeader() },
    body: formData,
  });
  return handle<T>(res);
}

export async function fetchBlob(path: string): Promise<Blob | null> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { ...authHeader() } });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    } else if (res.status !== 404) {
      console.warn(`fetchBlob: unexpected status ${res.status} for ${path}`);
    }
    return null;
  }
  return res.blob();
}

export async function fetchReportPdf(caseId: string, revision: number): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/api/cases/${encodeURIComponent(caseId)}/report.pdf?revision=${revision}`, {
    headers: { ...authHeader(), Accept: 'application/pdf' },
    cache: 'no-store',
  });
  if (!res.ok) await handle(res);
  if (!res.headers.get('content-type')?.startsWith('application/pdf')) {
    throw new ApiError('Respons laporan bukan berkas PDF.');
  }
  return res.blob();
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Stream one assistant answer for the case; `messages` ends with the new user turn. */
export async function streamCaseChat(
  caseId: string,
  messages: ChatTurn[],
  onPartial: (text: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/cases/${encodeURIComponent(caseId)}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...authHeader() },
    body: JSON.stringify({ messages }),
    cache: 'no-store',
    signal,
  });
  if (!res.ok) await handle(res);
  if (!res.body || !res.headers.get('content-type')?.includes('text/event-stream')) {
    throw new ApiError('Koneksi chat belum tersedia.');
  }
  let answer: string | null = null;
  await readServerEvents(res.body, (event, data) => {
    if (event === 'chat') onPartial((JSON.parse(data) as { text: string }).text);
    else if (event === 'complete') answer = (JSON.parse(data) as { text: string }).text;
    else if (event === 'error') throw new ApiError((JSON.parse(data) as { error: string }).error);
  });
  if (answer === null) throw new ApiError('Jawaban belum selesai.');
  return answer;
}
