import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { MyOrdersService } from './services/my-orders.service';
import { OrderStatus, EnrichedOrder, OrdersState, initialOrdersState } from './models/order.model';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavBar, BottomNavBar],
  template: `
    <app-top-nav-bar />
    <main class="pt-20 pb-24 md:pb-12 bg-surface-container-lowest min-h-screen">
      <div class="max-w-3xl mx-auto px-4">

        <!-- Header -->
        <header class="mb-6">
          <h1 class="font-headline text-2xl font-bold text-on-surface">Mis Pedidos</h1>
          <p class="text-on-surface-variant text-sm">
            {{ totalElements() }} pedido{{ totalElements() !== 1 ? 's' : '' }} en total
          </p>
        </header>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="space-y-4">
            @for (i of [1, 2, 3]; track i) {
              <div class="bg-surface-container rounded-2xl p-4 flex gap-4 animate-pulse">
                <div class="w-24 h-24 rounded-xl bg-surface-container-high flex-shrink-0"></div>
                <div class="flex-1 space-y-3 py-1">
                  <div class="h-5 w-3/4 rounded bg-surface-container-high"></div>
                  <div class="h-4 w-1/2 rounded bg-surface-container-high"></div>
                  <div class="h-4 w-1/3 rounded bg-surface-container-high"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Error State -->
        @if (error() && !orders().length) {
          <div class="bg-error-container border border-error border-opacity-20 rounded-2xl p-6 text-center">
            <span class="material-symbols-outlined text-error text-4xl mb-4">error</span>
            <p class="text-error font-bold mb-2">Error al cargar los pedidos</p>
            <p class="text-error/80 text-sm mb-4">{{ error() }}</p>
            <button
              (click)="loadOrders()"
              class="kinetic-gradient text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Reintentar
            </button>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && !orders().length && !error()) {
          <div class="flex flex-col items-center justify-center py-16 text-center">
            <span class="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">receipt_long</span>
            <h3 class="font-headline text-xl font-bold text-on-surface mb-2">Aún no tienes pedidos</h3>
            <p class="text-on-surface-variant text-sm max-w-xs mb-6">
              Explora nuestros eventos y reserva tus entradas para vivir experiencias increíbles.
            </p>
            <a
              routerLink="/events"
              class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Explorar Eventos
            </a>
          </div>
        }

        <!-- Orders List -->
        @if (!isLoading() && orders().length) {
          <div class="space-y-4">
            @for (order of orders(); track order.id) {
              <div
                class="bg-surface-container rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                [routerLink]="'/my-orders/' + order.id"
              >
                <div class="flex gap-4 p-4">
                  <!-- Event Image -->
                  <div class="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      [src]="order.eventImageUrl"
                      [alt]="order.eventTitle"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <!-- Order Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <h3 class="font-headline font-bold text-on-surface text-sm truncate">
                        {{ order.eventTitle }}
                      </h3>
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
                        [class]="getStatusBadgeClass(order.status)"
                      >
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </div>

                    <div class="flex items-center gap-3 text-xs text-on-surface-variant mb-2">
                      <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">calendar_today</span>
                        {{ order.eventDate }}
                      </span>
                      <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">schedule</span>
                        {{ order.eventTime }}
                      </span>
                    </div>

                    <div class="flex items-center gap-1 text-xs text-on-surface-variant mb-2">
                      <span class="material-symbols-outlined text-xs">location_on</span>
                      <span class="truncate">{{ order.eventVenue }}</span>
                    </div>

                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3 text-sm">
                        <span class="text-on-surface-variant">
                          {{ order.quantity }} ticket{{ order.quantity !== 1 ? 's' : '' }}
                        </span>
                        <span class="font-bold text-primary">{{ formatTotal(order.totalAmount) }}</span>
                      </div>
                      <span class="text-xs text-on-surface-variant flex items-center gap-1 group-hover:text-primary transition-colors">
                        Ver detalle
                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between mt-8 pt-6 border-t border-outline-variant/10">
              <button
                (click)="goToPage(currentPage() - 1)"
                [disabled]="currentPage() === 0"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed
                       bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                <span class="material-symbols-outlined text-lg">chevron_left</span>
                Anterior
              </button>

              <div class="flex items-center gap-2 text-sm text-on-surface-variant">
                <span class="font-bold text-on-surface">{{ currentPage() + 1 }}</span>
                <span>de</span>
                <span class="font-bold text-on-surface">{{ totalPages() }}</span>
              </div>

              <button
                (click)="goToPage(currentPage() + 1)"
                [disabled]="currentPage() >= totalPages() - 1"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed
                       bg-surface-container text-on-surface hover:bg-surface-container-high"
              >
                Siguiente
                <span class="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          }
        }
      </div>
    </main>
    <app-bottom-nav-bar />
  `,
  styles: [`:host { display: block; }`]
})
export class MyOrdersPage implements OnInit {
  private orderService = inject(MyOrdersService);

  private state = signal<OrdersState>(initialOrdersState);

  readonly orders = computed(() => this.state().orders);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly currentPage = computed(() => this.state().currentPage);
  readonly totalPages = computed(() => this.state().totalPages);
  readonly totalElements = computed(() => this.state().totalElements);
  readonly pageSize = computed(() => this.state().pageSize);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const page = this.state().currentPage;
    const size = this.state().pageSize;
    this.state.update(s => ({ ...s, isLoading: true, error: null }));

    this.orderService.getMyOrders(page, size).subscribe({
      next: (result) => {
        this.state.update(s => ({
          ...s,
          orders: result.orders,
          isLoading: false,
          error: null,
          totalPages: result.page.totalPages,
          totalElements: result.page.totalElements,
        }));
      },
      error: (err) => {
        this.state.update(s => ({ ...s, isLoading: false, error: err.message }));
      },
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.state().totalPages) return;
    this.state.update(s => ({ ...s, currentPage: page }));
    this.loadOrders();
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado',
    };
    return labels[status];
  }

  getStatusBadgeClass(status: OrderStatus): string {
    const classes: Record<OrderStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-primary/10 text-primary',
      CANCELLED: 'bg-surface-container-high text-on-surface-variant',
      EXPIRED: 'bg-error/10 text-error',
    };
    return classes[status];
  }

  formatTotal(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
}
