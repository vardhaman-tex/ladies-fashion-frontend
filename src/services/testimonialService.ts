import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface Testimonial {
  id: string;
  customerName: string;
  location: string | null;
  productSlug: string | null;
  body: string;
  /** Only when the customer gave one. */
  rating: number | null;
  /** Where it came from, e.g. "WhatsApp". */
  source: string;
  receivedOn: string | null;
}

export async function getTestimonials(params: {
  productSlug?: string;
  limit?: number;
} = {}): Promise<Testimonial[]> {
  const { data } = await api.get<ApiResponse<Testimonial[]>>("/api/v1/testimonials", { params });
  return data.data;
}
