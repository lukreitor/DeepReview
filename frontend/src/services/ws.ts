import { getApiBaseUrl } from './api';

const defaultWsBase = 'ws://localhost:8000/ws';
const configuredWsBase = import.meta.env.VITE_WS_BASE_URL ?? defaultWsBase;

type ReviewEvent = Record<string, unknown> & {
  submissionId?: string;
  status?: string;
  cached?: boolean;
  score?: number;
};

type ReviewEventHandler = (payload: ReviewEvent) => void;

const isReviewEvent = (value: unknown): value is ReviewEvent =>
  typeof value === 'object' && value !== null;

export const openReviewStream = (token: string, handler: ReviewEventHandler) => {
  const base = configuredWsBase || deriveWsUrl();
  const url = new URL('/reviews', base);
  url.searchParams.set('token', token);

  const socket = new WebSocket(url.toString());

  socket.addEventListener('message', (event) => {
    try {
      if (typeof event.data !== 'string') {
        console.warn('Ignoring non-text websocket payload', event.data);
        return;
      }
      const parsed: unknown = JSON.parse(event.data);
      if (isReviewEvent(parsed)) {
        handler(parsed);
      } else {
        console.warn('Received unexpected websocket payload', parsed);
      }
    } catch (error) {
      console.error('Failed to parse websocket message', error);
    }
  });

  socket.addEventListener('error', (event) => {
    console.error('WebSocket error', event);
  });

  return socket;
};

const deriveWsUrl = () => {
  const baseUrl = getApiBaseUrl();
  if (baseUrl.startsWith('https://')) {
    return baseUrl.replace('https://', 'wss://').replace(/\/api\/?$/, '/ws');
  }
  if (baseUrl.startsWith('http://')) {
    return baseUrl.replace('http://', 'ws://').replace(/\/api\/?$/, '/ws');
  }
  return defaultWsBase;
};
