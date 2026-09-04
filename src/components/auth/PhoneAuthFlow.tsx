"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2, MessageCircle, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import {
  completeSignup,
  getMe,
  login,
  requestOtp,
  verifyOtp,
} from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { isIndianMobile, normalisePhone } from "@/lib/phone";
import type { ApiError } from "@/types/api";
import type { AuthResponse, OtpRequestedResponse } from "@/types/auth";

type Step = "phone" | "code" | "profile" | "password";

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError<ApiError>(error)
    ? error.response?.data?.message ?? fallback
    : fallback;
}

/** Where the code went, in words the customer can act on. */
function channelLine(channel: OtpRequestedResponse["channel"], masked: string): string {
  const number = `••••${masked.slice(-4)}`;
  if (channel === "WHATSAPP") return `Sent on WhatsApp to ${number}`;
  if (channel === "SMS") return `Sent by SMS to ${number}`;
  // NONE means nothing is configured to deliver it. Saying "sent" would be a
  // lie the customer would wait on.
  return `We could not send a code to ${number} just now.`;
}

/**
 * Sign in and sign up, both by one-time code.
 *
 * One flow serves both because until the code is verified there is no way to
 * know which one this is — and deliberately so: announcing at the phone step
 * whether a number is registered is what makes phone-number enumeration worth
 * running. A known number lands straight in the shop; an unknown one is asked
 * for a name, and only then.
 *
 * The password step is still here, unadvertised until asked for, because
 * accounts that predate this have a password and may no longer have the phone
 * number attached to them.
 */
