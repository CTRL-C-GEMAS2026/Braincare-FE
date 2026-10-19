import { useEffect, useState } from 'react';
import { streamCaseNarrative } from '@/lib/api/client';
import type { CaseDTO } from '@/types/case';

export function useNarrativeStream(
  caseId: string,
  isAnalyzing: boolean,
  onComplete: (activeCase: CaseDTO) => void,
): string {
  const [draft, setDraft] = useState<{ caseId: string; text: string } | null>(null);

  useEffect(() => {
    if (!isAnalyzing) return;
    const controller = new AbortController();
    async function connect() {
      while (!controller.signal.aborted) {
        try {
          await streamCaseNarrative(caseId, (event) => {
            if (controller.signal.aborted) return;
            if (event.type === 'narrative') setDraft({ caseId, text: event.text });
            else onComplete(event.case);
          }, controller.signal);
          return;
        } catch {
          if (controller.signal.aborted) return;
          // Polling remains active; reconnect to receive the latest draft snapshot.
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    void connect();
    return () => controller.abort();
  }, [caseId, isAnalyzing, onComplete]);

  return isAnalyzing && draft?.caseId === caseId ? draft.text : '';
}
