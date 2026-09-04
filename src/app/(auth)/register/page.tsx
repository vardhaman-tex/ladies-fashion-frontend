"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { PhoneAuthFlow } from "@/components/auth/PhoneAuthFlow";

/**
 * The same flow as /login, because signing in and signing up are the same act
 * now — the number decides which one it turns out to be. This route stays for
 * the links and bookmarks that already point at it.
 */
function RegisterFlow() {
  const searchParams = useSearchParams();
  return (
    <PhoneAuthFlow
      title="Create an account"
      description="Enter your mobile number to get started. No password to remember."
      redirectTo={searchParams.get("redirect") ?? "/"}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-muted shimmer-base" />}>
      <RegisterFlow />
    </Suspense>
  );
}