export function PhoneAuthFlow({
  title,
  description,
  redirectTo,
}: {
  title: string;
  description: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [step, setStep] = useState<Step>("phone");
  const [busy, setBusy] = useState(false);

  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState<string | null>(null);

  const [challenge, setChallenge] = useState<OtpRequestedResponse | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "" });
  const [profileError, setProfileError] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // One tick at a time. A timeout rather than an interval so nothing keeps
  // firing after the countdown reaches zero.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  /**
   * Adopts the session the server just set as cookies. Reads the profile back
   * rather than believing the auth response, which carries no verification
   * flags — and those are the whole point of having just proven the number.
   */
  async function adoptSession(fallback: AuthResponse) {
    try {
      setUser(await getMe());
    } catch {
      setUser({
        id: fallback.id,
        firstName: fallback.firstName,
        lastName: fallback.lastName,
        email: fallback.email,
        isEmailVerified: false,
        isMobileVerified: true,
        roles: fallback.roles,
      });
    }
  }

  async function sendCode(resending = false) {
    if (!isIndianMobile(mobile)) {
      setMobileError("Enter a valid 10-digit mobile number.");
      return;
    }
    setMobileError(null);
    setBusy(true);
    try {
      const requested = await requestOtp(normalisePhone(mobile));
      setChallenge(requested);
      setResendIn(requested.resendAfterSeconds);
      setCode("");
      setCodeError(null);
      setStep("code");
      if (resending) toast.success("New code sent.");
    } catch (error) {
      const message = errorMessage(error, "Could not send a code. Please try again.");
      if (step === "code") setCodeError(message);
      else setMobileError(message);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(submitted: string) {
    if (!challenge || submitted.length < 6) {
      setCodeError("Enter the 6-digit code.");
      return;
    }
    setCodeError(null);
    setBusy(true);
    try {
      const result = await verifyOtp({ challengeId: challenge.challengeId, code: submitted });
      if (result.requiresProfile && result.registrationToken) {
        setRegistrationToken(result.registrationToken);
        setStep("profile");
        return;
      }
      if (result.user) {
        await adoptSession(result.user);
        toast.success("Welcome back!");
        router.push(redirectTo);
      }
    } catch (error) {
      setCode("");
      setCodeError(errorMessage(error, "That code did not work. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function submitProfile() {
    if (!registrationToken) return;
    if (!profile.firstName.trim()) {
      setProfileError("Enter your name so we know who to address the order to.");
      return;
    }
    setProfileError(null);
    setBusy(true);
    try {
      const created = await completeSignup({
        registrationToken,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim() || undefined,
        email: profile.email.trim() || undefined,
      });
      await adoptSession(created);
      toast.success("Account created.");
      router.push(redirectTo);
    } catch (error) {
      setProfileError(errorMessage(error, "Could not create your account. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword() {
    setBusy(true);
    try {
      const authenticated = await login({ identifier: identifier.trim(), password });
      await adoptSession(authenticated);
      toast.success("Welcome back!");
      router.push(redirectTo);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to log in. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{step === "profile" ? "Almost there" : title}</CardTitle>
        <CardDescription>
          {step === "profile"
            ? "Your number is verified. What should we call you?"
            : step === "password"
              ? "Sign in with the password on your existing account."
              : description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === "phone" && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void sendCode();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="auth-mobile">Mobile number</Label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  id="auth-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  autoFocus
                  placeholder="98765 43210"
                  value={mobile}
                  disabled={busy}
                  aria-invalid={mobileError ? true : undefined}
                  aria-describedby={mobileError ? "auth-mobile-error" : undefined}
                  onChange={(event) => {
                    setMobile(event.target.value);
                    if (mobileError) setMobileError(null);
                  }}
                />
              </div>
              {mobileError && (
                <p id="auth-mobile-error" className="text-xs font-medium text-red-600 dark:text-red-400">
                  {mobileError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                We&apos;ll send a 6-digit code to confirm it&apos;s you. No password needed.
              </p>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              {busy ? "Sending code…" : "Send code"}
            </Button>
          </form>
        )}

        {step === "code" && challenge && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitCode(code);
            }}
          >
            <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-rose-600" />
              <span>
                {channelLine(challenge.channel, challenge.maskedMobile)}{" "}
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="font-medium text-rose-600 underline underline-offset-2"
                >
                  Change number
                </button>
              </span>
            </div>

            <OtpCodeInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (codeError) setCodeError(null);
              }}
              onComplete={(complete) => void submitCode(complete)}
              disabled={busy}
              invalid={Boolean(codeError)}
              autoFocus
            />

            {codeError && (
              <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                {codeError}
              </p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={busy || code.length < 6}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Checking…" : "Verify and continue"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {resendIn > 0 ? (
                `Resend in ${resendIn}s`
              ) : (
                <button
                  type="button"
                  onClick={() => void sendCode(true)}
                  disabled={busy}
                  className="font-medium text-rose-600 underline underline-offset-2"
                >
                  Resend code
                </button>
              )}
            </p>
          </form>
        )}

        {step === "profile" && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitProfile();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="auth-first">First name</Label>
                <Input
                  id="auth-first"
                  autoComplete="given-name"
                  autoFocus
                  placeholder="Priya"
                  value={profile.firstName}
                  disabled={busy}
                  onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auth-last">
                  Last name <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="auth-last"
                  autoComplete="family-name"
                  placeholder="Sharma"
                  value={profile.lastName}
                  disabled={busy}
                  onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-email">
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={profile.email}
                disabled={busy}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Only used for order receipts. Your mobile number is your sign-in.
              </p>
            </div>

            {profileError && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{profileError}</p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Creating account…" : "Create account"}
            </Button>
          </form>
        )}

        {step === "password" && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitPassword();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="auth-identifier">Phone or email</Label>
              <Input
                id="auth-identifier"
                autoComplete="username"
                autoFocus
                placeholder="9876543210 or you@example.com"
                value={identifier}
                disabled={busy}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <div className="relative">
                <Input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  value={password}
                  disabled={busy}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="flex w-full items-center justify-center gap-1 text-sm font-medium text-rose-600"
            >
              <ArrowLeft className="size-3.5" /> Back to sign in with a code
            </button>
          </form>
        )}

        {/* Offered rather than advertised: an account created before this
            existed still has a password, and its owner may no longer have the
            number attached to it. */}
        {step === "phone" && (
          <p className="text-center text-sm text-muted-foreground">
            Have an older account?{" "}
            <button
              type="button"
              onClick={() => setStep("password")}
              className="font-medium text-rose-600 underline underline-offset-2"
            >
              Sign in with a password
            </button>
          </p>
        )}

        {step === "phone" && (
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/policies/terms-conditions" className="underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/policies/privacy-policy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
