/**
 * Generic API response wrapper shape returned by the backend for all
 * successful requests.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Generic paginated response wrapper shape returned by the backend for
 * paginated list endpoints.
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/**
 * Error response shape returned by the backend for failed requests.
 */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  errors?: string[];
}
