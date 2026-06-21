import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Shared Axios instance.
 *
 * In development, Next.js rewrites /api/** → http://localhost:8080/api/**
 * so all requests go to the same origin (localhost:3000).  This avoids
 * cross-origin cookie problems (SameSite/Secure) entirely.
 *
 * In production, NEXT_PUBLIC_API_BASE_URL should be unset (empty) when the
 * frontend and backend share an origin, or set to the backend URL when they
 * don't (e.g. a separate API host behind a CDN that handles CORS).
 */
export const api = axios.create({
  // Empty baseURL → requests go to the same origin; Next.js rewrites proxy them.
  baseURL: "",
  withCredentials: true,
  // Without this, axios's default is 0 (no timeout) — a slow/hung backend
  // leaves the browser's connection open indefinitely. On mobile networks the
  // OS/carrier eventually kills that idle connection itself and shows its own
  // generic "page couldn't load" interstitial instead of our app ever getting
  // a chance to show a retry UI. Failing fast client-side lets React Query's
  // isError path render something useful instead.
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    // Bypass ngrok's browser-warning interstitial page for API requests
    "ngrok-skip-browser-warning": "true",
  },
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

const REFRESH_URL = "/api/v1/auth/refresh";
const LOGIN_PATH = "/login";

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes(REFRESH_URL)) {
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push(() => {
          api(originalRequest).then(resolve).catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      await api.post(REFRESH_URL);
      pendingRequests.forEach((retry) => retry());
      pendingRequests = [];
      return api(originalRequest);
    } catch (refreshError) {
      pendingRequests = [];
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
