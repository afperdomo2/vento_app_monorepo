import { inject, Injectable, signal, computed } from '@angular/core';
import { EventService } from '../../../core/services/event.service';
import { GeolocationService, GeoPosition } from '../../../core/services/geolocation.service';
import { Event } from '../../../core/models/event.models';

export const RADIUS_OPTIONS = ['1km', '5km', '10km', '25km', '50km'] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

interface NearbyState {
  events: Event[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  totalElements: number;
  error: string | null;
  position: GeoPosition | null;
  radius: RadiusOption;
  permissionDenied: boolean;
}

const initialState: NearbyState = {
  events: [],
  loading: false,
  loadingMore: false,
  hasMore: true,
  currentPage: 0,
  totalElements: 0,
  error: null,
  position: null,
  radius: '10km',
  permissionDenied: false,
};

@Injectable({
  providedIn: 'root',
})
export class NearbyEventsService {
  private eventService = inject(EventService);
  private geolocationService = inject(GeolocationService);

  private state = signal<NearbyState>(initialState);

  readonly events = computed(() => this.state().events);
  readonly loading = computed(() => this.state().loading);
  readonly loadingMore = computed(() => this.state().loadingMore);
  readonly hasMore = computed(() => this.state().hasMore);
  readonly totalElements = computed(() => this.state().totalElements);
  readonly error = computed(() => this.state().error);
  readonly position = computed(() => this.state().position);
  readonly radius = computed(() => this.state().radius);
  readonly permissionDenied = computed(() => this.state().permissionDenied);
  readonly locationLabel = computed(() => {
    const pos = this.state().position;
    if (!pos) return 'Ubicación desconocida';
    return `${pos.lat.toFixed(4)}, ${pos.lon.toFixed(4)}`;
  });

  /**
   * Initializes the nearby events feature by getting the user's location and loading events.
   */
  async initialize(): Promise<void> {
    this.state.update((s) => ({ ...s, loading: true, error: null, events: [] }));

    const position = await this.geolocationService.getCurrentPosition();

    if (!position) {
      const geoError = this.geolocationService.error();
      const isPermissionDenied = geoError?.type === 'permission_denied';

      this.state.update((s) => ({
        ...s,
        loading: false,
        error: geoError?.message || 'No se pudo obtener tu ubicación',
        permissionDenied: isPermissionDenied || false,
        position: null,
      }));
      return;
    }

    this.state.update((s) => ({ ...s, position }));
    this.loadEvents();
  }

  /**
   * Loads events for the current position and radius, resetting the list.
   */
  loadEvents(): void {
    const { position, radius } = this.state();
    if (!position) return;

    this.state.update((s) => ({ ...s, loading: true, error: null, events: [], currentPage: 0 }));

    this.eventService
      .searchNearbyEvents({
        lat: position.lat,
        lon: position.lon,
        distance: radius,
        page: 0,
        size: 12,
      })
      .subscribe({
        next: (pageData) => {
          this.state.update((s) => ({
            ...s,
            events: pageData.content,
            loading: false,
            error: null,
            currentPage: 0,
            totalElements: pageData.totalElements,
            hasMore: pageData.number < pageData.totalPages - 1,
          }));
        },
        error: (err) => {
          this.state.update((s) => ({
            ...s,
            loading: false,
            error: err.message || 'Error al cargar eventos cercanos',
          }));
        },
      });
  }

  /**
   * Loads the next page of events and appends to the existing list (infinite scroll).
   */
  loadMore(): void {
    const { position, radius, currentPage, hasMore, loadingMore } = this.state();
    if (!position || !hasMore || loadingMore) return;

    const nextPage = currentPage + 1;

    this.state.update((s) => ({ ...s, loadingMore: true }));

    this.eventService
      .searchNearbyEvents({
        lat: position.lat,
        lon: position.lon,
        distance: radius,
        page: nextPage,
        size: 12,
      })
      .subscribe({
        next: (pageData) => {
          this.state.update((s) => ({
            ...s,
            events: [...s.events, ...pageData.content],
            loadingMore: false,
            currentPage: pageData.number,
            totalElements: pageData.totalElements,
            hasMore: pageData.number < pageData.totalPages - 1,
          }));
        },
        error: () => {
          this.state.update((s) => ({ ...s, loadingMore: false }));
        },
      });
  }

  /**
   * Changes the search radius and reloads events.
   */
  changeRadius(radius: RadiusOption): void {
    this.state.update((s) => ({ ...s, radius }));
    this.loadEvents();
  }

  /**
   * Refreshes the user's location and reloads events.
   */
  async refreshLocation(): Promise<void> {
    this.state.update((s) => ({ ...s, loading: true, error: null }));

    const position = await this.geolocationService.refreshPosition();

    if (!position) {
      const geoError = this.geolocationService.error();
      const isPermissionDenied = geoError?.type === 'permission_denied';

      this.state.update((s) => ({
        ...s,
        loading: false,
        error: geoError?.message || 'No se pudo obtener tu ubicación',
        permissionDenied: isPermissionDenied || false,
        position: null,
      }));
      return;
    }

    this.state.update((s) => ({ ...s, position, permissionDenied: false }));
    this.loadEvents();
  }

  /**
   * Retries getting location after a permission denial.
   */
  async retryPermission(): Promise<void> {
    this.state.update((s) => ({ ...s, permissionDenied: false, error: null }));
    await this.initialize();
  }

  /**
   * Resets the state to initial values.
   */
  reset(): void {
    this.state.set(initialState);
  }
}
