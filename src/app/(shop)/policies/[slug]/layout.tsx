import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, webPageSchema } from "@/lib/schema";
import { getPolicyServer } from "@/lib/server-api";
import { SITE_NAME, metaDescriptionFrom } from "@/lib/seo";

/**
 * Policy pages carry no keyword value, but they are a first-order trust
 * signal: E-E-A-T assessment and AI answer engines both look for a reachable,
 * dated returns/privacy/terms set before treating a store as legitimate. They
 * get real titles, canonicals and a dateModified rather than inheriting the
 * site default.
 *
 * The page body itself is client-rendered, so metadata lives in this layout
 * where a server fetch is available.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = await getPolicyServer(slug);

  if (!policy || !policy.visible) {
    return {
      title: "Page not found",
      robots: { index: false, follow: true },
    };
  }

  const description = metaDescriptionFrom(
    policy.content,
    `${policy.title} for ${SITE_NAME}.`
  );

  return {
    title: policy.title,
    description,
    alternates: { canonical: `/policies/${policy.slug}` },
    openGraph: {
      title: `${policy.title} | ${SITE_NAME}`,
      description,
      url: `/policies/${policy.slug}`,
      type: "article",
      ...(policy.updatedAt ? { modifiedTime: policy.updatedAt } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function PolicyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = await getPolicyServer(slug);

  return (
    <>
      {policy?.visible && (
        <JsonLd
          data={[
            webPageSchema({
              name: policy.title,
              description: metaDescriptionFrom(policy.content, policy.title),
              path: `/policies/${policy.slug}`,
              dateModified: policy.updatedAt,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: policy.title },
            ]),
          ]}
        />
      )}
      {children}
    </>
  );
}
