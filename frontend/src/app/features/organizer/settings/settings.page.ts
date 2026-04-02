import { Component } from '@angular/core';

@Component({
  selector: 'app-organizer-settings',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[400px] text-center">
      <span class="material-symbols-outlined text-6xl text-outline mb-4">settings</span>
      <h2 class="font-headline text-2xl font-bold text-on-surface mb-2">Configuración</h2>
      <p class="text-on-surface-variant max-w-md">
        Esta sección estará disponible próximamente. Aquí podrás configurar las preferencias de tu cuenta de organizador.
      </p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SettingsPage {}
