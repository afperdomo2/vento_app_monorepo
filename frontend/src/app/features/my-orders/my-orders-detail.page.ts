import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { MyOrdersService } from './services/my-orders.service';
import { TicketService } from '../../core/services/ticket.service';
import { formatCurrency, formatDateTime } from '../../core/format/format';
import {
  OrderStatus,
  EnrichedOrder,
  OrderDetailState,
  initialOrderDetailState,
} from './models/order.model';
import { Ticket } from '../../core/models/ticket.models';

/**
 * Ticket con URL del QR ya generada (data URL).
 */
interface TicketWithQR extends Ticket {
  qrDataUrl: string;
  ticketNumber: number;
  totalTickets: number;
}

@Component({
  selector: 'app-my-orders-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavBar, BottomNavBar],
  template: `
    <app-top-nav-bar />
    <main class="pt-20 pb-24 md:pb-12 bg-surface-container-lowest min-h-screen">
      <div class="max-w-3xl mx-auto px-4">
        <!-- Header -->
        <header class="mb-6">
          <div class="flex items-center gap-4 mb-4">
            <button
              (click)="goBack()"
              class="p-2 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
            </button>
            <h1 class="font-headline text-2xl font-bold text-on-surface">Detalle del Pedido</h1>
          </div>
        </header>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="flex items-center justify-center py-16">
            <span class="material-symbols-outlined text-primary text-4xl animate-spin"
              >progress_activity</span
            >
          </div>
        }

        <!-- Error State -->
        @if (error() && !order()) {
          <div
            class="bg-error-container border border-error border-opacity-20 rounded-2xl p-6 text-center"
          >
            <span class="material-symbols-outlined text-error text-4xl mb-4">error</span>
            <p class="text-error font-bold mb-2">Error al cargar el pedido</p>
            <p class="text-error/80 text-sm mb-4">{{ error() }}</p>
            <button
              (click)="loadOrder()"
              class="kinetic-gradient text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Reintentar
            </button>
          </div>
        }

        <!-- Detail Content -->
        @if (order(); as ord) {
          <div class="space-y-6">
            <!-- Event Hero Image -->
            <div class="relative rounded-2xl overflow-hidden shadow-lg">
              <img
                [src]="ord.eventImageUrl"
                [alt]="ord.eventTitle"
                class="w-full h-64 object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div class="absolute bottom-4 left-4 right-4">
                <h2 class="text-white font-headline text-xl font-bold">
                  {{ ord.eventTitle }}
                </h2>
                <div class="flex items-center gap-4 mt-2 text-white/90 text-sm">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">calendar_today</span>
                    {{ ord.eventDate }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">schedule</span>
                    {{ ord.eventTime }}
                  </span>
                </div>
                <div class="flex items-center gap-1 mt-1 text-white/80 text-sm">
                  <span class="material-symbols-outlined text-sm">location_on</span>
                  {{ ord.eventVenue }}
                </div>
              </div>
            </div>

            <!-- Status Timeline -->
            <div class="bg-surface-container rounded-2xl p-6 shadow-sm">
              <h3 class="font-headline text-lg font-bold text-on-surface mb-4">
                Estado del Pedido
              </h3>
              <div class="flex items-center justify-between">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-sm">shopping_cart</span>
                  </div>
                  <span class="text-xs font-semibold text-primary">Creado</span>
                </div>
                <div class="flex-1 h-0.5 bg-primary mx-2"></div>
                <div class="flex flex-col items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    [class.bg-primary]="ord.status === 'PENDING'"
                    [class.bg-primary-container]="
                      ord.status !== 'PENDING' &&
                      ord.status !== 'CANCELLED' &&
                      ord.status !== 'EXPIRED'
                    "
                    [class.bg-surface-container-high]="
                      ord.status === 'CANCELLED' || ord.status === 'EXPIRED'
                    "
                  >
                    <span
                      class="material-symbols-outlined text-sm"
                      [class.text-white]="ord.status === 'PENDING'"
                      [class.text-primary]="
                        ord.status !== 'PENDING' &&
                        ord.status !== 'CANCELLED' &&
                        ord.status !== 'EXPIRED'
                      "
                      [class.text-on-surface-variant]="
                        ord.status === 'CANCELLED' || ord.status === 'EXPIRED'
                      "
                    >
                      {{ ord.status === 'PENDING' ? 'hourglass_top' : 'check_circle' }}
                    </span>
                  </div>
                  <span
                    class="text-xs font-semibold"
                    [class.text-primary]="ord.status === 'PENDING'"
                    [class.text-primary]="ord.status === 'CONFIRMED'"
                    [class.text-on-surface-variant]="
                      ord.status === 'CANCELLED' || ord.status === 'EXPIRED'
                    "
                  >
                    {{ ord.status === 'PENDING' ? 'Pendiente' : 'Procesado' }}
                  </span>
                </div>
                <div
                  class="flex-1 h-0.5 mx-2"
                  [class.bg-primary]="ord.status === 'CONFIRMED'"
                  [class.bg-surface-container-high]="ord.status !== 'CONFIRMED'"
                ></div>
                <div class="flex flex-col items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    [class.bg-primary-container]="ord.status === 'CONFIRMED'"
                    [class.bg-error-container]="
                      ord.status === 'CANCELLED' || ord.status === 'EXPIRED'
                    "
                    [class.bg-surface-container-high]="ord.status === 'PENDING'"
                  >
                    <span
                      class="material-symbols-outlined text-sm"
                      [class.text-primary]="ord.status === 'CONFIRMED'"
                      [class.text-error]="
                        ord.status === 'CANCELLED' || ord.status === 'EXPIRED'
                      "
                      [class.text-on-surface-variant]="ord.status === 'PENDING'"
                    >
                      {{
                        ord.status === 'CONFIRMED'
                          ? 'check_circle'
                          : ord.status === 'CANCELLED' || ord.status === 'EXPIRED'
                            ? 'cancel'
                            : 'hourglass_empty'
                      }}
                    </span>
                  </div>
                  <span
                    class="text-xs font-semibold"
                    [class.text-primary]="ord.status === 'CONFIRMED'"
                    [class.text-error]="
                      ord.status === 'CANCELLED' || ord.status === 'EXPIRED'
                    "
                    [class.text-on-surface-variant]="ord.status === 'PENDING'"
                  >
                    {{ getStatusLabel(ord.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="bg-surface-container rounded-2xl shadow-sm overflow-hidden">
              <div class="p-6 border-b border-outline-variant/10">
                <h3 class="font-headline text-lg font-bold text-on-surface">Resumen del Pedido</h3>
              </div>
              <div class="p-6 space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-on-surface-variant text-sm">ID del Pedido</span>
                  <span class="font-mono text-sm text-on-surface">{{
                    formatOrderId(ord.id)
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-on-surface-variant text-sm">Estado</span>
                  <span
                    class="px-3 py-1 rounded-full text-xs font-bold"
                    [class]="getStatusBadgeClass(ord.status)"
                  >
                    {{ getStatusLabel(ord.status) }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-on-surface-variant text-sm">Cantidad de Tickets</span>
                  <span class="font-bold text-on-surface">{{ ord.quantity }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-on-surface-variant text-sm">Precio por Ticket</span>
                  <span class="text-on-surface">{{ ord.eventPrice }}</span>
                </div>
                <div
                  class="border-t border-outline-variant/10 pt-4 flex justify-between items-center"
                >
                  <span class="font-bold text-on-surface">Total</span>
                  <span class="font-headline text-xl font-bold text-primary">{{
                    formatTotal(ord.totalAmount)
                  }}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-on-surface-variant">Creado</span>
                  <span class="text-on-surface-variant">{{
                    formatDateTime(ord.createdAt)
                  }}</span>
                </div>
                @if (ord.updatedAt !== ord.createdAt) {
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-on-surface-variant">Última actualización</span>
                    <span class="text-on-surface-variant">{{
                      formatDateTime(ord.updatedAt)
                    }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Tickets Section (only for CONFIRMED orders) -->
            @if (ord.status === 'CONFIRMED') {
              @if (ticketsLoading()) {
                <div class="bg-surface-container rounded-2xl p-6">
                  <h3 class="font-headline text-lg font-bold text-on-surface mb-4">Tus Entradas</h3>
                  <div class="flex items-center justify-center py-8">
                    <span class="material-symbols-outlined text-primary text-3xl animate-spin"
                      >progress_activity</span
                    >
                    <span class="ml-3 text-on-surface-variant font-medium">Generando tus entradas...</span>
                  </div>
                </div>
              } @else if (tickets().length > 0) {
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1"
                      >confirmation_number</span
                    >
                    <h3 class="font-headline text-lg font-bold text-on-surface">Tus Entradas</h3>
                    <span class="text-xs font-bold text-primary bg-primary-container px-2 py-0.5 rounded-full">
                      {{ tickets().length }}
                    </span>
                  </div>

                  <div class="space-y-4">
                    @for (ticket of tickets(); track ticket.id) {
                      <div
                        class="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10"
                      >
                        <!-- Ticket Header -->
                        <div class="flex items-center justify-between px-5 py-3 bg-surface-container-highest/50">
                          <span class="font-headline text-sm font-bold text-on-surface">
                            Entrada {{ ticket.ticketNumber }} de {{ ticket.totalTickets }}
                          </span>
                          <span
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            [class]="getTicketStatusClass(ticket.status)"
                          >
                            {{ getTicketStatusLabel(ticket.status) }}
                          </span>
                        </div>

                        <!-- Ticket Body -->
                        <div class="flex flex-col sm:flex-row">
                          <!-- Left: Event Info -->
                          <div class="flex-1 p-5 sm:border-r border-dashed border-outline-variant/30">
                            <div class="flex items-start gap-3">
                              <img
                                [src]="ord.eventImageUrl"
                                [alt]="ord.eventTitle"
                                class="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                              />
                              <div class="min-w-0">
                                <p class="font-bold text-on-surface text-sm truncate">
                                  {{ ord.eventTitle }}
                                </p>
                                <div class="flex items-center gap-1 mt-1 text-on-surface-variant text-xs">
                                  <span class="material-symbols-outlined text-sm">calendar_today</span>
                                  {{ ord.eventDate }}
                                </div>
                                <div class="flex items-center gap-1 text-on-surface-variant text-xs">
                                  <span class="material-symbols-outlined text-sm">location_on</span>
                                  {{ ord.eventVenue }}
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Right: QR Code -->
                          <div class="flex flex-col items-center justify-center p-5 sm:min-w-[160px]">
                            <img
                              [src]="ticket.qrDataUrl"
                              alt="Código QR"
                              class="w-28 h-28 rounded-lg"
                            />
                            <p class="font-mono text-xs font-bold text-on-surface mt-2 tracking-widest">
                              {{ ticket.accessCode }}
                            </p>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            }

            <!-- Actions -->
            <div class="flex gap-3">
              <a
                [routerLink]="'/events/' + ord.eventId"
                class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                <span class="material-symbols-outlined text-lg">event</span>
                Ver Evento
              </a>
              <button
                (click)="goBack()"
                class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm kinetic-gradient text-white hover:scale-105 transition-transform"
              >
                <span class="material-symbols-outlined text-lg">arrow_back</span>
                Volver
              </button>
            </div>
          </div>
        }
      </div>
    </main>
    <app-bottom-nav-bar />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class MyOrdersDetailPage implements OnInit {
  private orderService = inject(MyOrdersService);
  private ticketService = inject(TicketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private state = signal<OrderDetailState>(initialOrderDetailState);
  readonly order = computed(() => this.state().order);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  // Tickets state
  tickets = signal<TicketWithQR[]>([]);
  ticketsLoading = signal(false);

  private readonly loadTicketsEffect = effect(() => {
    const order = this.order();
    if (order?.status === 'CONFIRMED') {
      this.loadTickets();
    }
  });

  ngOnInit(): void {
    this.loadOrder();
  }

  loadOrder(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.update((s) => ({ ...s, error: 'ID de pedido no válido', isLoading: false }));
      return;
    }

    this.state.update((s) => ({ ...s, isLoading: true, error: null }));

    this.orderService.getOrderById(id).subscribe({
      next: (order: EnrichedOrder) => {
        this.state.update((s) => ({ ...s, order, isLoading: false, error: null }));
      },
      error: (err: Error) => {
        this.state.update((s) => ({ ...s, isLoading: false, error: err.message }));
      },
    });
  }

  loadTickets(): void {
    const orderId = this.state().order?.id;
    if (!orderId) return;

    this.ticketsLoading.set(true);

    this.ticketService.getTicketsByOrder(orderId).subscribe({
      next: (tickets) => {
        const ticketsWithQR: TicketWithQR[] = tickets.map((ticket, index) => ({
          ...ticket,
          qrDataUrl: '',
          ticketNumber: index + 1,
          totalTickets: tickets.length,
        }));
        this.tickets.set(ticketsWithQR);
        this.ticketsLoading.set(false);
        this.generateQRCodes();
      },
      error: () => {
        this.ticketsLoading.set(false);
      },
    });
  }

  /**
   * Genera los códigos QR para cada ticket.
   * Se hace después de renderizar para que el DOM esté disponible.
   */
  private async generateQRCodes(): Promise<void> {
    const updated = [...this.tickets()];
    for (let i = 0; i < updated.length; i++) {
      try {
        const qrDataUrl = await QRCode.toDataURL(updated[i].accessCode, {
          width: 200,
          margin: 1,
          color: {
            dark: '#1C1B1F',
            light: '#FFFFFF',
          },
        });
        updated[i] = { ...updated[i], qrDataUrl };
      } catch (err) {
        console.error(`Error generating QR for ticket ${updated[i].id}:`, err);
      }
    }
    this.tickets.set(updated);
  }

  goBack(): void {
    this.router.navigate(['/my-orders']);
  }

  getStatusLabel(status: OrderStatus | undefined): string {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado',
      EXPIRED: 'Expirado',
    };
    return status ? labels[status] : '';
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

  getTicketStatusLabel(status: Ticket['status']): string {
    const labels: Record<Ticket['status'], string> = {
      ACTIVE: 'Activo',
      CANCELLED: 'Cancelado',
      USED: 'Usado',
    };
    return labels[status] || status;
  }

  getTicketStatusClass(status: Ticket['status']): string {
    const classes: Record<Ticket['status'], string> = {
      ACTIVE: 'bg-primary-container/20 text-primary',
      CANCELLED: 'bg-error-container/20 text-error',
      USED: 'bg-surface-container-highest text-on-surface-variant',
    };
    return classes[status] || 'bg-surface-container-high text-on-surface-variant';
  }

  formatOrderId(id: string): string {
    return id.length > 12 ? `...${id.slice(-8)}` : id;
  }

  formatTotal(amount: number): string {
    return formatCurrency(amount);
  }

  formatDateTime(isoString: string): string {
    return formatDateTime(isoString);
  }
}
