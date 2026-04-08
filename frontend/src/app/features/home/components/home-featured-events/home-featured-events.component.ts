import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Event } from '../../../../core/models/event.models';
import { EventService } from '../../../../core/services/event.service';
import { EventCard } from '../../../../shared/components/event-card/event-card';

@Component({
  selector: 'app-home-featured-events',
  standalone: true,
  imports: [EventCard, RouterLink],
  template: `
    <section class="px-6 py-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-end mb-10">
        <div>
          <h2 class="text-4xl font-headline font-extrabold tracking-tight">Eventos destacados</h2>
          <p class="text-on-surface-variant mt-2">
            Selección editorial de las mejores experiencias.
          </p>
        </div>
        <a
          routerLink="/events"
          class="text-primary font-bold flex items-center gap-2 hover:underline"
        >
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
        <div
          class="bg-error-container border border-error border-opacity-20 rounded-xl p-8 text-center"
        >
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
  `,
})
export class HomeFeaturedEvents implements OnInit {
  private eventService = inject(EventService);

  events = signal<Event[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.eventService.getFeaturedEvents(3).subscribe({
      next: (events) => {
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(error.message);
        this.isLoading.set(false);
        console.error('Error loading featured events:', error);
      },
    });
  }
}
