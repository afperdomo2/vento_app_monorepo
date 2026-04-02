import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { EventCard } from '../../shared/components/event-card/event-card';
import { EventService } from '../../core/services/event.service';
import { Event } from '../../core/models/event.models';

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
              <button class="kinetic-gradient text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                Explorar Eventos
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
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
            <div class="space-y-4">
              <div class="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                <span class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined">my_location</span>
                </span>
                <div>
                  <h4 class="font-bold">Ubicación Actual</h4>
                  <p class="text-sm text-on-surface-variant">Chamberí, Madrid, España</p>
                </div>
              </div>
              <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer">
                <span class="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-outline">
                  <span class="material-symbols-outlined">map</span>
                </span>
                <div>
                  <h4 class="font-bold">Cambiar radio de búsqueda</h4>
                  <p class="text-sm text-on-surface-variant">Actualmente 5km a la redonda</p>
                </div>
              </div>
            </div>
          </div>
          <div class="lg:w-1/2 w-full h-[400px] rounded-xl overflow-hidden relative shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=600&fit=crop"
              alt="Map Location"
              class="w-full h-full object-cover grayscale opacity-50"
            />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="relative">
                <div class="absolute -inset-4 bg-primary rounded-full opacity-20 animate-ping"></div>
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

  // Signal-based state management
  events = signal<Event[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Log when events change (for debugging)
    effect(() => {
      console.log('Events updated:', this.events().length);
    });
  }

  ngOnInit(): void {
    this.loadEvents();
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
}
