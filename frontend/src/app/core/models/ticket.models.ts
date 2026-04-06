export type TicketStatus = 'ACTIVE' | 'CANCELLED' | 'USED';

export interface Ticket {
  id: string;
  eventId: string;
  orderId: string;
  userId: string;
  accessCode: string;
  status: TicketStatus;
  createdAt: string;
}
