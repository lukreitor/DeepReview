import { create } from 'zustand';

const TOKEN_STORAGE_KEY = 'deepreview.accessToken';
const PROFILE_STORAGE_KEY = 'deepreview.profile';

export type AuthProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
};

export type AuthState = {
  token: string | null;
  profile: AuthProfile | null;
  setToken: (token: string | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  logout: () => void;
};

const getInitialToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

const getInitialProfile = (): AuthProfile | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as AuthProfile;
  } catch (error) {
    console.warn('Failed to parse stored profile', error);
    return null;
  }
};

type Setter = (
  updater: AuthState | Partial<AuthState> | ((state: AuthState) => AuthState | Partial<AuthState>)
) => void;

const storeCreator = (set: Setter) => ({
  token: getInitialToken(),
  profile: getInitialProfile(),
  setToken: (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    set({ token });
  },
  setProfile: (profile: AuthProfile | null) => {
    if (typeof window !== 'undefined') {
      if (profile) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } else {
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

export const useAuthStore = create<AuthState>(storeCreator);
