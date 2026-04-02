import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { EventService } from '../../core/services/event.service';
import { Event } from '../../core/models/event.models';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, TopNavBar, BottomNavBar],
  template: `
    <app-top-nav-bar />

    <main class="pt-16 pb-32">
      @if (loading()) {
        <!-- Loading Skeleton -->
        <div class="max-w-7xl mx-auto px-6 py-12">
          <div class="animate-pulse space-y-8">
            <div class="h-[400px] bg-surface-container-high rounded-xl"></div>
            <div class="h-12 bg-surface-container-high rounded w-3/4"></div>
            <div class="h-6 bg-surface-container-high rounded w-1/2"></div>
          </div>
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div class="max-w-7xl mx-auto px-6 py-12">
          <div class="bg-error-container border border-error border-opacity-20 rounded-xl p-8 text-center">
            <span class="material-symbols-outlined text-error text-4xl mb-4">error</span>
            <h2 class="text-2xl font-bold text-on-surface mb-2">Error al cargar el evento</h2>
            <p class="text-on-surface-variant mb-6">{{ error() }}</p>
            <a
              routerLink="/events"
              class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <span class="material-symbols-outlined">arrow_back</span>
              Volver al listado
            </a>
          </div>
        </div>
      } @else if (event()) {
        <!-- Event Detail Content -->
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <!-- Main Content Area -->
          <div class="lg:col-span-8 space-y-12">
            <!-- Hero Section -->
            <section class="relative h-[400px] md:h-[500px] overflow-hidden rounded-xl">
              <!-- Back Button -->
              <button
                (click)="goBack()"
                class="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-black/70 transition-colors"
                type="button"
              >
                <span class="material-symbols-outlined">arrow_back</span>
                <span class="font-bold hidden md:inline">Volver</span>
              </button>
              
              <!-- Breadcrumbs -->
              <div class="absolute top-16 left-4 z-10 text-sm text-white/80 hidden md:block">
                <a routerLink="/home" class="hover:text-white transition-colors">Inicio</a>
                <span class="mx-2">›</span>
                <a routerLink="/events" class="hover:text-white transition-colors">Eventos</a>
                <span class="mx-2">›</span>
                <span class="text-white font-medium truncate max-w-xs inline-block">{{ event()?.title }}</span>
              </div>
              
              <img
                [src]="event()!.imageUrl"
                [alt]="event()!.title"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div class="absolute bottom-0 left-0 w-full p-8">
                <span class="inline-block px-4 py-1 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-widest mb-4">
                  {{ event()!.category }}
                </span>
                <h1 class="text-3xl md:text-5xl font-headline font-extrabold text-white tracking-tighter leading-none">
                  {{ event()!.title }}
                </h1>
              </div>
            </section>

            <!-- Quick Info Bar -->
            <div class="flex flex-wrap gap-8 py-6 px-8 bg-surface-container-low rounded-xl">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined">calendar_today</span>
                </div>
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Fecha</p>
                  <p class="font-bold text-on-surface">{{ event()!.date }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4 border-l border-outline-variant/20 pl-8">
                <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined">schedule</span>
                </div>
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Hora</p>
                  <p class="font-bold text-on-surface">{{ event()!.time }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4 border-l border-outline-variant/20 pl-8">
                <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Ubicación</p>
                  <p class="font-bold text-on-surface">{{ event()!.location }}</p>
                </div>
              </div>
            </div>

            <!-- Description -->
            <article class="space-y-6">
              <h2 class="text-3xl font-headline font-bold tracking-tight">Sobre el Evento</h2>
              <p class="text-on-surface-variant text-lg leading-relaxed">
                {{ event()!.description }}
              </p>
            </article>

            <!-- Location Map -->
            <section class="space-y-6">
              <h2 class="text-3xl font-headline font-bold tracking-tight text-on-surface">Ubicación</h2>
              <div class="w-full h-80 rounded-xl overflow-hidden shadow-inner grayscale opacity-90 border border-outline-variant/10">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=600&fit=crop"
                  alt="Location Map"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex items-center gap-2 text-on-surface-variant">
                <span class="material-symbols-outlined text-primary">directions</span>
                <span class="text-sm">{{ event()!.location }}</span>
              </div>
            </section>
          </div>

          <!-- Ticket Selection Sidebar -->
          <aside class="lg:col-span-4">
            <div class="sticky top-24 space-y-6">
              <div class="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-[0_40px_100px_-15px_rgba(74,64,224,0.08)]">
                <div class="flex justify-between items-start mb-8">
                  <h2 class="text-2xl font-headline font-extrabold tracking-tight">Entradas</h2>
                  @if (event()!.ticketsLeft && event()!.ticketsLeft! < 50) {
                    <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase tracking-widest animate-pulse">
                      <span class="w-2 h-2 rounded-full bg-tertiary"></span>
                      ¡Últimas {{ event()!.ticketsLeft }}!
                    </span>
                  }
                </div>

                <!-- General Admission Only -->
                <div class="space-y-4 mb-8">
                  <label class="block group cursor-pointer">
                    <input
                      type="radio"
                      name="ticket"
                      value="general"
                      checked
                      class="hidden peer"
                    />
                    <div class="flex items-center justify-between p-4 rounded-xl border-2 border-transparent bg-surface-container peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                      <div>
                        <p class="font-bold text-on-surface">General</p>
                        <p class="text-xs text-on-surface-variant">Acceso completo al evento</p>
                      </div>
                      <div class="text-right">
                        <p class="text-xl font-headline font-extrabold text-primary">{{ event()!.price }}</p>
                      </div>
                    </div>
                  </label>
                </div>

                <!-- Counter & CTA -->
                <div class="space-y-6">
                  <div class="flex items-center justify-between">
                    <p class="font-bold">Cantidad</p>
                    <div class="flex items-center gap-4 bg-surface-container rounded-full px-4 py-2">
                      <button
                        (click)="decrementQuantity()"
                        [disabled]="quantity() <= 1"
                        class="w-8 h-8 flex items-center justify-center text-primary-dim hover:bg-white rounded-full transition-colors disabled:opacity-30"
                        type="button"
                      >
                        <span class="material-symbols-outlined">remove</span>
                      </button>
                      <span class="font-bold text-lg w-4 text-center">{{ quantity() }}</span>
                      <button
                        (click)="incrementQuantity()"
                        [disabled]="event()!.ticketsLeft && quantity() >= event()!.ticketsLeft!"
                        class="w-8 h-8 flex items-center justify-center text-primary-dim hover:bg-white rounded-full transition-colors disabled:opacity-30"
                        type="button"
                      >
                        <span class="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </div>

                  <button
                    routerLink="/checkout"
                    [queryParams]="{ eventId: eventId, quantity: quantity() }"
                    class="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform duration-200"
                  >
                    Reservar Ahora
                  </button>

                  <p class="text-center text-xs text-on-surface-variant px-4">
                    Al hacer clic en Reservar Ahora, aceptas nuestros
                    <a href="#" class="underline font-medium">Términos y Condiciones</a>
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      }
    </main>

    <app-bottom-nav-bar />

    <!-- Floating Back Button (Mobile) -->
    <button
      (click)="goBack()"
      class="fixed bottom-24 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform md:hidden"
      type="button"
      aria-label="Volver"
    >
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class EventDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private eventService = inject(EventService);

  event = signal<Event | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  quantity = signal(1);
  eventId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId = id;
      this.loadEvent(id);
    } else {
      this.error.set('ID de evento no válido');
      this.loading.set(false);
    }
  }

  loadEvent(id: string): void {
    this.loading.set(true);
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.error.set('Evento no encontrado');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    // Confirm if user has selected more than 1 ticket
    if (this.quantity() > 1) {
      const confirmed = confirm(
        `Tienes ${this.quantity()} entrada(s) seleccionada(s). ¿Seguro que quieres salir?`
      );
      if (!confirmed) return;
    }
    
    this.location.back();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.goBack();
  }

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }
}
