import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from '@services/api';
import { useAuthStore } from '@store/authStore';

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
};

type RegisterPayload = { email: string; password: string; full_name?: string };
type LoginPayload = { email: string; password: string };

export const useRegister = () =>
  useMutation<TokenResponse, unknown, RegisterPayload>({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await apiClient.post<TokenResponse>('/auth/register', payload);
      return data;
    },
    onSuccess: async (data: TokenResponse) => {
      const authStore = useAuthStore.getState();
      authStore.setToken(data.access_token);
      const profile = await apiClient
        .get<UserProfile>('/auth/me')
        .then((response) => response.data);
      authStore.setProfile(profile);
    },
  });

export const useLogin = () =>
  useMutation<TokenResponse, unknown, LoginPayload>({
    mutationFn: async (payload: LoginPayload) => {
      const body = new URLSearchParams({
        username: payload.email,
        password: payload.password,
      });
      const { data } = await apiClient.post<TokenResponse>('/auth/token', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return data;
    },
    onSuccess: async (data: TokenResponse) => {
      const authStore = useAuthStore.getState();
      authStore.setToken(data.access_token);
      const profile = await apiClient
        .get<UserProfile>('/auth/me')
        .then((response) => response.data);
      authStore.setProfile(profile);
    },
  });

export const useCurrentUser = () =>
  useQuery<UserProfile>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserProfile>('/auth/me');
      useAuthStore.getState().setProfile(data);
      return data;
    },
    enabled: Boolean(useAuthStore.getState().token),
  });
