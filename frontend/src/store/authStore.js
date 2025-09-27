import { create } from 'zustand';
const TOKEN_STORAGE_KEY = 'deepreview.accessToken';
const PROFILE_STORAGE_KEY = 'deepreview.profile';
const getInitialToken = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY);
};
const getInitialProfile = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!stored) {
        return null;
    }
    try {
        return JSON.parse(stored);
    }
    catch (error) {
        console.warn('Failed to parse stored profile', error);
        return null;
    }
};
const storeCreator = (set) => ({
    token: getInitialToken(),
    profile: getInitialProfile(),
    setToken: (token) => {
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem(TOKEN_STORAGE_KEY, token);
            }
            else {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
        }
        set({ token });
    },
    setProfile: (profile) => {
        if (typeof window !== 'undefined') {
            if (profile) {
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
            }
            else {
                localStorage.removeItem(PROFILE_STORAGE_KEY);
            }
        }
        set({ profile });
    },
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
        set({ token: null, profile: null });
    },
});
export const useAuthStore = create(storeCreator);
