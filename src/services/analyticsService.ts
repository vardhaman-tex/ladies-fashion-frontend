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

export interface DailyCountRow {
  date: string;
  count: number;
}

export interface UserActivityRow {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  eventCount: number;
  lastSeen: string;
}

export const getDailyBreakdown = async (days = 30): Promise<DailyCountRow[]> => {
  const { data } = await api.get<ApiResponse<DailyCountRow[]>>(
    "/api/v1/admin/analytics/daily",
    { params: { days } }
  );
  return data.data;
};

export const getTopUsers = async (days = 30, limit = 20): Promise<UserActivityRow[]> => {
  const { data } = await api.get<ApiResponse<UserActivityRow[]>>(
    "/api/v1/admin/analytics/users",
    { params: { days, limit } }
  );
  return data.data;
};
