'use client';

import { useSyncExternalStore } from 'react';

export type ToastKind = 'success' | 'error';
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const DURATION_MS = { success: 3000, error: 4500 } as const;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, kind, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, DURATION_MS[kind]);
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

function getServerSnapshot() {
  return toasts;
}

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
