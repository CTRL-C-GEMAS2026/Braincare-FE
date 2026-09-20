'use client';

import { useSyncExternalStore } from 'react';

const KEY = 'bc-bookmarks';
const listeners = new Set<() => void>();

function readIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

let cache = readIds();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cache;
}

function getServerSnapshot() {
  return cache;
}

/** Bookmark kasus tersimpan per-browser di localStorage -- tidak disinkronkan ke backend. */
export function useBookmarks() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle(caseId: string) {
    const next = new Set(cache);
    if (next.has(caseId)) next.delete(caseId);
    else next.add(caseId);
    cache = next;
    localStorage.setItem(KEY, JSON.stringify([...next]));
    listeners.forEach((l) => l());
  }

  return { ids, isBookmarked: (caseId: string) => ids.has(caseId), toggle };
}
