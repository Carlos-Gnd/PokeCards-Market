import axios from 'axios';
import { supabase } from './supabase';

// En producción (Netlify) VITE_API_URL está vacío → usa ruta relativa "/api"
// y Netlify redirige al VPS via el proxy en netlify.toml.
// En local VITE_API_URL=http://localhost:3000 → apunta directo al backend.

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL: apiBase,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
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
