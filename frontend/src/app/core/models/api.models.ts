/**
 * Universal API response envelope matching the backend ApiResponse<T>.
 * All HTTP services should use this wrapper when deserializing responses.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string>;
}

/**
 * Paginated response shape returned by Spring Data Page<T>.
 * Matches the serialized Page<T> JSON from the backend.
 */
export interface PagedResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}
