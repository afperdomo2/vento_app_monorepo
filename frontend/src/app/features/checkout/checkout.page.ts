import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { OrderSummary } from './components/order-summary/order-summary';
import { OrderService } from '../../core/services/order.service';
import { EventService } from '../../core/services/event.service';
import { Order } from '../../core/models/order.models';
import { Event } from '../../core/models/event.models';

const ORDER_EXPIRY_MINUTES = 5;
const SESSION_STORAGE_KEY_PREFIX = 'checkout:expireTime:';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TopNavBar,
    BottomNavBar,
    OrderSummary,
  ],
  template: `
    <app-top-nav-bar />

    <main class="pt-24 pb-32 px-4 max-w-6xl mx-auto">
      @if (loading()) {
        <!-- Loading Skeleton -->
        <div class="animate-pulse space-y-8 mt-12">
          <div class="h-8 bg-surface-container-high rounded w-1/3"></div>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div class="lg:col-span-7 h-96 bg-surface-container-high rounded-3xl"></div>
            <div class="lg:col-span-5 h-96 bg-surface-container-high rounded-3xl"></div>
          </div>
        </div>
      } @else if (orderExpired()) {
        <!-- Expired state handled by modal -->
      } @else if (order() && event()) {
        <!-- Timer Banner -->
        <div class="mb-12 flex justify-center">
          <div
            class="bg-surface-container-lowest border border-outline-variant/15 px-6 py-3 rounded-full flex items-center gap-3 shadow-xl shadow-on-surface/5"
            [class.animate-pulse-slow]="timeRemaining() > 60"
            [class.text-error]="timeRemaining() <= 60"
          >
            <span
              class="material-symbols-outlined"
              [class.text-tertiary]="timeRemaining() > 60"
              [class.text-error]="timeRemaining() <= 60"
            >
              timer
            </span>
            <p class="font-label text-sm font-bold text-on-surface uppercase tracking-widest">
              Tu reserva expira en
              <span
                class="font-mono text-lg"
                [class.text-tertiary]="timeRemaining() > 60"
                [class.text-error]="timeRemaining() <= 60"
              >
                {{ formattedTime() }}
              </span>
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <!-- Left Column: Payment Details -->
          <div class="lg:col-span-7 space-y-8">
            <div>
              <h1
                class="font-headline text-4xl font-extrabold tracking-tighter text-on-surface mb-2"
              >
                Finalizar Pago
              </h1>
              <p class="text-on-surface-variant font-medium">
                Completa los detalles de tu tarjeta para asegurar tus entradas.
              </p>
            </div>

            <!-- Payment Form -->
            <div class="bg-surface-container-low rounded-3xl p-8 space-y-6">
              <div class="space-y-4">
                <label class="block font-headline text-lg font-bold"
                  >Información de la Tarjeta</label
                >

                <div class="space-y-2">
                  <label
                    class="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1"
                  >
                    Número de tarjeta
                  </label>
                  <div class="relative group">
                    <span
                      class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                      >credit_card</span
                    >
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      class="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all duration-200 placeholder:text-outline/50 font-medium"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label
                      class="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1"
                    >
                      Vencimiento
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      class="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all duration-200 placeholder:text-outline/50 font-medium"
                    />
                  </div>
                  <div class="space-y-2">
                    <label
                      class="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1"
                    >
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      class="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all duration-200 placeholder:text-outline/50 font-medium"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <label
                    class="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1"
                  >
                    Nombre en la tarjeta
                  </label>
                  <input
                    type="text"
                    placeholder="JUAN PEREZ"
                    class="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all duration-200 placeholder:text-outline/50 font-medium"
                  />
                </div>
              </div>

              <!-- Security Badge -->
              <div
                class="flex items-center gap-3 p-4 bg-primary-container/10 rounded-2xl border border-primary/10"
              >
                <span
                  class="material-symbols-outlined text-primary"
                  style="font-variation-settings: 'FILL' 1"
                  >verified_user</span
                >
                <p class="text-xs font-medium text-on-primary-container">
                  Tus datos están protegidos por encriptación bancaria de 256
                  bits.
                </p>
              </div>
            </div>

            <!-- Action Button -->
            <button
              (click)="handleConfirmPayment()"
              [disabled]="timeRemaining() <= 0"
              class="kinetic-gradient w-full py-5 rounded-full text-white font-headline text-lg font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Confirmar Pago Seguro
              <span class="material-symbols-outlined">lock</span>
            </button>
          </div>

          <!-- Right Column: Order Summary -->
          <div class="lg:col-span-5">
            <app-order-summary [order]="order()!" [event]="event()!" />
          </div>
        </div>
      }
    </main>

    <app-bottom-nav-bar />

    <!-- Order Expired Modal -->
    @if (showExpiredModal()) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      >
        <div
          class="bg-surface-container-lowest rounded-2xl p-8 max-w-md w-full shadow-2xl border border-outline-variant/10"
        >
          <!-- Expired Icon -->
          <div class="flex justify-center mb-6">
            <div
              class="w-16 h-16 rounded-full bg-error-container/20 flex items-center justify-center"
            >
              <span
                class="material-symbols-outlined text-error text-4xl"
                >timer_off</span
              >
            </div>
          </div>

          <!-- Expired Message -->
          <h3
            class="text-xl font-headline font-bold text-on-surface text-center mb-3"
          >
            Tu reserva ha expirado
          </h3>
          <p class="text-on-surface-variant text-center text-sm mb-2">
            El tiempo de reserva de 5 minutos ha transcurrido. Las entradas han
            sido liberadas.
          </p>
          <p class="text-on-surface-variant text-center text-xs mb-8">
            Serás redirigido a los detalles del evento en
            {{ redirectCountdown() }} segundo(s)...
          </p>

          <!-- Action Button -->
          <button
            (click)="goToEventDetail()"
            class="w-full py-3 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
          >
            Ir al evento ahora
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CheckoutPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private eventService = inject(EventService);

  order = signal<Order | null>(null);
  event = signal<Event | null>(null);
  loading = signal(true);
  timeRemaining = signal(0);
  orderExpired = signal(false);
  showExpiredModal = signal(false);
  redirectCountdown = signal(5);

  private timerSubscription: Subscription | null = null;
  private redirectSubscription: Subscription | null = null;

  formattedTime = computed(() => {
    const seconds = Math.max(0, this.timeRemaining());
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  private orderId = '';
  private expireTimeKey = '';

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('orderId');
    if (!id) {
      this.router.navigate(['/events']);
      return;
    }

    this.orderId = id;
    this.expireTimeKey = SESSION_STORAGE_KEY_PREFIX + id;

    this.loadData();
    this.initTimer();
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    this.redirectSubscription?.unsubscribe();
    // Clean up session storage
    sessionStorage.removeItem(this.expireTimeKey);
  }

  private loadData(): void {
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loadEvent(order.eventId);
      },
      error: (err) => {
        console.error('Error loading order:', err);
        this.router.navigate(['/events']);
      },
    });
  }

  private loadEvent(eventId: string): void {
    this.eventService.getEventById(eventId).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.loading.set(false);
      },
    });
  }

  private initTimer(): void {
    const stored = sessionStorage.getItem(this.expireTimeKey);
    let expireTime: number;

    if (stored) {
      expireTime = parseInt(stored, 10);
    } else {
      expireTime = Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000;
      sessionStorage.setItem(this.expireTimeKey, expireTime.toString());
    }

    const remaining = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
    this.timeRemaining.set(remaining);

    if (remaining <= 0) {
      this.handleOrderExpired();
      return;
    }

    this.timerSubscription = interval(1000).subscribe(() => {
      const newRemaining = Math.max(
        0,
        Math.floor((expireTime - Date.now()) / 1000),
      );
      this.timeRemaining.set(newRemaining);

      if (newRemaining <= 0) {
        this.handleOrderExpired();
      }
    });
  }

  private handleOrderExpired(): void {
    this.orderExpired.set(true);
    this.showExpiredModal.set(true);
    this.timerSubscription?.unsubscribe();

    // Auto redirect after 5 seconds
    this.redirectCountdown.set(5);
    this.redirectSubscription = interval(1000).subscribe((tick) => {
      const remaining = 5 - tick;
      if (remaining > 0) {
        this.redirectCountdown.set(remaining);
      } else {
        this.redirectSubscription?.unsubscribe();
        this.goToEventDetail();
      }
    });
  }

  goToEventDetail(): void {
    const eventId = this.event()?.id;
    if (eventId) {
      this.router.navigate(['/events', eventId]);
    } else {
      this.router.navigate(['/events']);
    }
  }

  handleConfirmPayment(): void {
    if (this.timeRemaining() <= 0) return;
    alert('Funcionalidad pendiente: procesamiento de pago');
  }
}
