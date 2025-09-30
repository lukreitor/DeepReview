import { getApiBaseUrl } from './api';

const fallbackWsBase = 'ws://localhost:8000/ws';
const configuredWsBase = import.meta.env.VITE_WS_BASE_URL;

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
  const socketUrl = buildSocketUrl(token);
  const socket = new WebSocket(socketUrl);

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

const buildSocketUrl = (token: string): string => {
  const baseUrl = resolveWsBaseUrl();
  const url = new URL(baseUrl.toString());
  url.pathname = `${url.pathname.replace(/\/$/, '')}/reviews`;
  url.searchParams.set('token', token);
  return url.toString();
};

const resolveWsBaseUrl = (): URL => {
  const candidate = configuredWsBase?.trim() || deriveWsBaseFromApi();
  return normaliseWsBase(candidate);
};

const deriveWsBaseFromApi = (): string => {
  const apiBase = getApiBaseUrl() || '/api';
  const origin = getWindowOrigin();
  const absoluteApi = apiBase.startsWith('http') ? apiBase : new URL(apiBase, origin).toString();
  const apiUrl = new URL(absoluteApi);
  apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';

  const trimmedPath = apiUrl.pathname.replace(/\/$/, '');
  const withoutApi = trimmedPath.replace(/\/api$/i, '');
  apiUrl.pathname = `${withoutApi}/ws`.replace(/\/\//g, '/');
  apiUrl.search = '';
  apiUrl.hash = '';
  return apiUrl.toString();
};

const normaliseWsBase = (value: string): URL => {
  try {
    let candidate = value.trim();
    if (!candidate) {
      throw new Error('Empty websocket base value');
    }

    const origin = getWindowOrigin();
    if (candidate.startsWith('/')) {
      candidate = `${origin.replace(/\/$/, '')}${candidate}`;
    }

    if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
      const httpUrl = new URL(candidate);
      httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      httpUrl.pathname = httpUrl.pathname.replace(/\/$/, '');
      httpUrl.search = '';
      httpUrl.hash = '';
      return httpUrl;
    }

    const url = new URL(candidate);
    url.pathname = url.pathname.replace(/\/$/, '');
    url.search = '';
    url.hash = '';
    return url;
  } catch (error) {
    console.warn('Falling back to default websocket base URL', error);
    return new URL(fallbackWsBase);
  }
};

const getWindowOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};
