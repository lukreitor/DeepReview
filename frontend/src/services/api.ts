import axios from 'axios';

import { useAuthStore } from '@store/authStore';

const defaultBaseUrl = '/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl;

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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    const rejection = error instanceof Error ? error : new Error('Unexpected API error');
    return Promise.reject(rejection);
  }
);

export const getApiBaseUrl = () => configuredBaseUrl;
