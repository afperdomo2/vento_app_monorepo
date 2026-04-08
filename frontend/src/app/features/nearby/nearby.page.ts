import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NearbyEventsService } from './services/nearby-events.service';
import { RadiusSelectorComponent } from './components/radius-selector';
import { EventCard } from '../../shared/components/event-card/event-card';
import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';

@Component({
  selector: 'app-nearby-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TopNavBar,
    BottomNavBar,
    EventCard,
    RadiusSelectorComponent,
  ],
  template: `
    <app-top-nav-bar />

    <main class="pt-20 pb-24 md:pb-8 min-h-screen">
      <!-- Header -->
      <header class="px-6 py-6 max-w-7xl mx-auto">
        <div class="flex items-center gap-3 mb-4">
          <button
            [routerLink]="['/home']"
            class="p-2 hover:bg-surface-container rounded-full transition-colors"
            [attr.aria-label]="'Volver al inicio'"
          >
            <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <div>
            <h1 class="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
              Eventos Cercanos
            </h1>
            @if (position()) {
              <p class="text-on-surface-variant text-sm mt-1">
                <span class="material-symbols-outlined text-xs inline-block align-middle mr-1">
                  location_on
                </span>
                Mostrando eventos en un radio de {{ radius() }}
              </p>
            }
          </div>
        </div>

        <!-- Radius Selector -->
        @if (position() && !loading()) {
          <app-radius-selector
            [currentRadius]="radius()"
            (radiusSelected)="nearbyEventsService.changeRadius($event)"
          />
        }
      </header>

      <!-- Loading State (Initial) -->
      @if (loading() && !events().length) {
        <section class="px-6 max-w-7xl mx-auto">
          <div class="flex flex-col items-center justify-center py-20">
            <span class="material-symbols-outlined text-primary text-5xl animate-spin mb-4">
              progress_activity
            </span>
            <p class="text-on-surface-variant font-bold">
              @if (permissionDenied()) {
                Solicitando permiso de ubicación...
              } @else {
                Obteniendo tu ubicación...
              }
            </p>
          </div>
        </section>
      }

      <!-- Permission Denied State -->
      @if (permissionDenied()) {
        <section class="px-6 max-w-7xl mx-auto">
          <div class="bg-error-container border border-error/20 rounded-2xl p-8 text-center">
            <span class="material-symbols-outlined text-error text-5xl mb-4">location_off</span>
            <h3 class="font-headline text-xl font-bold text-on-surface mb-2">
              Permiso de ubicación denegado
            </h3>
            <p class="text-on-surface-variant text-sm mb-6 max-w-md mx-auto">
              No pudimos acceder a tu ubicación. Para ver eventos cercanos, necesitamos saber dónde
              estás. Puedes habilitar los permisos en la configuración de tu navegador.
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                (click)="nearbyEventsService.retryPermission()"
                class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-sm">refresh</span>
                Intentar de nuevo
              </button>
              <button
                [routerLink]="['/events']"
                class="px-6 py-3 rounded-full font-bold text-primary hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
              >
                Ver todos los eventos
              </button>
            </div>
          </div>
        </section>
      }

      <!-- Error State -->
      @if (error() && !loading() && !permissionDenied()) {
        <section class="px-6 max-w-7xl mx-auto">
          <div class="bg-error-container border border-error/20 rounded-2xl p-8 text-center">
            <span class="material-symbols-outlined text-error text-5xl mb-4">error</span>
            <h3 class="font-headline text-xl font-bold text-on-surface mb-2">
              Error al cargar eventos
            </h3>
            <p class="text-on-surface-variant text-sm mb-6">{{ error() }}</p>
            <button
              (click)="nearbyEventsService.loadEvents()"
              class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Reintentar
            </button>
          </div>
        </section>
      }

      <!-- No Events Found -->
      @if (!loading() && !events().length && !error() && position()) {
        <section class="px-6 max-w-7xl mx-auto">
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <span class="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">
              event_busy
            </span>
            <h3 class="font-headline text-xl font-bold text-on-surface mb-2">
              No hay eventos en {{ radius() }}
            </h3>
            <p class="text-on-surface-variant text-sm max-w-sm mb-6">
              No encontramos eventos cerca de tu ubicación. Intenta aumentar el radio de búsqueda.
            </p>
            <p class="text-on-surface-variant text-xs">
              Coordenadas: {{ position()?.lat?.toFixed(4) }}, {{ position()?.lon?.toFixed(4) }}
            </p>
          </div>
        </section>
      }

      <!-- Events Grid -->
      @if (events().length) {
        <section class="px-6 max-w-7xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (event of events(); track event.id) {
              <app-event-card [event]="event" />
            }
          </div>

          <!-- Loading More Indicator -->
          @if (loadingMore()) {
            <div class="flex justify-center py-12">
              <span class="material-symbols-outlined text-primary text-3xl animate-spin">
                progress_activity
              </span>
            </div>
          }

          <!-- End Message -->
          @if (!hasMore() && !loadingMore()) {
            <div class="text-center py-12 text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl mb-2 opacity-30">
                check_circle
              </span>
              <p class="font-bold">Has llegado al final de la lista</p>
              <p class="text-sm mt-1">{{ totalElements() }} eventos encontrados</p>
            </div>
          }

          <!-- Infinite Scroll Trigger (invisible sentinel) -->
          @if (hasMore() && !loadingMore()) {
            <div #scrollSentinel class="h-1"></div>
          }
        </section>
      }
    </main>

    <app-bottom-nav-bar />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class NearbyEventsPage implements OnInit {
  readonly nearbyEventsService = inject(NearbyEventsService);

  readonly events = this.nearbyEventsService.events;
  readonly loading = this.nearbyEventsService.loading;
  readonly loadingMore = this.nearbyEventsService.loadingMore;
  readonly hasMore = this.nearbyEventsService.hasMore;
  readonly totalElements = this.nearbyEventsService.totalElements;
  readonly error = this.nearbyEventsService.error;
  readonly position = this.nearbyEventsService.position;
  readonly radius = this.nearbyEventsService.radius;
  readonly permissionDenied = this.nearbyEventsService.permissionDenied;

  ngOnInit(): void {
    this.nearbyEventsService.initialize();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const threshold = 800; // px before end

    if (scrollPosition >= documentHeight - threshold) {
      this.nearbyEventsService.loadMore();
    }
  }
}
