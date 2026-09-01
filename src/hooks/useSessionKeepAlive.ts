"use client";

import { useEffect } from "react";
import { refreshSession } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

/**
 * Keeps an in-use session alive so it never lapses under the user.
 *
 * The 401-and-retry path in `lib/api.ts` is the safety net: it recovers a
 * request that happened to land after the 15-minute access token expired. But
 * recovering means an extra round trip on whatever the user just clicked, and
 * it does nothing at all for the parts of the UI that never re-fetch — the
 * header still showing a name, a half-filled checkout form. So we also rotate
 * the token *before* it expires, and the user never notices there was one.
 *
 * Two rules keep this from being a background-tab keepalive that never lets
 * anyone log out:
 *
 *  - Only while signed in.
 *  - Only when the person is actually around: the tab is visible, or they
 *    interacted within ACTIVITY_WINDOW_MS. A tab left open overnight stops
 *    refreshing, and the session ages out normally.
 */

/** Comfortably inside the 15-minute access-token lifetime. */
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** How long after the last interaction we still count someone as "using the site". */
const ACTIVITY_WINDOW_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "focus"] as const;

export function useSessionKeepAlive() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let lastActivityAt = Date.now();
    let cancelled = false;

    const markActive = () => {
      lastActivityAt = Date.now();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, markActive, { passive: true })
    );

    const isUserAround = () =>
      document.visibilityState === "visible" ||
      Date.now() - lastActivityAt < ACTIVITY_WINDOW_MS;

    const keepAlive = () => {
      if (cancelled || !isUserAround()) return;
      // A failure here is deliberately not acted on. From a background timer we
      // cannot tell an expired session from a dropped connection or a backend
      // blip, and tearing the page down for the latter would discard whatever
      // the user was in the middle of. The next real request settles it: it
      // gets a 401, retries the refresh, and only then routes to /login.
      void refreshSession().catch(() => undefined);
    };

    const interval = window.setInterval(keepAlive, REFRESH_INTERVAL_MS);

    // Coming back to a tab that slept through its interval — laptop lid closed,
    // phone in a pocket — is exactly when the token is most likely already
    // stale, so refresh on return rather than waiting out another interval.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActive();
        keepAlive();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", keepAlive);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", keepAlive);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
    };
  }, [isAuthenticated]);
}
