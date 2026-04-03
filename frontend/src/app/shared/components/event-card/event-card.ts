import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EventsListService } from '../../../features/events-list/services/events-list.service';
import { formatCurrency } from '../../../core/format/format';

interface EventCardData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  imageUrl: string;
  category: string;
  isSoldOut?: boolean;
  ticketsLeft?: number;
}

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="group relative bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
    >
      <!-- Clickable Area for Event Detail -->
      <a [routerLink]="'/events/' + event.id" (click)="saveScrollPosition()" class="block">
        <!-- Image Section -->
        <div class="aspect-[4/3] overflow-hidden relative">
          <img
            [src]="event.imageUrl"
            [alt]="event.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          <!-- Category Badge -->
          <div class="absolute top-4 left-4 flex gap-2">
            <span
              class="bg-surface-container-lowest/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary"
            >
              {{ event.category }}
            </span>
            @if (event.isSoldOut) {
              <span
                class="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
              >
                Sold Out
              </span>
            } @else if (event.ticketsLeft && event.ticketsLeft < 10) {
              <span
                class="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse"
              >
                Only {{ event.ticketsLeft }} left
              </span>
            }
          </div>

          <!-- Favorite Button -->
          <button
            class="absolute top-4 right-4 w-10 h-10 bg-surface-container-lowest/90 backdrop-blur rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
          >
            <span class="material-symbols-outlined">favorite</span>
          </button>
        </div>

        <!-- Content Section -->
        <div class="p-6">
          <!-- Date and Time -->
          <div
            class="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-3"
          >
            <span class="material-symbols-outlined text-sm">calendar_month</span>
            {{ event.date }} • {{ event.time }}
          </div>

          <!-- Title -->
          <h3
            class="text-xl font-headline font-bold mb-3 leading-tight group-hover:text-primary transition-colors"
          >
            {{ event.title }}
          </h3>

          <!-- Description -->
          <p class="text-on-surface-variant text-sm line-clamp-2 mb-6 font-body">
            {{ event.description }}
          </p>

          <!-- Footer: Location and Price -->
          <div class="flex items-center justify-between border-t border-outline-variant/10 pt-4">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-outline">location_on</span>
              <span class="text-xs text-on-surface-variant font-medium">{{ event.location }}</span>
            </div>
            <span class="text-lg font-bold text-on-surface">
              {{ formatPrice(event.price) }}
            </span>
          </div>
        </div>
      </a>
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
export class EventCard {
  @Input({ required: true }) event!: EventCardData;

  private eventsListService = inject(EventsListService);

  saveScrollPosition() {
    this.eventsListService.saveScrollPosition();
  }

  formatPrice(price: number): string {
    return formatCurrency(price);
  }
}
