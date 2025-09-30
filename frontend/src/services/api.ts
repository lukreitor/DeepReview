import axios from 'axios';

import { useAuthStore } from '@store/authStore';

const defaultBaseUrl = '/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl;

const FALLBACK_ERROR_MESSAGE = 'Unexpected API error';

const extractMessage = (raw: unknown): string | undefined => {
  if (!raw) {
    return undefined;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    const first = extractMessage(raw[0]);
    if (first) {
      return first;
    }
  }
  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    if ('msg' in record) {
      return extractMessage(record.msg);
    }
    if ('message' in record) {
      return extractMessage(record.message);
    }
    if ('detail' in record) {
      return extractMessage(record.detail);
    }
    if ('error' in record) {
      return extractMessage(record.error);
    }
  }
  return undefined;
};

export const getApiErrorMessage = (error: unknown, fallback = FALLBACK_ERROR_MESSAGE): string => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as Record<string, unknown> | undefined;
    const messageFromPayload = extractMessage(payload) ?? extractMessage(payload?.detail);
    if (messageFromPayload) {
      return messageFromPayload;
    }
    if (error.response?.statusText) {
      return error.response.statusText;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const apiClient = axios.create({
  baseURL: configuredBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      const message = getApiErrorMessage(error);
      error.message = message;
      return Promise.reject(error);
    }

    return Promise.reject(new Error(FALLBACK_ERROR_MESSAGE));
  }
);

export const getApiBaseUrl = () => configuredBaseUrl;
