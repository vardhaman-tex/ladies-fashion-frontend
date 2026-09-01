import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

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

/**
 * Per-request opt-outs from the automatic 401 → refresh → retry flow.
 *
 * Declared as a module augmentation rather than a standalone type so the flags
 * survive the trip through axios: the interceptor reads them back off
 * `error.config`, which axios types as its own config object.
 */
declare module "axios" {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
  export interface AxiosRequestConfig<D = any> {
    /**
     * Don't try to refresh on a 401 — just reject. Used by the refresh call
     * itself, so a dead session can't send it round in circles.
     */
    skipAuthRefresh?: boolean;
    /**
     * Do try to refresh, but if that fails stay on the page instead of bouncing
     * to the login screen. Used by the "are we signed in?" probe on first paint:
     * a visitor who was never signed in shouldn't be dragged to /login just for
     * loading the home page.
     */
    skipAuthRedirect?: boolean;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
}

/** The auth-related subset of the request config, for callers that only set these. */
export type AuthRequestOptions = Pick<
  AxiosRequestConfig,
  "skipAuthRefresh" | "skipAuthRedirect"
>;

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const REFRESH_URL = "/api/v1/auth/refresh";
const LOGIN_PATH = "/login";

/* ─── session-expiry notification ─────────────────────────────────────────
 * The auth store subscribes here so it can clear itself the moment the
 * session is genuinely over. A plain listener list (rather than importing the
 * store) keeps this module free of a circular dependency: the store imports
 * services, and the services import this file.
 * ------------------------------------------------------------------------ */

type SessionExpiredListener = () => void;

const sessionExpiredListeners = new Set<SessionExpiredListener>();

/** Registers a callback fired when a refresh fails and the session is over. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (pathname === LOGIN_PATH) return;
  const redirect = encodeURIComponent(`${pathname}${search}`);
  window.location.href = `${LOGIN_PATH}?redirect=${redirect}`;
}

function handleSessionExpired(silent: boolean) {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // A misbehaving listener must not swallow the original auth failure.
    }
  });
  if (!silent) redirectToLogin();
}

/* ─── token refresh ───────────────────────────────────────────────────────
 * One refresh at a time, ever. Every caller — the 401 interceptor below and
 * the proactive keep-alive timer — awaits the same in-flight promise, so a
 * page that fires eight requests at once still performs exactly one refresh.
 * That matters beyond efficiency: the backend rotates the refresh token on
 * every use, so parallel refreshes would race each other into "token already
 * used" and sign the user out mid-session.
 * ------------------------------------------------------------------------ */

let refreshPromise: Promise<void> | null = null;

/**
 * Rotates the auth cookies, returning the shared in-flight promise when a
 * refresh is already running.
 */
export function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post(REFRESH_URL, null, { skipAuthRefresh: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Already retried once, opted out, or it *is* the refresh call (which
    // carries skipAuthRefresh): retrying would either loop or achieve nothing.
    // The rejection is passed back untouched so that whoever asked for the
    // refresh decides what an expired session means — the interceptor below
    // sends the user to /login, the first-paint session probe stays quiet.
    if (
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      originalRequest.url?.includes(REFRESH_URL)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshSession();
      return await api(originalRequest);
    } catch (refreshError) {
      handleSessionExpired(originalRequest.skipAuthRedirect === true);
      return Promise.reject(refreshError);
    }
  }
);
