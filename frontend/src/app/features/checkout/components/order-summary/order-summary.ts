import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../../../../core/models/event.models';
import { Order } from '../../../../core/models/order.models';
import { formatCurrency } from '../../../../core/format/format';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-surface-container-highest rounded-3xl overflow-hidden sticky top-28">
      <!-- Event Hero Image -->
      <div class="relative h-48 overflow-hidden">
        <img
          [src]="event().imageUrl"
          [alt]="event().title"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-surface-container-highest via-transparent to-transparent"></div>
      </div>

      <div class="p-8 space-y-8">
        <!-- Event Info -->
        <div>
          @if (showLowStock()) {
            <span class="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
              ¡Solo quedan {{ event().ticketsLeft }}!
            </span>
          }
          <h2 class="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
            {{ event().title }}
          </h2>
          <div class="flex items-center gap-4 mt-4 text-on-surface-variant text-sm font-medium">
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-lg">calendar_today</span>
              {{ event().date }}
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-lg">location_on</span>
              {{ event().location }}
            </div>
          </div>
        </div>

        <!-- Price Breakdown -->
        <div class="border-t border-outline-variant/10 pt-6 space-y-4">
          <!-- Ticket Line -->
          <div>
            <p class="font-bold text-on-surface mb-1">Entrada General</p>
            <div class="flex justify-between items-center">
              <span class="text-sm text-on-surface-variant">
                {{ formatPrice(event().price) }} × {{ order().quantity }} boleta{{ order().quantity > 1 ? 's' : '' }}
              </span>
              <span class="font-bold text-on-surface">
                {{ formatPrice(event().price * order().quantity) }}
              </span>
            </div>
          </div>

          <!-- Service Fee -->
          <div class="flex justify-between items-center">
            <span class="text-on-surface-variant font-medium">Cargo de servicio</span>
            <span class="font-bold text-on-surface">{{ formatPrice(0) }}</span>
          </div>

          <!-- Total -->
          <div class="flex justify-between items-center pt-4 border-t border-on-surface/5">
            <span class="font-headline text-xl font-extrabold text-on-surface">Total</span>
            <span class="font-headline text-3xl font-extrabold text-primary tracking-tighter">
              {{ formatPrice(order().totalAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class OrderSummary {
  order = input.required<Order>();
  event = input.required<Event>();

  showLowStock = () => {
    const ticketsLeft = this.event().ticketsLeft;
    return ticketsLeft !== undefined && ticketsLeft < 50;
  };

  formatPrice(amount: number): string {
    return formatCurrency(amount);
  }
}
