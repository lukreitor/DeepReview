import { create, type StateCreator } from 'zustand';

const TOKEN_STORAGE_KEY = 'deepreview.accessToken';

export type AuthState = {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const getInitialToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

const storeCreator: StateCreator<AuthState> = (set) => ({
  token: getInitialToken(),
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
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    set({ token: null });
  },
});

export const useAuthStore = create<AuthState>(storeCreator);
