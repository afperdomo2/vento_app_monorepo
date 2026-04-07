import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { EventCard } from '../../shared/components/event-card/event-card';
import { EventService } from '../../core/services/event.service';
import { GeolocationService, GeoPosition } from '../../core/services/geolocation.service';
import { Event } from '../../core/models/event.models';

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
  selector: 'app-home',
  standalone: true,
  imports: [TopNavBar, BottomNavBar, EventCard, RouterLink],
  template: `
    <app-top-nav-bar />

    <main class="pt-20 pb-24 md:pb-12">
      <!-- Hero Section -->
      <section class="px-6 py-12 max-w-7xl mx-auto">
        <div class="relative rounded-xl overflow-hidden min-h-[500px] flex items-center p-8 md:p-16">
          <div class="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&h=900&fit=crop"
              alt="Hero Background"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-inverse-surface/90 via-inverse-surface/40 to-transparent"></div>
          </div>

          <div class="relative z-10 max-w-2xl">
            <span class="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary-fixed font-label text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
              Featured This Month
            </span>
            <h1 class="text-5xl md:text-7xl font-headline font-extrabold text-surface tracking-tighter leading-tight mb-6">
              Experiencias que <br/>
              <span class="text-primary-container">definen tu ritmo.</span>
            </h1>
            <p class="text-lg text-surface-variant font-body mb-8 max-w-lg leading-relaxed">
              Descubre los eventos más exclusivos de tu ciudad. Desde tecnología de vanguardia hasta el alma de la música en vivo.
            </p>
            <div class="flex flex-wrap gap-4">
              <a
                routerLink="/events"
                class="kinetic-gradient text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
              >
                Explorar Eventos
                <span class="material-symbols-outlined">arrow_forward</span>
              </a>
              <button class="bg-surface/10 backdrop-blur-md text-surface border border-surface/20 px-8 py-4 rounded-full font-bold hover:bg-surface/20 transition-all">
                Ver Calendario
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Upcoming Events Grid -->
      <section class="px-6 py-8 max-w-7xl mx-auto">
        <div class="flex justify-between items-end mb-10">
          <div>
            <h2 class="text-4xl font-headline font-extrabold tracking-tight">Eventos destacados</h2>
            <p class="text-on-surface-variant mt-2">Selección editorial de las mejores experiencias.</p>
          </div>
          <a routerLink="/events" class="text-primary font-bold flex items-center gap-2 hover:underline">
            Ver todos <span class="material-symbols-outlined text-sm">arrow_outward</span>
          </a>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (item of [1, 2, 3]; track item) {
              <div class="bg-surface-container-lowest rounded-xl overflow-hidden animate-pulse">
                <div class="aspect-[4/3] bg-surface-container-high"></div>
                <div class="p-6 space-y-4">
                  <div class="h-4 bg-surface-container-high rounded w-1/3"></div>
                  <div class="h-6 bg-surface-container-high rounded w-3/4"></div>
                  <div class="h-4 bg-surface-container-high rounded w-full"></div>
                  <div class="h-4 bg-surface-container-high rounded w-2/3"></div>
                  <div class="flex justify-between pt-4 border-t border-outline-variant/10">
                    <div class="h-4 bg-surface-container-high rounded w-1/4"></div>
                    <div class="h-6 bg-surface-container-high rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Error State -->
        @if (error(); as errorMessage) {
          <div class="bg-error-container border border-error border-opacity-20 rounded-xl p-8 text-center">
            <span class="material-symbols-outlined text-error text-4xl mb-4">error</span>
            <h3 class="text-xl font-bold text-on-surface mb-2">Error al cargar eventos</h3>
            <p class="text-on-surface-variant mb-4">{{ errorMessage }}</p>
            <button
              (click)="loadEvents()"
              class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Intentar nuevamente
            </button>
          </div>
        }

        <!-- Events Grid -->
        @if (!isLoading() && !error()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (event of events(); track event.id) {
              <app-event-card [event]="event" />
            } @empty {
              <div class="col-span-full text-center py-12">
                <span class="material-symbols-outlined text-outline text-6xl mb-4">event_busy</span>
                <h3 class="text-xl font-bold text-on-surface mb-2">No hay eventos destacados</h3>
                <p class="text-on-surface-variant">Vuelve pronto para ver nuevos eventos</p>
              </div>
            }
          </div>
        }
      </section>

      <!-- Dynamic Map/Location Section -->
      <section class="px-6 py-12 max-w-7xl mx-auto">
        <div class="bg-surface-container rounded-xl p-8 flex flex-col lg:flex-row gap-12 items-center">
          <div class="lg:w-1/2">
            <h2 class="text-3xl font-headline font-extrabold mb-6">Encuentra eventos cerca de ti</h2>
            <p class="text-on-surface-variant mb-8 leading-relaxed">
              Utilizamos tu ubicación para mostrarte los happenings más relevantes en tu zona. Nunca te pierdas lo que está ocurriendo a la vuelta de la esquina.
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
              <div class="flex items-center gap-3 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                <span class="material-symbols-outlined text-primary animate-spin">progress_activity</span>
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
                <div class="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                  <span class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined">location_on</span>
                  </span>
                  <div class="flex-1">
                    <h4 class="font-bold">Ubicación activa</h4>
                    <p class="text-sm text-on-surface-variant">
                      {{ nearbyState().position!.lat.toFixed(4) }}, {{ nearbyState().position!.lon.toFixed(4) }}
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
                          <span class="text-primary font-bold text-sm">{{ formatPrice(event.price) }}</span>
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
                  <div class="absolute -inset-4 bg-primary rounded-full opacity-20 animate-ping"></div>
                }
                <div class="relative w-8 h-8 bg-primary rounded-full border-4 border-surface flex items-center justify-center shadow-lg">
                  <div class="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Newsletter / Footer CTA -->
      <section class="px-6 py-20 max-w-7xl mx-auto text-center">
        <div class="max-w-2xl mx-auto">
          <h2 class="text-4xl font-headline font-extrabold mb-6 tracking-tighter">No te pierdas de nada.</h2>
          <p class="text-on-surface-variant mb-10 text-lg">
            Suscríbete para recibir recomendaciones personalizadas y acceso anticipado a tickets exclusivos.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              class="flex-grow bg-surface-container border-none rounded-full px-8 py-4 focus:ring-2 ring-primary"
            />
            <button class="kinetic-gradient text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              Unirse ahora
            </button>
          </div>
          <p class="mt-6 text-xs text-on-surface-variant/60 font-medium uppercase tracking-widest">
            Respetamos tu privacidad. Unsubscribe en cualquier momento.
          </p>
        </div>
      </section>
    </main>

    <app-bottom-nav-bar />
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class HomePage implements OnInit {
  private eventService = inject(EventService);
  private geolocationService = inject(GeolocationService);

  // Signal-based state management
  events = signal<Event[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  nearbyState = signal<NearbySectionState>(initialNearbyState);

  constructor() {
    // Log when events change (for debugging)
    effect(() => {
      console.log('Events updated:', this.events().length);
    });
  }

  ngOnInit(): void {
    this.loadEvents();
    this.tryLoadNearbyPreview();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.eventService.getFeaturedEvents(6).subscribe({
      next: (events) => {
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(error.message);
        this.isLoading.set(false);
        console.error('Error loading events:', error);
      },
    });
  }

  /**
   * Tries to load a preview of nearby events if there's a cached position.
   * Doesn't ask for permission if not available (silent fail).
   */
  tryLoadNearbyPreview(): void {
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
        size: 3, // Preview of 3 events
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

  formatPrice(price: number): string {
    return price === 0 ? 'Gratis' : `€${price.toFixed(2)}`;
  }
}
