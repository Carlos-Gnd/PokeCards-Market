import axios from 'axios';

// En producción (Vercel) VITE_API_URL está vacío → usa ruta relativa "/api"
// y Vercel la reenvía al backend en Render (rewrite en vercel.json).
// En local VITE_API_URL=http://localhost:3000 → apunta directo al backend.

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const TOKEN_KEY = 'arcadium.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Almacenamiento bloqueado: la sesión dura solo esta pestaña
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nada que limpiar
  }
}

export const api = axios.create({
  baseURL: apiBase,
  // Render free se duerme tras 15 min: la primera petición puede tardar ~50 s
  timeout: 70000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      'Error desconocido al comunicarse con el servidor';
    err.uiMessage = Array.isArray(msg) ? msg.join(', ') : msg;
    return Promise.reject(err);
  },
);
