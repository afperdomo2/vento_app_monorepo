/**
 * Order status values matching the backend OrderStatus enum.
 */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

/**
 * Order DTO matching the backend OrderDto.
 * Raw shape returned by the API — no UI-specific fields.
 */
export interface Order {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
