import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      {/* Back to store link */}
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to store
      </Link>

      <div className="flex flex-col items-center gap-1.5">
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
          Vardhman Textile
        </Link>
        <span className="text-sm text-muted-foreground">Style that speaks for you</span>
      </div>

      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
