import { inject, Injectable, signal, computed } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { EventService, Event, PagedResponse } from '../../../core/services/event.service';

/**
 * Query parameters for events API
 */
interface EventsQuery {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Events state for infinite scroll
 */
interface EventsState {
  events: Event[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  totalElements: number;
  error: string | null;
  filters: EventsQuery;
}

const initialState: EventsState = {
  events: [],
  loading: false,
  loadingMore: false,
  hasMore: true,
  currentPage: 0,
  totalElements: 0,
  error: null,
  filters: {
    page: 0,
    size: 12, // Load 12 events at a time
    sortBy: 'eventDate',
    sortDir: 'ASC',
  },
};

@Injectable({
  providedIn: 'root',
})
export class EventsListService {
  private eventService = inject(EventService);

  private state = signal<EventsState>(initialState);
  private scrollPosition = 0;

  // Save scroll position before navigating away
  saveScrollPosition(): void {
    this.scrollPosition = window.scrollY;
  }

  // Restore scroll position when coming back
  restoreScrollPosition(): void {
    if (this.scrollPosition > 0) {
      // Use smooth scrolling for better UX
      window.scrollTo({
        top: this.scrollPosition,
        behavior: 'smooth'
      });
    }
  }

  // Clear scroll position (when loading new events)
  clearScrollPosition(): void {
    this.scrollPosition = 0;
  }

  // Public signals for components
  readonly events = computed(() => this.state().events);
  readonly loading = computed(() => this.state().loading);
  readonly loadingMore = computed(() => this.state().loadingMore);
  readonly hasMore = computed(() => this.state().hasMore);
  readonly totalElements = computed(() => this.state().totalElements);
  readonly error = computed(() => this.state().error);
  readonly currentPage = computed(() => this.state().currentPage);

  // Load initial events (resets existing list)
  loadEvents(): void {
    this.state.update(s => ({ ...s, loading: true, error: null, events: [], currentPage: 0 }));

    const query = this.buildQuery(0);

    this.eventService.listEvents(query).pipe(
      tap(response => {
        this.state.update(s => ({
          ...s,
          events: response.content,
          currentPage: response.number,
          totalElements: response.totalElements,
          hasMore: !response.last,
          loading: false,
        }));
      }),
      catchError(this.handleError)
    ).subscribe();
  }

  // Load more events (append to existing list)
  loadMore(): void {
    if (this.state().loading || this.state().loadingMore || !this.state().hasMore) {
      return;
    }

    const nextPage = this.state().currentPage + 1;
    this.state.update(s => ({ ...s, loadingMore: true }));

    const query = this.buildQuery(nextPage);

    this.eventService.listEvents(query).pipe(
      tap(response => {
        this.state.update(s => ({
          ...s,
          events: [...s.events, ...response.content],
          currentPage: response.number,
          hasMore: !response.last,
          loadingMore: false,
        }));
      }),
      catchError(this.handleError)
    ).subscribe();
  }

  // Apply filters and reload
  applyFilters(filters: Partial<EventsQuery>): void {
    this.state.update(s => ({
      ...s,
      filters: { ...s.filters, ...filters },
    }));

    // Reset and reload
    this.loadEvents();
  }

  // Reset all filters
  resetFilters(): void {
    this.state.update(s => ({
      ...s,
      filters: {
        page: 0,
        size: 12,
        sortBy: 'eventDate',
        sortDir: 'ASC',
      },
    }));

    this.loadEvents();
  }

  // Get current filters
  getFilters(): EventsQuery {
    return { ...this.state().filters };
  }

  // Build query parameters
  private buildQuery(page: number): EventsQuery {
    const filters = this.state().filters;
    const query: EventsQuery = {
      page,
      size: filters.size,
      sortBy: filters.sortBy || 'eventDate',
      sortDir: filters.sortDir || 'ASC',
    };

    // Add category filter if present (for future implementation)
    if (filters.category && filters.category !== 'all') {
      // Backend may not support category filter yet
    }

    // Add price filters if present (for future implementation)
    if (filters.minPrice !== undefined) {
      query.minPrice = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      query.maxPrice = filters.maxPrice;
    }

    return query;
  }

  // Handle errors
  private handleError(error: any): Observable<never> {
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
          errorMessage = 'No se encontraron eventos';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error: ${error.status}`;
      }
    }

    console.error('EventsListService error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
