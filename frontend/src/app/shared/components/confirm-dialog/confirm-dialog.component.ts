import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="onBackdropClick()"
    >
      <!-- Dialog -->
      <div
        class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm p-6"
        (click)="$event.stopPropagation()"
      >
        <!-- Icon -->
        <div class="flex justify-center mb-4">
          <div class="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-error text-3xl">delete_outline</span>
          </div>
        </div>

        <!-- Content -->
        <h3 class="font-headline text-lg font-bold text-on-surface text-center mb-2">
          {{ title() }}
        </h3>
        <p class="text-on-surface-variant text-sm text-center mb-6">
          {{ message() }}
        </p>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            (click)="cancel.emit()"
            class="flex-1 px-4 py-3 rounded-xl font-bold text-sm
                   bg-surface-container-high text-on-surface hover:bg-surface-container
                   transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="confirm.emit()"
            [disabled]="isConfirming()"
            class="flex-1 bg-error text-white px-4 py-3 rounded-xl font-bold text-sm
                   hover:bg-error/90 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (isConfirming()) {
              <span class="flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-sm animate-spin"
                  >progress_activity</span
                >
                Eliminando...
              </span>
            } @else {
              {{ confirmText() }}
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ConfirmDialog {
  title = input('¿Eliminar evento?');
  message = input(
    'Esta acción no se puede deshacer. El evento y su inventario de tickets serán eliminados permanentemente.',
  );
  confirmText = input('Eliminar');
  isConfirming = input(false);

  confirm = output<void>();
  cancel = output<void>();

  onBackdropClick(): void {
    if (!this.isConfirming()) {
      this.cancel.emit();
    }
  }
}
