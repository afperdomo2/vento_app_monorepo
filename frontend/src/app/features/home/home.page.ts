import { Component } from '@angular/core';
import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { EventCard } from '../../shared/components/event-card/event-card';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: string | number;
  imageUrl: string;
  category: string;
  isSoldOut?: boolean;
  ticketsLeft?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TopNavBar, BottomNavBar, EventCard],
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

      <!-- Search & Filter Bento -->
      <section class="px-6 py-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        <div class="md:col-span-8 bg-surface-container-low rounded-xl p-8">
          <h2 class="text-2xl font-headline font-bold mb-6 flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">tune</span>
            Filtros Inteligentes
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">Categoría</label>
              <select class="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-2 ring-primary-container font-body text-sm">
                <option>Todas las categorías</option>
                <option>Tecnología</option>
                <option>Música</option>
                <option>Arte & Diseño</option>
                <option>Gastronomía</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">Fecha</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">calendar_today</span>
                <input 
                  type="text" 
                  placeholder="Próximos 7 días" 
                  class="w-full bg-surface-container-lowest border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 ring-primary-container font-body text-sm"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">Precio</label>
              <select class="w-full bg-surface-container-lowest border-none rounded-xl py-3 px-4 focus:ring-2 ring-primary-container font-body text-sm">
                <option>Cualquier precio</option>
                <option>Gratuitos</option>
                <option>Menos de $50</option>
                <option>$50 - $150</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="md:col-span-4 bg-primary text-on-primary rounded-xl p-8 relative overflow-hidden flex flex-col justify-center">
          <div class="relative z-10">
            <h3 class="text-xl font-headline font-bold mb-2">Sugerencias locales</h3>
            <p class="text-on-primary/80 text-sm mb-6 leading-relaxed">
              Basado en tu ubicación actual en Madrid, hay 12 eventos cerca de ti hoy.
            </p>
            <button class="bg-white text-primary px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform">
              <span class="material-symbols-outlined text-sm">near_me</span> Ver mapa local
            </button>
          </div>
          <div class="absolute -right-4 -bottom-4 opacity-20">
            <span class="material-symbols-outlined text-[120px]" style="font-variation-settings: 'FILL' 1;">location_on</span>
          </div>
        </div>
      </section>

      <!-- Category Pills -->
      <section class="px-6 py-12 max-w-7xl mx-auto overflow-x-auto whitespace-nowrap no-scrollbar flex gap-4">
        <button class="px-8 py-3 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-105">
          Todo
        </button>
        <button class="px-8 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-semibold hover:bg-primary-container/20 transition-colors">
          Tecnología
        </button>
        <button class="px-8 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-semibold hover:bg-primary-container/20 transition-colors">
          Música
        </button>
        <button class="px-8 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-semibold hover:bg-primary-container/20 transition-colors">
          Arte y Museos
        </button>
        <button class="px-8 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-semibold hover:bg-primary-container/20 transition-colors">
          Cine
        </button>
        <button class="px-8 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-semibold hover:bg-primary-container/20 transition-colors">
          Deportes
        </button>
        <button class="px-8 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-semibold hover:bg-primary-container/20 transition-colors">
          Networking
        </button>
      </section>

      <!-- Upcoming Events Grid -->
      <section class="px-6 py-8 max-w-7xl mx-auto">
        <div class="flex justify-between items-end mb-10">
          <div>
            <h2 class="text-4xl font-headline font-extrabold tracking-tight">Eventos destacados</h2>
            <p class="text-on-surface-variant mt-2">Selección editorial de las mejores experiencias.</p>
          </div>
          <a href="#" class="text-primary font-bold flex items-center gap-2 hover:underline">
            Ver todos <span class="material-symbols-outlined text-sm">arrow_outward</span>
          </a>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (event of events; track event.id) {
            <app-event-card [event]="event" />
          }
        </div>
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
export class HomePage {
  events: Event[] = [
    {
      id: '1',
      title: 'Global AI Summit: The Future of Neural Networks',
      description: 'Únete a los líderes de la industria para discutir el impacto de la IA generativa en el diseño y la ingeniería moderna.',
      date: '15 Oct, 2023',
      time: '09:00',
      location: 'Palacio de Congresos',
      price: '$120.00',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
      category: 'Tecnología',
      isSoldOut: false,
      ticketsLeft: 25
    },
    {
      id: '2',
      title: 'Jazz Under The Stars: Autumn Sessions',
      description: 'Una noche íntima con los mejores exponentes del jazz contemporáneo en un rooftop exclusivo de la ciudad.',
      date: '18 Oct, 2023',
      time: '21:00',
      location: 'Sky Lounge Madrid',
      price: '$45.00',
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=600&fit=crop',
      category: 'Música',
      isSoldOut: false,
      ticketsLeft: 4
    },
    {
      id: '3',
      title: 'Digital Renaissance: NFTs & The Future of Art',
      description: 'Exposición inmersiva que explora la intersección entre las bellas artes tradicionales y el ecosistema blockchain.',
      date: '22 Oct, 2023',
      time: '10:00',
      location: 'Centro Cultural Digital',
      price: 'Gratis',
      imageUrl: 'https://images.unsplash.com/photo-1545989253-02cc26577f88?w=800&h=600&fit=crop',
      category: 'Arte',
      isSoldOut: false
    }
  ];
}
