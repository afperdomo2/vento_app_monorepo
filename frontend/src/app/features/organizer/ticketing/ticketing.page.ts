import { Component } from '@angular/core';

@Component({
  selector: 'app-organizer-ticketing',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[400px] text-center">
      <span class="material-symbols-outlined text-6xl text-outline mb-4">confirmation_number</span>
      <h2 class="font-headline text-2xl font-bold text-on-surface mb-2">Tickets</h2>
      <p class="text-on-surface-variant max-w-md">
        Esta sección estará disponible próximamente. Aquí podrás configurar los tipos de tickets y precios.
      </p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TicketingPage {}
