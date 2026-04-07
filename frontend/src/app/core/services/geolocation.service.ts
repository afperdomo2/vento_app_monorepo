import { Injectable, signal, computed } from '@angular/core';

export interface GeoPosition {
  lat: number;
  lon: number;
}

export interface GeoLocationError {
  code: number;
  message: string;
  type: 'permission_denied' | 'position_unavailable' | 'timeout' | 'unknown';
}

interface GeoState {
  position: GeoPosition | null;
  loading: boolean;
  error: GeoLocationError | null;
}

const STORAGE_KEY = 'vento_last_position';

/**
 * Service to handle browser geolocation API.
 * Uses navigator.geolocation.getCurrentPosition() to get user's location.
 * Works on localhost without HTTPS (browser exception for development).
 * Production requires HTTPS for geolocation to work.
 */
@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  private state = signal<GeoState>({
    position: null,
    loading: false,
    error: null,
  });

  readonly position = computed(() => this.state().position);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly hasPosition = computed(() => this.state().position !== null);

  /**
   * Gets the user's current position from the browser.
   * Checks localStorage for a cached position first (max 5 minutes old).
   *
   * @returns Promise<GeoPosition> or null if permission denied/unavailable
   */
  async getCurrentPosition(): Promise<GeoPosition | null> {
    // Try to get cached position first (max 5 minutes old)
    const cached = this.getCachedPosition();
    if (cached) {
      this.state.update((s) => ({ ...s, position: cached, error: null }));
      return cached;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      const error: GeoLocationError = {
        code: 0,
        message: 'Geolocalización no soportada por tu navegador',
        type: 'position_unavailable',
      };
      this.state.update((s) => ({ ...s, error, loading: false }));
      return null;
    }

    this.state.update((s) => ({ ...s, loading: true, error: null }));

    return new Promise<GeoPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoPosition: GeoPosition = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          // Cache the position
          this.cachePosition(geoPosition);

          this.state.update((s) => ({
            ...s,
            position: geoPosition,
            loading: false,
            error: null,
          }));

          resolve(geoPosition);
        },
        (error) => {
          const geoError = this.mapGeolocationError(error);
          this.state.update((s) => ({
            ...s,
            loading: false,
            error: geoError,
            position: null,
          }));
          resolve(null);
        },
        {
          enableHighAccuracy: false, // Use WiFi/IP (faster, less battery)
          timeout: 10000,            // 10 seconds timeout
          maximumAge: 300000,        // Accept cached position up to 5 min
        },
      );
    });
  }

  /**
   * Forces a fresh position request, ignoring cached position.
   */
  async refreshPosition(): Promise<GeoPosition | null> {
    this.clearCachedPosition();

    if (!navigator.geolocation) {
      const error: GeoLocationError = {
        code: 0,
        message: 'Geolocalización no soportada por tu navegador',
        type: 'position_unavailable',
      };
      this.state.update((s) => ({ ...s, error, loading: false }));
      return null;
    }

    this.state.update((s) => ({ ...s, loading: true, error: null }));

    return new Promise<GeoPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoPosition: GeoPosition = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          this.cachePosition(geoPosition);

          this.state.update((s) => ({
            ...s,
            position: geoPosition,
            loading: false,
            error: null,
          }));

          resolve(geoPosition);
        },
        (error) => {
          const geoError = this.mapGeolocationError(error);
          this.state.update((s) => ({
            ...s,
            loading: false,
            error: geoError,
            position: null,
          }));
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0, // Force fresh request
        },
      );
    });
  }

  /**
   * Manually sets a position (useful for manual location entry in the future).
   */
  setPosition(position: GeoPosition): void {
    this.cachePosition(position);
    this.state.update((s) => ({
      ...s,
      position,
      loading: false,
      error: null,
    }));
  }

  /**
   * Clears the current position and any cached data.
   */
  clearPosition(): void {
    this.clearCachedPosition();
    this.state.update((s) => ({
      ...s,
      position: null,
      loading: false,
      error: null,
    }));
  }

  /**
   * Gets the last cached position from localStorage, if it's still valid (max 5 minutes old).
   */
  getCachedPosition(): GeoPosition | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const { position, timestamp } = JSON.parse(stored);
      const fiveMinutes = 5 * 60 * 1000;
      const now = Date.now();

      if (now - timestamp > fiveMinutes) {
        // Cache expired
        this.clearCachedPosition();
        return null;
      }

      return position as GeoPosition;
    } catch {
      return null;
    }
  }

  private cachePosition(position: GeoPosition): void {
    try {
      const data = {
        position,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore localStorage errors
    }
  }

  private clearCachedPosition(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }

  private mapGeolocationError(error: GeolocationPositionError): GeoLocationError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return {
          code: error.code,
          message: 'Permiso de ubicación denegado. Actívalo en la configuración de tu navegador.',
          type: 'permission_denied',
        };
      case error.POSITION_UNAVAILABLE:
        return {
          code: error.code,
          message: 'No se pudo obtener tu ubicación. Verifica que esté habilitada.',
          type: 'position_unavailable',
        };
      case error.TIMEOUT:
        return {
          code: error.code,
          message: 'Se agotó el tiempo al obtener la ubicación. Intenta de nuevo.',
          type: 'timeout',
        };
      default:
        return {
          code: error.code,
          message: 'Error desconocido al obtener la ubicación.',
          type: 'unknown',
        };
    }
  }
}
