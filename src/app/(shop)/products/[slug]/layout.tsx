import type { Metadata } from "next";

interface ProductMetaSummary {
  name: string;
  description: string | null;
  thumbnail: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
}

async function getProductMeta(slug: string): Promise<ProductMetaSummary | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    const res = await fetch(`${base}/api/v1/products/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductMeta(slug);

  if (!product) {
    return {
      title: "Vardhman Textile",
      description: "Vardhman Textile — Premium Ladies Fashion",
    };
  }

  const title = product.metaTitle ?? product.name;
  const description =
    product.metaDescription ?? product.description ?? "Vardhman Textile — Premium Ladies Fashion";
  const image = product.ogImageUrl ?? product.thumbnail;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 1200, alt: product.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
