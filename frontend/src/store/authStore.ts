import { create } from 'zustand';
import { api, clearToken, getToken, setToken } from '../lib/api';

export interface User {
  id: string;
  email: string;
  username: string;
}

interface SessionResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/** Convierte el error de axios en un Error con el mensaje del backend. */
function toError(err: unknown, fallback: string): Error {
  const msg = (err as { uiMessage?: string })?.uiMessage;
  return new Error(msg || fallback);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  init: async () => {
    if (!getToken()) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      // Token vencido o inválido → sesión cerrada
      clearToken();
      set({ user: null, loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      const { data } = await api.post<SessionResponse>('/auth/login', { email, password });
      setToken(data.token);
      set({ user: data.user });
    } catch (err) {
      throw toError(err, 'Credenciales incorrectas');
    }
  },

  signUp: async (email, password, username) => {
    try {
      const { data } = await api.post<SessionResponse>('/auth/register', {
        email,
        password,
        username,
      });
      setToken(data.token);
      set({ user: data.user });
    } catch (err) {
      throw toError(err, 'No se pudo crear la cuenta');
    }
  },

  signOut: async () => {
    clearToken();
    set({ user: null });
  },
}));
