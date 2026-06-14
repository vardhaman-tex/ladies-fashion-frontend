"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { getPolicyBySlug } from "@/services/policyService";
import { Button } from "@/components/ui/button";

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: policy, isLoading, isError } = useQuery({
    queryKey: ["policy", slug],
    queryFn: () => getPolicyBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !policy) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-semibold">Page not found</h1>
        <p className="mb-6 text-muted-foreground">This policy page doesn&apos;t exist or is unavailable.</p>
        <Button render={<Link href="/" />}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to store
      </Link>

      <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">{policy.title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: {new Date(policy.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      {/* Render content — if it contains HTML tags, render as HTML; otherwise as plain text */}
      {policy.content.includes("<") ? (
        <div
          className="[&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:font-semibold [&_p]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_li]:text-sm [&_li]:text-muted-foreground [&_a]:text-rose-600 [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: policy.content }}
        />
      ) : (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {policy.content}
        </div>
      )}
    </div>
  );
}
