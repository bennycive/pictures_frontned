import axios from 'axios';
import { loadingBar } from '../lib/loadingBar';

// In development, Vite proxies /api/* to VITE_API_URL (avoids CORS).
// In production, set VITE_API_URL to your backend base URL.
const BASE_URL = import.meta.env.DEV
  ? ''                                          // relative – Vite proxy handles it
  : (import.meta.env.VITE_API_URL || '');

// Strip the backend origin from absolute media URLs so they become relative
// paths (/media/...). Vite's proxy then forwards them to the backend,
// which means images work both on localhost AND from other devices on the
// network (e.g. http://192.168.x.x:5173).
const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const IMAGE_FIELDS = ['image_url', 'artwork_image', 'avatar_url', 'photo_url'];

function rewriteImageUrls(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(rewriteImageUrls);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (IMAGE_FIELDS.includes(k) && typeof v === 'string' && v.startsWith(BACKEND_ORIGIN)) {
        out[k] = v.slice(BACKEND_ORIGIN.length); // → /media/...
      } else {
        out[k] = rewriteImageUrls(v);
      }
    }
    return out;
  }
  return obj;
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  loadingBar.start();
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    loadingBar.done();
    res.data = rewriteImageUrls(res.data);
    return res;
  },
  async (error) => {
    loadingBar.done();
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/token/refresh', { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return apiClient(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (window.location.pathname.startsWith('/dashboard')) {
            // Session expired on a protected page — go home and open the auth modal
            window.location.href = '/';
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
          } else {
            delete original.headers.Authorization;
            return apiClient(original);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
