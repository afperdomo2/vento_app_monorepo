import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatCurrency } from '@core/format/format';
import { Event } from '@core/models/event.models';
import { EventService } from '@core/services/event.service';
import { GeolocationService, GeoPosition } from '@core/services/geolocation.service';

interface NearbySectionState {
  position: GeoPosition | null;
  events: Event[];
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  initialized: boolean;
}

const initialNearbyState: NearbySectionState = {
  position: null,
  events: [],
  loading: false,
  error: null,
  permissionDenied: false,
  initialized: false,
};

@Component({
  selector: 'app-home-nearby-events',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="px-6 py-12 max-w-7xl mx-auto">
      <div
        class="bg-surface-container rounded-xl p-8 flex flex-col lg:flex-row gap-12 items-center"
      >
        <div class="lg:w-1/2">
          <h2 class="text-3xl font-headline font-extrabold mb-6">
            Encuentra eventos cerca de ti
          </h2>
          <p class="text-on-surface-variant mb-8 leading-relaxed">
            Utilizamos tu ubicación para mostrarte los happenings más relevantes en tu zona. Nunca
            te pierdas lo que está ocurriendo a la vuelta de la esquina.
          </p>

          <!-- State: Not Initialized -->
          @if (!nearbyState().initialized && !nearbyState().loading) {
            <button
              (click)="activateLocation()"
              class="kinetic-gradient text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-3 shadow-xl shadow-primary/20"
            >
              <span class="material-symbols-outlined">my_location</span>
              Activar mi ubicación
            </button>
          }

          <!-- State: Loading -->
          @if (nearbyState().loading) {
            <div
              class="flex items-center gap-3 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10"
            >
              <span class="material-symbols-outlined text-primary animate-spin"
                >progress_activity</span
              >
              <div>
                <p class="font-bold text-on-surface">
                  @if (nearbyState().permissionDenied) {
                    Solicitando permiso...
                  } @else {
                    Obteniendo tu ubicación...
                  }
                </p>
                <p class="text-sm text-on-surface-variant">Esto puede tardar unos segundos</p>
              </div>
            </div>
          }

          <!-- State: Permission Denied -->
          @if (nearbyState().permissionDenied && !nearbyState().loading) {
            <div class="space-y-4">
              <div class="p-4 rounded-xl bg-error-container border border-error/20">
                <p class="text-error font-bold text-sm mb-1">Permiso denegado</p>
                <p class="text-error/80 text-xs">
                  No pudimos acceder a tu ubicación. Habilita los permisos en tu navegador.
                </p>
              </div>
              <button
                (click)="activateLocation()"
                class="px-6 py-3 rounded-full font-bold text-primary border-2 border-primary hover:bg-primary/5 transition-colors flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-sm">refresh</span>
                Intentar de nuevo
              </button>
            </div>
          }

          <!-- State: With Position and Events -->
          @if (nearbyState().position && !nearbyState().loading) {
            <div class="space-y-4">
              <div
                class="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10"
              >
                <span
                  class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                >
                  <span class="material-symbols-outlined">location_on</span>
                </span>
                <div class="flex-1">
                  <h4 class="font-bold">Ubicación activa</h4>
                  <p class="text-sm text-on-surface-variant">
                    {{ nearbyState().position!.lat.toFixed(4) }},
                    {{ nearbyState().position!.lon.toFixed(4) }}
                  </p>
                </div>
              </div>

              @if (nearbyState().events.length > 0) {
                <div>
                  <p class="text-sm font-bold text-on-surface-variant mb-3">
                    {{ nearbyState().events.length }} eventos cercanos encontrados
                  </p>
                  <div class="space-y-3">
                    @for (event of nearbyState().events; track event.id) {
                      <div
                        class="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high transition-colors cursor-pointer"
                        [routerLink]="['/events', event.id]"
                      >
                        <img
                          [src]="event.imageUrl"
                          [alt]="event.title"
                          class="w-12 h-12 rounded-lg object-cover"
                        />
                        <div class="flex-1 min-w-0">
                          <p class="font-bold text-sm truncate">{{ event.title }}</p>
                          <p class="text-xs text-on-surface-variant">{{ event.location }}</p>
                        </div>
                        <span class="text-primary font-bold text-sm">
                          {{ formatCurrency(event.price) }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              } @else if (!nearbyState().loading && nearbyState().events.length === 0) {
                <p class="text-sm text-on-surface-variant">
                  No se encontraron eventos cercanos. Intenta aumentar el radio.
                </p>
              }

              <a
                routerLink="/nearby"
                class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 mt-4"
              >
                Ver todos los eventos cercanos
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          }

          <!-- State: Error (generic) -->
          @if (nearbyState().error && !nearbyState().permissionDenied && !nearbyState().loading) {
            <div class="space-y-4">
              <div class="p-4 rounded-xl bg-error-container border border-error/20">
                <p class="text-error font-bold text-sm mb-1">Error</p>
                <p class="text-error/80 text-xs">{{ nearbyState().error }}</p>
              </div>
              <button
                (click)="activateLocation()"
                class="px-6 py-3 rounded-full font-bold text-primary border-2 border-primary hover:bg-primary/5 transition-colors flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-sm">refresh</span>
                Reintentar
              </button>
            </div>
          }
        </div>

        <!-- Map Image -->
        <div class="lg:w-1/2 w-full h-[400px] rounded-xl overflow-hidden relative shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=600&fit=crop"
            alt="Map Location"
            class="w-full h-full object-cover grayscale opacity-50"
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="relative">
              @if (nearbyState().position) {
                <div
                  class="absolute -inset-4 bg-primary rounded-full opacity-20 animate-ping"
                ></div>
              }
              <div
                class="relative w-8 h-8 bg-primary rounded-full border-4 border-surface flex items-center justify-center shadow-lg"
              >
                <div class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HomeNearbyEvents {
  private eventService = inject(EventService);
  private geolocationService = inject(GeolocationService);

  // Expose format function to template
  readonly formatCurrency = formatCurrency;

  nearbyState = signal<NearbySectionState>(initialNearbyState);

  constructor() {
    this.tryLoadNearbyPreview();
  }

  /**
   * Tries to load a preview of nearby events if there's a cached position.
   * Doesn't ask for permission if not available (silent fail).
   */
  private tryLoadNearbyPreview(): void {
    const cached = this.geolocationService.getCachedPosition();
    if (!cached) return;

    this.loadNearbyEvents(cached);
  }

  /**
   * Activates location by requesting permission and loading nearby events.
   */
  async activateLocation(): Promise<void> {
    this.nearbyState.update((s) => ({
      ...s,
      loading: true,
      error: null,
      permissionDenied: false,
    }));

    const position = await this.geolocationService.getCurrentPosition();

    if (!position) {
      const geoError = this.geolocationService.error();
      const isPermissionDenied = geoError?.type === 'permission_denied';

      this.nearbyState.update((s) => ({
        ...s,
        loading: false,
        error: geoError?.message || 'No se pudo obtener tu ubicación',
        permissionDenied: isPermissionDenied || false,
      }));
      return;
    }

    this.loadNearbyEvents(position);
  }

  private loadNearbyEvents(position: GeoPosition): void {
    this.nearbyState.update((s) => ({
      ...s,
      position,
      loading: true,
      error: null,
      initialized: true,
    }));

    this.eventService
      .searchNearbyEvents({
        lat: position.lat,
        lon: position.lon,
        distance: '10km',
        page: 0,
        size: 3,
      })
      .subscribe({
        next: (pageData) => {
          this.nearbyState.update((s) => ({
            ...s,
            events: pageData.content,
            loading: false,
            error: null,
          }));
        },
        error: (err) => {
          this.nearbyState.update((s) => ({
            ...s,
            loading: false,
            error: err.message || 'Error al cargar eventos cercanos',
          }));
        },
      });
  }
}
