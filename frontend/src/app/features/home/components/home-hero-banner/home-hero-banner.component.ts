import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-hero-banner',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="px-6 py-12 max-w-7xl mx-auto">
      <div class="relative rounded-xl overflow-hidden min-h-[500px] flex items-center p-8 md:p-16">
        <div class="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&h=900&fit=crop"
            alt="Hero Background"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-inverse-surface/90 via-inverse-surface/40 to-transparent"
          ></div>
        </div>

        <div class="relative z-10 max-w-2xl">
          <span
            class="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary-fixed font-label text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md"
          >
            Featured This Month
          </span>
          <h1
            class="text-5xl md:text-7xl font-headline font-extrabold text-surface tracking-tighter leading-tight mb-6"
          >
            Experiencias que <br />
            <span class="text-primary-container">definen tu ritmo.</span>
          </h1>
          <p class="text-lg text-surface-variant font-body mb-8 max-w-lg leading-relaxed">
            Descubre los eventos más exclusivos de tu ciudad. Desde tecnología de vanguardia hasta
            el alma de la música en vivo.
          </p>
          <div class="flex flex-wrap gap-4">
            <a
              routerLink="/events"
              class="kinetic-gradient text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
            >
              Explorar Eventos
              <span class="material-symbols-outlined">arrow_forward</span>
            </a>
            <button
              class="bg-surface/10 backdrop-blur-md text-surface border border-surface/20 px-8 py-4 rounded-full font-bold hover:bg-surface/20 transition-all"
            >
              Ver Calendario
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HomeHeroBanner {}
