export interface BackendEvent {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  venue: string;
  totalCapacity: number;
  availableTickets: number | null;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: string | number;
  imageUrl: string;
  category: string;
  isSoldOut?: boolean;
  ticketsLeft?: number;
}

export interface ListEventsParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: string;
  search?: string;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  eventDate: string; // ISO LocalDateTime string
  venue: string;
  totalCapacity: number;
  price: number;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  eventDate?: string; // ISO LocalDateTime string
  venue?: string;
  totalCapacity?: number;
  price?: number;
}

export interface BackendEvent {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  venue: string;
  totalCapacity: number;
  availableTickets: number | null;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}
