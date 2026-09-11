"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

/** How long a pending script tag is given before the button stops waiting on it. */
const LOAD_TIMEOUT_MS = 15_000;

export type RazorpayState = "loading" | "ready" | "error";

/**
 * Whether Razorpay's checkout.js is usable, and a way to make sure it is.
 *
 * This replaces a <Script strategy="lazyOnload"> whose onLoad set the page's
 * state. next/script keeps a cache of the scripts it has already inserted, and
 * for a cached script it does not fire onLoad again — so a client-side
 * navigation back to /checkout, or any remount of the page, left the state at
 * its initial value and the pay button read "Loading payment…" forever. Only a
 * full reload cleared it, which is exactly what customers hit.
 *
 * So the question asked here is the one that actually matters — is
 * window.Razorpay there — and the script tag is treated as one way of getting
 * there rather than as the source of truth.
 */
export function useRazorpay() {
  // Resolved during the first render rather than in an effect. If checkout.js
  // is already on the page — the remount case that produced the stuck button —
  // the very first paint says so, and nothing has to re-render to find out.
  // On the server this is always "loading", which renders identically to
  // "ready" (neither shows the error banner), so hydration is unaffected.
  const [state, setState] = useState<RazorpayState>(() =>
    typeof window !== "undefined" && window.Razorpay ? "ready" : "loading"
  );
  const [attempt, setAttempt] = useState(0);
  // Set once the component is gone, so a slow load cannot call setState after
  // unmount or resurrect a state the customer has navigated away from.
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already loaded — by an earlier visit to this page, or by the attempt
    // before a retry. loadCheckoutJs resolves immediately in that case and the
    // state settles from its .then below rather than synchronously here, which
    // would re-render every mount for nothing.
    let timedOut = false;
    // A stalled request can leave a script tag pending indefinitely. After this
    // the button stops claiming to be loading and offers a retry instead.
    const timer = setTimeout(() => {
      timedOut = true;
      if (!cancelled.current && !window.Razorpay) setState("error");
    }, LOAD_TIMEOUT_MS);

    loadCheckoutJs()
      .then(() => {
        if (!cancelled.current && !timedOut) setState("ready");
      })
      .catch(() => {
        if (!cancelled.current && !timedOut) setState("error");
      })
      .finally(() => clearTimeout(timer));

    return () => clearTimeout(timer);
  }, [attempt]);

  /** Re-attempt after a failure, without reloading the page. */
  const retry = useCallback(() => {
    setState("loading");
    setAttempt((n) => n + 1);
  }, []);

  /**
   * Awaited at click time, so a customer who taps the moment the page settles
   * is not turned away for something that is one await from being ready.
   *
   * Returns false only when checkout.js genuinely cannot be had, which is when
   * the error banner is the honest thing to show.
   */
  const ensureReady = useCallback(async () => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setState("ready");
      return true;
    }
    try {
      await loadCheckoutJs();
      if (!cancelled.current) setState("ready");
      return true;
    } catch {
      if (!cancelled.current) setState("error");
      return false;
    }
  }, []);

  return { state, isReady: state === "ready", retry, ensureReady };
}

/**
 * Resolves when window.Razorpay exists, rejects when it cannot be loaded.
 *
 * Reuses a tag that is already in the document rather than adding a second
 * one — including the awkward case where that tag finished loading between the
 * querySelector and the listeners being attached.
 */
function loadCheckoutJs(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("not a browser"));
  }
  if (window.Razorpay) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${CHECKOUT_JS}"]`
  );

  if (existing) {
    return new Promise<void>((resolve, reject) => {
      const done = () =>
        window.Razorpay ? resolve() : reject(new Error("checkout.js loaded without Razorpay"));
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("checkout.js failed")),
        { once: true }
      );
      // It may already have finished; the listeners above would never fire.
      if (window.Razorpay) resolve();
    });
  }

  return new Promise<void>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = CHECKOUT_JS;
    tag.async = true;
    tag.onload = () =>
      window.Razorpay ? resolve() : reject(new Error("checkout.js loaded without Razorpay"));
    tag.onerror = () => reject(new Error("checkout.js failed"));
    document.head.appendChild(tag);
  });
}
