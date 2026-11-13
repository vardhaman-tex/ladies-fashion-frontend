"use client";

import { Suspense } from "react";
import { usePromoToken } from "@/hooks/usePromoToken";

function PromoTokenReader() {
  usePromoToken();
  return null;
}

export function PromoInit() {
  return (
    <Suspense fallback={null}>
      <PromoTokenReader />
    </Suspense>
  );
}
