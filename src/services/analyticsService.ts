import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface AnalyticsSummary {
  days: number;
  totalEvents: number;
  uniqueSessions: number;
  uniqueUsers: number;
  eventCounts: Record<string, number>;
  funnel: {
    productViews: number;
    addToCarts: number;
    checkoutStarts: number;
    ordersPlaced: number;
  };
}

export interface TopProductRow {
  slug: string;
  productId: string;
  views: number;
  addToCarts: number;
}

export const getAnalyticsSummary = async (days = 30): Promise<AnalyticsSummary> => {
  const { data } = await api.get<ApiResponse<AnalyticsSummary>>(
    "/api/v1/admin/analytics/summary",
    { params: { days } }
  );
  return data.data;
};

export const getTopProducts = async (days = 30, limit = 10): Promise<TopProductRow[]> => {
  const { data } = await api.get<ApiResponse<TopProductRow[]>>(
    "/api/v1/admin/analytics/top-products",
    { params: { days, limit } }
  );
  return data.data;
};
