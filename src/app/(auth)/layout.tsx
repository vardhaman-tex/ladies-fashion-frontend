import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-semibold tracking-tight">Ladies Fashion</span>
        <span className="text-sm text-muted-foreground">Style that speaks for you</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
