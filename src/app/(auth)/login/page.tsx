"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { PhoneAuthFlow } from "@/components/auth/PhoneAuthFlow";

function LoginFlow() {
  const searchParams = useSearchParams();
  return (
    <PhoneAuthFlow
      title="Sign in"
      description="Enter your mobile number and we'll send you a code."
      redirectTo={searchParams.get("redirect") ?? "/"}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-muted shimmer-base" />}>
      <LoginFlow />
    </Suspense>
  );
}
