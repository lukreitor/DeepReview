import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@services/api';
import { useAuthStore } from '@store/authStore';
export const useRegister = () => useMutation({
    mutationFn: async (payload) => {
        const { data } = await apiClient.post('/auth/register', payload);
        return data;
    },
    onSuccess: async (data) => {
        const authStore = useAuthStore.getState();
        authStore.setToken(data.access_token);
        const profile = await apiClient
            .get('/auth/me')
            .then((response) => response.data);
        authStore.setProfile(profile);
    },
});
export const useLogin = () => useMutation({
    mutationFn: async (payload) => {
        const body = new URLSearchParams({
            username: payload.email,
            password: payload.password,
        });
        const { data } = await apiClient.post('/auth/token', body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return data;
    },
    onSuccess: async (data) => {
        const authStore = useAuthStore.getState();
        authStore.setToken(data.access_token);
        const profile = await apiClient
            .get('/auth/me')
            .then((response) => response.data);
        authStore.setProfile(profile);
    },
});
export const useCurrentUser = () => useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
        const { data } = await apiClient.get('/auth/me');
        useAuthStore.getState().setProfile(data);
        return data;
    },
    enabled: Boolean(useAuthStore.getState().token),
});
