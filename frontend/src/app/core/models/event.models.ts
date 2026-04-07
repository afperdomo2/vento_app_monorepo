export interface BackendEvent {
  id: string;
  name: string;
  description: string;
  eventDate: string;
  venue: string;
  totalCapacity: number;
  availableTickets: number | null;
  price: number;
  latitude?: number;
  longitude?: number;
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
  price: number;
  imageUrl: string;
  category: string;
  isSoldOut?: boolean;
  ticketsLeft?: number;
  rawEventDate?: string; // Original ISO string from backend (for editing)
  latitude?: number;
  longitude?: number;
}

export interface ListEventsParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: string;
}

export interface SearchEventsParams {
  page: number;
  size: number;
  q: string;
}

export interface NearbyEventsParams {
  lat: number;
  lon: number;
  distance?: string;
  page: number;
  size: number;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  eventDate: string; // ISO LocalDateTime string
  venue: string;
  totalCapacity: number;
  price: number;
  latitude?: number;
  longitude?: number;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  eventDate?: string; // ISO LocalDateTime string
  venue?: string;
  totalCapacity?: number;
  price?: number;
  latitude?: number;
  longitude?: number;
}
