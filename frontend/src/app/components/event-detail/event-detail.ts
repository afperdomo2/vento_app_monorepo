import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopNavBar } from '../shared/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../shared/bottom-nav-bar/bottom-nav-bar';
import { SpeakerCard } from '../shared/speaker-card/speaker-card';

interface Speaker {
  name: string;
  role: string;
  imageUrl: string;
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, TopNavBar, BottomNavBar, SpeakerCard],
  template: `
    <app-top-nav-bar />
    
    <main class="pt-16 pb-32">
      <!-- Hero Section -->
      <section class="relative h-[614px] min-h-[400px] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&h=900&fit=crop" 
          alt="Event Hero"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/20 to-transparent"></div>
        <div class="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div class="max-w-7xl mx-auto">
            <span class="inline-block px-4 py-1 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-widest mb-4">
              Conferencia Global
            </span>
            <h1 class="text-4xl md:text-6xl lg:text-7xl font-headline font-extrabold text-white tracking-tighter leading-none mb-6">
              Future Tech <br/>
              <span class="text-primary-container">Summit 2024</span>
            </h1>
          </div>
        </div>
      </section>

      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        <!-- Main Content Area -->
        <div class="lg:col-span-8 space-y-12">
          <!-- Quick Info Bar -->
          <div class="flex flex-wrap gap-8 py-6 px-8 bg-surface-container-low rounded-xl">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Fecha</p>
                <p class="font-bold text-on-surface">24 Oct, 2024</p>
              </div>
            </div>
            <div class="flex items-center gap-4 border-l border-outline-variant/20 pl-8">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Hora</p>
                <p class="font-bold text-on-surface">09:00 AM - 06:00 PM</p>
              </div>
            </div>
            <div class="flex items-center gap-4 border-l border-outline-variant/20 pl-8">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Ubicación</p>
                <p class="font-bold text-on-surface">Centro de Convenciones, Madrid</p>
              </div>
            </div>
          </div>

          <!-- Description -->
          <article class="space-y-6">
            <h2 class="text-3xl font-headline font-bold tracking-tight">Sobre el Evento</h2>
            <p class="text-on-surface-variant text-lg leading-relaxed">
              Explora la vanguardia de la innovación en el **Future Tech Summit 2024**. Este año, nos sumergiremos en las tecnologías que están redefiniendo nuestro mundo, desde la Inteligencia Artificial Generativa hasta la computación cuántica. Únete a líderes de opinión internacionales para una jornada de aprendizaje, networking y descubrimiento.
            </p>
            <p class="text-on-surface-variant text-lg leading-relaxed">
              Diseñado para profesionales apasionados, emprendedores y visionarios, el evento ofrece talleres prácticos, mesas redondas y una zona de exposición exclusiva con las startups más disruptivas del ecosistema europeo.
            </p>
          </article>

          <!-- Speakers Section -->
          <section class="space-y-8">
            <h2 class="text-3xl font-headline font-bold tracking-tight">Ponentes Destacados</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (speaker of speakers; track speaker.name) {
                <app-speaker-card [speaker]="speaker" />
              }
            </div>
          </section>

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
              <span class="text-sm">Paseo de la Castellana 25, 28046 Madrid, España</span>
            </div>
          </section>
        </div>

        <!-- Ticket Selection Sidebar -->
        <aside class="lg:col-span-4">
          <div class="sticky top-24 space-y-6">
            <div class="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-[0_40px_100px_-15px_rgba(74,64,224,0.08)]">
              <div class="flex justify-between items-start mb-8">
                <h2 class="text-2xl font-headline font-extrabold tracking-tight">Selección de Entradas</h2>
                <div class="flex flex-col items-end">
                  <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    <span class="w-2 h-2 rounded-full bg-tertiary"></span>
                    ¡Últimas 5 entradas!
                  </span>
                </div>
              </div>

              <!-- Ticket Types -->
              <div class="space-y-4 mb-8">
                <!-- General -->
                <label class="block group cursor-pointer">
                  <input 
                    type="radio" 
                    name="ticket" 
                    value="general"
                    [checked]="selectedTicket() === 'general'"
                    (change)="selectTicket('general')"
                    class="hidden peer"
                  />
                  <div class="flex items-center justify-between p-4 rounded-xl border-2 border-transparent bg-surface-container peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                    <div>
                      <p class="font-bold text-on-surface">General</p>
                      <p class="text-xs text-on-surface-variant">Acceso completo a charlas</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xl font-headline font-extrabold text-primary">€89</p>
                    </div>
                  </div>
                </label>

                <!-- VIP -->
                <label class="block group cursor-pointer">
                  <input 
                    type="radio" 
                    name="ticket" 
                    value="vip"
                    [checked]="selectedTicket() === 'vip'"
                    (change)="selectTicket('vip')"
                    class="hidden peer"
                  />
                  <div class="flex items-center justify-between p-4 rounded-xl border-2 border-transparent bg-surface-container peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="font-bold text-on-surface">VIP</p>
                        <span class="text-[10px] font-bold px-2 py-0.5 bg-primary-container text-on-primary-container rounded-full">Premium</span>
                      </div>
                      <p class="text-xs text-on-surface-variant">Networking + Lounge + Cena</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xl font-headline font-extrabold text-primary">€199</p>
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
                      class="w-8 h-8 flex items-center justify-center text-primary-dim hover:bg-white rounded-full transition-colors"
                      type="button"
                    >
                      <span class="material-symbols-outlined">remove</span>
                    </button>
                    <span class="font-bold text-lg w-4 text-center">{{ quantity() }}</span>
                    <button 
                      (click)="incrementQuantity()"
                      class="w-8 h-8 flex items-center justify-center text-primary-dim hover:bg-white rounded-full transition-colors"
                      type="button"
                    >
                      <span class="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>

                <button 
                  routerLink="/checkout"
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

            <!-- Host Info Card -->
            <div class="bg-surface-container rounded-xl p-6 flex items-center gap-4">
              <img 
                src="https://images.unsplash.com/photo-1560179707-f14e90ef362b?w=100&h=100&fit=crop" 
                alt="Host"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Organizado por</p>
                <p class="font-bold text-on-surface">TechGlobal Events</p>
              </div>
              <button class="ml-auto w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors">
                <span class="material-symbols-outlined text-primary">mail</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <app-bottom-nav-bar />
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class EventDetail {
  selectedTicket = signal<'general' | 'vip'>('general');
  quantity = signal(1);

  speakers: Speaker[] = [
    {
      name: 'Elena Rodriguez',
      role: 'CTO en InnovaAI',
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop'
    },
    {
      name: 'Marcus Chen',
      role: 'Director de Blockchain Lab',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop'
    },
    {
      name: 'Sarah Jenkins',
      role: 'Experta en UX Ética',
      imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop'
    }
  ];

  selectTicket(type: 'general' | 'vip') {
    this.selectedTicket.set(type);
  }

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }
}
