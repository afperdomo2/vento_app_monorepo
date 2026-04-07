import { BackendEvent, Event } from '../models/event.models';
import { formatDate, formatTime, formatCurrency } from '../format/format';

/**
 * Event Image Mapping
 * Maps event characteristics to placeholder images from Unsplash
 */
const EVENT_IMAGE_MAP: Record<string, string> = {
  tecnología: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
  música: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=600&fit=crop',
  arte: 'https://images.unsplash.com/photo-1545989253-02cc26577f88?w=800&h=600&fit=crop',
  deportes:
    'https://images.unsplash.com/photo-1461896836934-voices-407b0e3b1d47?w=800&h=600&fit=crop',
  gastronomía: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
  cine: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
};

/**
 * Default fallback image for events without a matching category
 */
const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';

/**
 * Category keywords for automatic classification
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Tecnología: [
    'tecnología',
    'tech',
    'ia',
    'inteligencia artificial',
    'software',
    'digital',
    'innovación',
  ],
  Música: ['música', 'concierto', 'banda', 'jazz', 'rock', 'festival'],
  Arte: ['arte', 'exposición', 'museo', 'galería', 'pintura', 'escultura'],
  Deportes: ['deportes', 'fútbol', 'carrera', 'maratón', 'competencia'],
  Gastronomía: ['gastronomía', 'comida', 'restaurante', 'cata', 'vinos'],
  Cine: ['cine', 'película', 'festival de cine', 'estreno'],
  Networking: ['networking', 'negocios', 'emprendimiento', 'startup'],
};

/**
 * Legacy aliases for backward compatibility.
 * New code should import directly from core/format/format.ts
 */
/** @deprecated Use formatDate from core/format/format.ts */
export function formatEventDate(isoString: string): string {
  return formatDate(isoString);
}

/** @deprecated Use formatTime from core/format/format.ts */
export function formatEventTime(isoString: string): string {
  return formatTime(isoString);
}

/** @deprecated Use formatCurrency from core/format/format.ts */
export function formatEventPrice(price: number): string {
  return formatCurrency(price);
}

/**
 * Guess event category based on name, description, and venue
 */
export function guessEventCategory(name: string, description: string, venue: string): string {
  const text = `${name.toLowerCase()} ${description.toLowerCase()} ${venue.toLowerCase()}`;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return 'General';
}

/**
 * Get event image URL based on category
 */
export function getEventImageUrl(category: string): string {
  const normalizedCategory = category.toLowerCase();

  // Check direct category match
  for (const [key, url] of Object.entries(EVENT_IMAGE_MAP)) {
    if (normalizedCategory.includes(key)) {
      return url;
    }
  }

  return DEFAULT_EVENT_IMAGE;
}

/**
 * Map a single backend event to frontend format
 */
export function mapBackendEventToEvent(backendEvent: BackendEvent): Event {
  const category = guessEventCategory(
    backendEvent.name,
    backendEvent.description,
    backendEvent.venue,
  );

  return {
    id: backendEvent.id,
    title: backendEvent.name,
    description: backendEvent.description || '',
    date: formatEventDate(backendEvent.eventDate),
    time: formatEventTime(backendEvent.eventDate),
    location: backendEvent.venue,
    price: backendEvent.price,
    imageUrl: getEventImageUrl(category),
    category,
    isSoldOut: backendEvent.availableTickets === 0,
    ticketsLeft: backendEvent.availableTickets ?? undefined,
    rawEventDate: backendEvent.eventDate,
    latitude: backendEvent.latitude ?? undefined,
    longitude: backendEvent.longitude ?? undefined,
  };
}

/**
 * Map an array of backend events to frontend format
 */
export function mapBackendEventsToEvents(backendEvents: BackendEvent[]): Event[] {
  return backendEvents.map((event) => mapBackendEventToEvent(event));
}
