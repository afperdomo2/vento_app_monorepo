import { Order, OrderStatus } from '../../../core/models/order.models';

export type { Order, OrderStatus };

/**
 * Order enriched with event display data.
 * A UI-level construct: combines the raw Order DTO with mapped Event fields
 * so that the template never has to make separate lookups.
 */
export interface EnrichedOrder extends Order {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventImageUrl: string;
  eventPrice: string;
}

/**
 * UI state for the orders list page (/my-orders).
 */
export interface OrdersState {
  orders: EnrichedOrder[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

/**
 * UI state for the order detail page (/my-orders/:id).
 */
export interface OrderDetailState {
  order: EnrichedOrder | null;
  isLoading: boolean;
  error: string | null;
}

export const initialOrdersState: OrdersState = {
  orders: [],
  isLoading: false,
  error: null,
  currentPage: 0,
  totalPages: 0,
  totalElements: 0,
  pageSize: 10,
};

export const initialOrderDetailState: OrderDetailState = {
  order: null,
  isLoading: false,
  error: null,
};
