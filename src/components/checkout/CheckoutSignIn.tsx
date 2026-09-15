"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { requestOtp, verifyOtp } from "@/services/authService";
import type { AuthResponse, OtpRequestedResponse } from "@/types/auth";

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

/** Where the code went, in words the customer can act on. */
function channelLine(channel: OtpRequestedResponse["channel"], masked: string): string {
  const number = `••••${masked.slice(-4)}`;
  if (channel === "WHATSAPP") return `We sent a 6-digit code on WhatsApp to ${number}.`;
  if (channel === "SMS") return `We sent a 6-digit code by SMS to ${number}.`;
  return `We could not send a code to ${number} just now.`;
}

/**
 * The way out of "this number already has an account", offered where the
 * customer hit it.
 *
 * Guest checkout keys a customer by their phone number, and a number that
 * belongs to a registered account cannot be one — letting it through would
 * mean anyone who knows your number can write to your account. So the order is
 * refused, and until now that refusal was a toast at the end of a filled-in
 * checkout: a dead end, at the worst possible moment, for a customer who had
 * done nothing wrong.
 *
 * Signing in is the thing that actually unblocks them, so it happens here
 * rather than on another page. The number is already known and already proven
 * to own an account, so a code sent to it is both the fastest way through and a
 * stronger check than guest checkout performs at all.
 *
 * Deliberately not a "wrong number?" escape hatch: the number came from the
 * address form above, and that is where it should be corrected.
 */
export function CheckoutSignIn({
  phone,
  onVerified,
  disabled,
}: {
  /** Bare digits, as the address form normalised them. */
  phone: string;
  /**
   * The code checked out and the session cookies are set. The caller adopts
   * the session itself, once it has moved anything that would otherwise be
   * lost — which is why this hands back the user rather than storing it.
   */
  onVerified: (user: AuthResponse) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [challenge, setChallenge] = useState<OtpRequestedResponse | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Sending is a side effect with a cost — a WhatsApp message — so it happens
  // exactly once per mount, not once per render and not twice under StrictMode.
  const sent = useRef(false);

  async function sendCode(resending = false) {
    setBusy(true);
    setError(null);
    try {
      const requested = await requestOtp(phone);
      setChallenge(requested);
      setResendIn(requested.resendAfterSeconds);
      if (resending) setCode("");
    } catch (err) {
      setError(errorMessage(err, "We could not send a code. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void sendCode();
    // Sends for the number this panel was opened with. A different number
    // means a different panel, because the address step was reopened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  // One tick at a time. A timeout rather than an interval so nothing keeps
  // firing after the countdown reaches zero.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function submitCode(submitted: string) {
    if (!challenge || submitted.length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await verifyOtp({ challengeId: challenge.challengeId, code: submitted });
      if (!result.user) {
        // Only reachable if the account vanished between the order attempt and
        // now. Saying so beats a spinner that never resolves.
        setError("That number has no account any more. Please refresh and try again.");
        return;
      }
      await onVerified(result.user);
    } catch (err) {
      setCode("");
      setError(errorMessage(err, "That code did not work. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  const locked = busy || disabled;

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
      <div className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">You already have an account with this number</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {challenge
              ? channelLine(challenge.channel, challenge.maskedMobile)
              : "Sending you a code to sign in…"}
          </p>
        </div>
      </div>

      <form
        className="mt-3 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submitCode(code);
        }}
      >
        <OtpCodeInput
          value={code}
          onChange={(next) => {
            setCode(next);
            if (error) setError(null);
          }}
          onComplete={(complete) => void submitCode(complete)}
          disabled={locked || !challenge}
          invalid={Boolean(error)}
          autoFocus
        />

        {error && (
          <p className="text-center text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full gap-2 bg-rose-600 hover:bg-rose-700"
          disabled={locked || !challenge || code.length < 6}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Checking…" : "Verify and continue"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {resendIn > 0 ? (
            `Resend in ${resendIn}s`
          ) : (
            <button
              type="button"
              onClick={() => void sendCode(true)}
              disabled={locked}
              className="inline-flex items-center gap-1 font-medium text-rose-600 underline underline-offset-2"
            >
              <RefreshCw className="size-3" />
              Resend code
            </button>
          )}
        </p>
      </form>
    </div>
  );
}
