import { useEffect, useState } from 'react';
import { fetchBlob } from '@/lib/api/client';

export function useAuthenticatedImage(url: string | null): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    // Reset on every url change so a stale image from the previous request never lingers on screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(null);

    if (!url) return;

    fetchBlob(url)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return src;
}
