import { Component, inject, signal, OnInit, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventService } from '../../../core/services/event.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Event, CreateEventRequest, UpdateEventRequest } from '../../../core/models/event.models';

export interface EventFormData {
  name: string;
  description: string;
  eventDate: string;
  venue: string;
  totalCapacity: number;
  price: number;
}

@Component({
  selector: 'app-event-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      (click)="onBackdropClick()"
    >
      <!-- Dialog -->
      <div
        class="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 pb-4 border-b border-outline-variant/10">
          <h2 class="font-headline text-xl font-bold text-on-surface">
            {{ isEdit() ? 'Editar Evento' : 'Crear Evento' }}
          </h2>
          <button
            type="button"
            (click)="close.emit()"
            class="p-2 rounded-full hover:bg-surface-container-high transition-colors"
            aria-label="Cerrar"
          >
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-5">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-bold text-on-surface mb-1.5">
              Nombre del evento <span class="text-error">*</span>
            </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Ej: Concierto de Rock 2026"
              class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface
                     placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary
                     focus:border-transparent transition-all text-sm"
            />
            @if (form.get('name')?.touched && form.get('name')?.invalid) {
              <p class="text-error text-xs mt-1.5">{{ getErrorMessage('name') }}</p>
            }
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-bold text-on-surface mb-1.5">
              Descripción
            </label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
              placeholder="Describe el evento..."
              class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface
                     placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary
                     focus:border-transparent transition-all text-sm resize-none"
            ></textarea>
            @if (form.get('description')?.touched && form.get('description')?.invalid) {
              <p class="text-error text-xs mt-1.5">{{ getErrorMessage('description') }}</p>
            }
          </div>

          <!-- Date & Time -->
          <div>
            <label for="eventDate" class="block text-sm font-bold text-on-surface mb-1.5">
              Fecha y hora <span class="text-error">*</span>
            </label>
            <input
              id="eventDate"
              type="datetime-local"
              formControlName="eventDate"
              class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                     transition-all text-sm"
            />
            @if (form.get('eventDate')?.touched && form.get('eventDate')?.invalid) {
              <p class="text-error text-xs mt-1.5">{{ getErrorMessage('eventDate') }}</p>
            }
          </div>

          <!-- Venue -->
          <div>
            <label for="venue" class="block text-sm font-bold text-on-surface mb-1.5">
              Lugar del evento <span class="text-error">*</span>
            </label>
            <input
              id="venue"
              type="text"
              formControlName="venue"
              placeholder="Ej: Estadio Nacional"
              class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface
                     placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary
                     focus:border-transparent transition-all text-sm"
            />
            @if (form.get('venue')?.touched && form.get('venue')?.invalid) {
              <p class="text-error text-xs mt-1.5">{{ getErrorMessage('venue') }}</p>
            }
          </div>

          <!-- Capacity & Price -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="totalCapacity" class="block text-sm font-bold text-on-surface mb-1.5">
                Capacidad <span class="text-error">*</span>
              </label>
              <input
                id="totalCapacity"
                type="number"
                formControlName="totalCapacity"
                min="1"
                max="500000"
                placeholder="5000"
                class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface
                       placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary
                       focus:border-transparent transition-all text-sm"
              />
              @if (form.get('totalCapacity')?.touched && form.get('totalCapacity')?.invalid) {
                <p class="text-error text-xs mt-1.5">{{ getErrorMessage('totalCapacity') }}</p>
              }
            </div>

            <div>
              <label for="price" class="block text-sm font-bold text-on-surface mb-1.5">
                Precio <span class="text-error">*</span>
              </label>
              <input
                id="price"
                type="number"
                formControlName="price"
                min="0.01"
                step="0.01"
                placeholder="150.00"
                class="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface
                       placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary
                       focus:border-transparent transition-all text-sm"
              />
              @if (form.get('price')?.touched && form.get('price')?.invalid) {
                <p class="text-error text-xs mt-1.5">{{ getErrorMessage('price') }}</p>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              (click)="close.emit()"
              class="flex-1 px-4 py-3 rounded-xl font-bold text-sm
                     bg-surface-container-high text-on-surface hover:bg-surface-container
                     transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || isSubmitting()"
              class="flex-1 kinetic-cta text-white px-4 py-3 rounded-xl font-bold text-sm
                     shadow-lg shadow-indigo-100 hover:scale-105 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              @if (isSubmitting()) {
                <span class="flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-sm animate-spin"
                    >progress_activity</span
                  >
                  {{ isEdit() ? 'Guardando...' : 'Creando...' }}
                </span>
              } @else {
                {{ isEdit() ? 'Guardar Cambios' : 'Crear Evento' }}
              }
            </button>
          </div>
        </form>
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
export class EventFormDialog implements OnInit {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private notification = inject(NotificationService);

  event = input<Event | null>(null);
  close = output<void>();
  saved = output<Event>();

  isEdit = signal(false);
  isSubmitting = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.maxLength(500)]],
    eventDate: ['', [Validators.required]],
    venue: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    totalCapacity: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(500000)],
    ],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    const evt = this.event();
    if (evt) {
      this.isEdit.set(true);
      this.form.patchValue({
        name: evt.title,
        description: evt.description,
        eventDate: evt.rawEventDate
          ? this.toLocalISOString(evt.rawEventDate)
          : this.toLocalDatetimeString(evt.date, evt.time),
        venue: evt.location,
        totalCapacity: evt.ticketsLeft ?? null,
        price: evt.price,
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.getRawValue();

    if (this.isEdit()) {
      const evt = this.event()!;
      const request: UpdateEventRequest = {
        name: formValue.name || undefined,
        description: formValue.description || undefined,
        eventDate: formValue.eventDate || undefined,
        venue: formValue.venue || undefined,
        totalCapacity: formValue.totalCapacity || undefined,
        price: formValue.price || undefined,
      };

      this.eventService.updateEvent(evt.id, request).subscribe({
        next: (updated) => {
          this.saved.emit(updated);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.notification.error(err.message || 'No se pudo actualizar el evento');
          this.isSubmitting.set(false);
        },
      });
    } else {
      const request: CreateEventRequest = {
        name: formValue.name!,
        description: formValue.description!,
        eventDate: formValue.eventDate!,
        venue: formValue.venue!,
        totalCapacity: formValue.totalCapacity!,
        price: formValue.price!,
      };

      this.eventService.createEvent(request).subscribe({
        next: (created) => {
          this.saved.emit(created);
          this.isSubmitting.set(false);
        },
        error: (err) => {
          this.notification.error(err.message || 'No se pudo crear el evento');
          this.isSubmitting.set(false);
        },
      });
    }
  }

  onBackdropClick(): void {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  }

  getErrorMessage(field: string): string {
    const errors = this.form.get(field)?.errors;
    if (!errors) return '';

    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;

    return 'Valor inválido';
  }

  private toLocalDatetimeString(date: string, time: string): string {
    const datePart = date.split('T')[0];
    const timePart = time || '00:00';
    return `${datePart}T${timePart}`;
  }

  private toLocalISOString(isoString: string): string {
    // Backend ISO: "2026-04-03T20:00:00" or "2026-04-03T20:00:00Z"
    // datetime-local needs: "2026-04-03T20:00"
    return isoString.slice(0, 16);
  }
}
