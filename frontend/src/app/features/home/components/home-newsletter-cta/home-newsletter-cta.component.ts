import { Component } from '@angular/core';

@Component({
  selector: 'app-home-newsletter-cta',
  standalone: true,
  template: `
    <section class="px-6 py-20 max-w-7xl mx-auto text-center">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-4xl font-headline font-extrabold mb-6 tracking-tighter">
          No te pierdas de nada.
        </h2>
        <p class="text-on-surface-variant mb-10 text-lg">
          Suscríbete para recibir recomendaciones personalizadas y acceso anticipado a tickets
          exclusivos.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="Tu correo electrónico"
            class="flex-grow bg-surface-container border-none rounded-full px-8 py-4 focus:ring-2 ring-primary"
          />
          <button
            class="kinetic-gradient text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            Unirse ahora
          </button>
        </div>
        <p class="mt-6 text-xs text-on-surface-variant/60 font-medium uppercase tracking-widest">
          Respetamos tu privacidad. Unsubscribe en cualquier momento.
        </p>
      </div>
    </section>
  `,
})
export class HomeNewsletterCta {}
