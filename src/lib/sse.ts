import { SERVER_EVENT_TYPES, type ServerEvent, type ServerEventType } from '@/types/api';

export type ConnectionState = 'connecting' | 'open' | 'closed';

interface Options {
  url?: string;
  onEvent: (event: ServerEvent) => void;
  onStateChange?: (state: ConnectionState) => void;
  /** Called after a successful reconnect (not the first open) so callers can resync state. */
  onReconnect?: () => void;
}

/**
 * Resilient EventSource wrapper: listens to every ServerEventType and reconnects with
 * exponential backoff (1s → 30s, with jitter). Native EventSource auto-retry is disabled
 * by closing on error, so we own the schedule.
 */
export function connectServerEvents({ url = '/api/events', onEvent, onStateChange, onReconnect }: Options) {
  let es: EventSource | null = null;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let hasOpened = false;

  const handle = (type: ServerEventType) => (msg: MessageEvent<string>) => {
    try {
      const parsed = JSON.parse(msg.data) as Partial<ServerEvent>;
      const event: ServerEvent = {
        type: (parsed.type as ServerEventType) ?? type,
        payload: (parsed.payload ?? parsed) as ServerEvent['payload'],
        timestamp: parsed.timestamp ?? new Date().toISOString(),
      };
      onEvent(event);
    } catch {
      /* ignore malformed frames */
    }
  };

  const open = () => {
    if (stopped) return;
    onStateChange?.('connecting');
    es = new EventSource(url, { withCredentials: true });
    es.onopen = () => {
      if (hasOpened) onReconnect?.();
      hasOpened = true;
      attempt = 0;
      onStateChange?.('open');
    };
    es.onerror = () => {
      es?.close();
      es = null;
      onStateChange?.('closed');
      if (stopped) return;
      const base = Math.min(30_000, 1_000 * 2 ** attempt);
      const delay = base / 2 + Math.random() * (base / 2);
      attempt++;
      timer = setTimeout(open, delay);
    };
    for (const t of SERVER_EVENT_TYPES) es.addEventListener(t, handle(t) as EventListener);
    // Some servers send unnamed events — accept those too.
    es.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as ServerEvent;
        if (parsed?.type && SERVER_EVENT_TYPES.includes(parsed.type)) onEvent(parsed);
      } catch {
        /* ignore */
      }
    };
  };

  open();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    es?.close();
    es = null;
  };
}
