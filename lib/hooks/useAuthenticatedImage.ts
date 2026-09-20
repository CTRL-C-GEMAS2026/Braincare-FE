import { useEffect, useRef, useState } from 'react';
import { fetchBlob } from '@/lib/api/client';

/**
 * @param keepPrevious Kalau true, gambar sebelumnya tetap tampil sampai gambar baru siap
 * (tanpa jeda "memuat") -- dipakai untuk navigasi slice yang tetap dalam kasus yang sama.
 * Default false: langsung kosongkan tampilan saat url berganti, supaya gambar kasus/lapisan
 * sebelumnya tidak sempat kelihatan tumpang tindih dengan yang baru (penting saat berpindah kasus).
 */
export function useAuthenticatedImage(url: string | null, { keepPrevious = false } = {}): string | null {
  const [src, setSrc] = useState<string | null>(null);
  const currentObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSrc(null);
      if (currentObjectUrl.current) {
        URL.revokeObjectURL(currentObjectUrl.current);
        currentObjectUrl.current = null;
      }
      return;
    }

    if (!keepPrevious) {
      setSrc(null);
    }

    fetchBlob(url)
      .then((blob) => {
        if (cancelled || !blob) return;
        const nextUrl = URL.createObjectURL(blob);
        const prevUrl = currentObjectUrl.current;
        currentObjectUrl.current = nextUrl;
        setSrc(nextUrl);
        if (prevUrl) URL.revokeObjectURL(prevUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [url, keepPrevious]);

  useEffect(() => {
    return () => {
      if (currentObjectUrl.current) URL.revokeObjectURL(currentObjectUrl.current);
    };
  }, []);

  return src;
}
