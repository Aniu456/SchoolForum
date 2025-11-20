import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  setAuth: (payload: {
    user: User | null;
    accessToken?: string | null;
    refreshToken?: string | null;
  }) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      setAuth: ({ user, accessToken, refreshToken }) => {
        // 使用新的 token 存储方式
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        return set({
          user,
          isAuthenticated: !!user,
          accessToken,
          refreshToken,
        });
      },

      logout: () => {
        // 清除新的 token 存储
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // 兼容：同时清除旧的 token 存储
        localStorage.removeItem('auth_token');

        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        });
      },

      updateUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
