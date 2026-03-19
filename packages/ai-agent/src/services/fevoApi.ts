const API_BASE = import.meta.env.VITE_API_URL || '/api/v1/event-feed/fevo';

export async function listOrganizations(): Promise<any> {
  const res = await fetch(`${API_BASE}/organizations`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function searchEvents(orgId: string, query?: string): Promise<any> {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  const res = await fetch(`${API_BASE}/organizations/${orgId}/events?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// SSE-based launch - returns an abort function
export function launchOffer(
  params: {
    orgId: string;
    eventId: string;
    title: string;
    description: string;
    accessCode: string;
    hasGroups: boolean;
  },
  onProgress: (step: string, detail?: string) => void,
  onDone: (result: { outingId: string; accessCode: string; manageUrl: string }) => void,
  onError: (error: string) => void,
): () => void {
  const controller = new AbortController();

  fetch(`${API_BASE}/offers/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        onError(`Server error: ${res.status} - ${text}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onError('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m);
          if (!match) continue;
          try {
            const event = JSON.parse(match[1]);
            if (event.step === 'done') {
              onDone(event.result);
            } else if (event.step === 'error') {
              onError(event.detail || 'Unknown error');
            } else {
              onProgress(event.step, event.detail);
            }
          } catch {
            // Ignore malformed SSE data
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message);
      }
    });

  return () => controller.abort();
}
