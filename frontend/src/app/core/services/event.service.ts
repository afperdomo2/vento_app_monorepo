import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { getEnvValue } from '../../../environments/env.config';

/**
 * API URL configuration
 * Uses environment variable from window.__env (injected via index.html)
 */
const API_URL = getEnvValue('API_URL');

/**
 * Backend Event DTO from API
 */
interface BackendEvent {
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

/**
 * Frontend Event interface
 */
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

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * Paginated response from API
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

/**
 * Query parameters for listing events
 */
interface ListEventsParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/api/events`;

  /**
   * Get featured events
   * @param limit Maximum number of events to return (default: 6, min: 6, max: 20)
   */
  getFeaturedEvents(limit: number = 6): Observable<Event[]> {
    // Ensure limit is between 6 and 20
    const safeLimit = Math.max(6, Math.min(20, limit));

    return this.http.get<ApiResponse<BackendEvent[]>>(
      `${this.apiUrl}/featured?limit=${safeLimit}`
    ).pipe(
      map(response => this.mapEvents(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * List all events with pagination
   * @param params Query parameters (page, size, sortBy, sortDir, search)
   */
  listEvents(params: ListEventsParams): Observable<PagedResponse<Event>> {
    const queryParams: Record<string, string | number> = {
      page: params.page,
      size: params.size,
      sortBy: params.sortBy || 'eventDate',
      sortDir: params.sortDir || 'ASC',
    };

    // Add search parameter if present
    if (params.search && params.search.trim()) {
      queryParams['search'] = params.search.trim();
    }

    return this.http.get<ApiResponse<PagedResponse<BackendEvent>>>(
      this.apiUrl,
      { params: queryParams }
    ).pipe(
      map(response => ({
        ...response.data,
        content: this.mapEvents(response.data.content),
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Get event by ID
   * @param id Event UUID
   */
  getEventById(id: string): Observable<Event> {
    return this.http.get<ApiResponse<BackendEvent>>(
      `${this.apiUrl}/${id}`
    ).pipe(
      map(response => this.mapEvents([response.data])[0]),
      catchError(this.handleError)
    );
  }

  /**
   * Map backend events to frontend format
   */
  private mapEvents(backendEvents: BackendEvent[]): Event[] {
    return backendEvents.map(event => ({
      id: event.id,
      title: event.name,
      description: event.description || '',
      date: this.formatDate(event.eventDate),
      time: this.formatTime(event.eventDate),
      location: event.venue,
      price: this.formatPrice(event.price),
      imageUrl: this.getEventImageUrl(event),
      category: this.guessCategory(event),
      isSoldOut: event.availableTickets === 0,
      ticketsLeft: event.availableTickets ?? undefined,
    }));
  }

  /**
   * Format date from ISO string to readable format
   */
  private formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Format time from ISO string to readable format
   */
  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format price as currency string
   */
  private formatPrice(price: number): string {
    if (price === 0) {
      return 'Gratis';
    }
    return `$${price.toFixed(2)}`;
  }

  /**
   * Get a placeholder image based on event characteristics
   */
  private getEventImageUrl(event: BackendEvent): string {
    // Use different Unsplash images based on event type/category
    const category = this.guessCategory(event).toLowerCase();
    
    const imageMap: Record<string, string> = {
      'tecnología': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
      'música': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=600&fit=crop',
      'arte': 'https://images.unsplash.com/photo-1545989253-02cc26577f88?w=800&h=600&fit=crop',
      'deportes': 'https://images.unsplash.com/photo-1461896836934- voices-407b0e3b1d47?w=800&h=600&fit=crop',
      'gastronomía': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
      'cine': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
    };

    // Find matching category or use default
    for (const [key, url] of Object.entries(imageMap)) {
      if (category.includes(key)) {
        return url;
      }
    }

    // Check description for keywords
    const description = event.description.toLowerCase();
    for (const [key, url] of Object.entries(imageMap)) {
      if (description.includes(key)) {
        return url;
      }
    }

    // Default image
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';
  }

  /**
   * Guess event category based on event data
   */
  private guessCategory(event: BackendEvent): string {
    const name = event.name.toLowerCase();
    const description = event.description.toLowerCase();
    const venue = event.venue.toLowerCase();
    const text = `${name} ${description} ${venue}`;

    const categories: Record<string, string[]> = {
      'Tecnología': ['tecnología', 'tech', 'ia', 'inteligencia artificial', 'software', 'digital', 'innovación'],
      'Música': ['música', 'concierto', 'banda', 'jazz', 'rock', 'festival'],
      'Arte': ['arte', 'exposición', 'museo', 'galería', 'pintura', 'escultura'],
      'Deportes': ['deportes', 'fútbol', 'carrera', 'maratón', 'competencia'],
      'Gastronomía': ['gastronomía', 'comida', 'restaurante', 'cata', 'vinos'],
      'Cine': ['cine', 'película', 'festival de cine', 'estreno'],
      'Networking': ['networking', 'negocios', 'emprendimiento', 'startup'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error al cargar los eventos';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
          break;
        case 404:
          errorMessage = 'No se encontraron eventos destacados';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error: ${error.status}`;
      }
    }

    console.error('EventService error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
