import axios from 'axios';
import { storage } from '../utils/secureStorage';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach token, skip for auth endpoints
client.interceptors.request.use(
  async (config) => {
    const isAuthRoute = config.url?.includes('/api/auth/');
    if (!isAuthRoute) {
      const token = await storage.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    // CRITICAL FIX: When body is FormData (multipart upload), remove the default
    // 'Content-Type: application/json' header set by the axios instance.
    // In React Native, unlike browsers, native XHR does NOT override a preset
    // Content-Type when sending FormData. If 'application/json' remains, multer
    // on the backend sees the wrong Content-Type, does not parse the multipart
    // body, req.file stays undefined, and the upload silently fails.
    // Deleting Content-Type here lets native XHR set the correct
    // 'multipart/form-data; boundary=xxx' automatically.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (err) => Promise.reject(err),
);

// Response: clean structured errors
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status      = error.response?.status;
    const url         = error.config?.url || '';
    const isAuthRoute = url.includes('/api/auth/');
    const serverMsg   = error.response?.data?.message;

    // Network / timeout
    if (!error.response) {
      return Promise.reject({
        message: error.code === 'ECONNABORTED'
          ? 'Request timed out. Please check your connection and try again.'
          : 'Unable to reach the school server. Check your internet connection.',
        isNetworkError: true,
        isTimeout: error.code === 'ECONNABORTED',
        code: error.code,
      });
    }

    // 401 on login = wrong credentials — pass message, do NOT clear session
    if (status === 401 && isAuthRoute) {
      return Promise.reject({ message: serverMsg || 'Invalid email or password.', status: 401 });
    }

    // 401 on protected route = session expired
    if (status === 401 && !isAuthRoute) {
      await storage.clearAll();
      if (global.__onAuthExpired) global.__onAuthExpired();
      return Promise.reject({ message: 'Your session has expired. Please log in again.', status: 401 });
    }

    if (status === 403) {
      return Promise.reject({ message: serverMsg || 'Access denied.', status: 403, data: error.response?.data });
    }
    if (status === 409) {
      return Promise.reject({ message: serverMsg || 'Attendance already marked for today.', status: 409 });
    }

    return Promise.reject({ message: serverMsg || 'Something went wrong. Please try again.', status, data: error.response?.data });
  },
);

export default client;
