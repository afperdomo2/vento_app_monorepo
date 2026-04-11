import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getEnvValue } from '../../../../environments/env.config';

const API_URL = getEnvValue('API_URL');

interface EventMetric {
  eventId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  totalCapacity: number;
  availableTickets: number;
  occupancyRate: number;
}

interface BackendAnalytics {
  eventId: string;
  totalOrders: number;
  totalTickets: number;
  totalRevenue: number;
}

interface BackendEvent {
  id: string;
  name: string;
  eventDate: string;
  venue: string;
  totalCapacity: number;
  availableTickets: number;
}

interface AnalyticsResponse {
  data: BackendAnalytics[];
}

interface EventsResponse {
  data: {
    content: BackendEvent[];
  };
}

@Component({
  selector: 'app-organizer-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Header -->
    <header class="mb-10">
      <h2 class="font-headline text-4xl font-extrabold text-on-surface tracking-tight leading-none mb-2">Analíticas</h2>
      <p class="text-on-surface-variant font-medium">Rendimiento de eventos por ingresos y ocupación.</p>
    </header>

    <!-- Loading State -->
    @if (isLoading()) {
      <div class="space-y-6">
        @for (_ of [1, 2, 3, 4]; track _) {
          <div class="bg-surface-container-lowest rounded-xl p-6 animate-pulse">
            <div class="h-4 w-48 bg-surface-container-low rounded mb-3"></div>
            <div class="h-3 w-32 bg-surface-container-low rounded"></div>
          </div>
        }
      </div>
    }

    <!-- Empty State -->
    @else if (metrics().length === 0) {
      <div class="bg-surface-container-lowest rounded-2xl p-12 text-center">
        <span class="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">bar_chart</span>
        <p class="text-lg font-bold text-on-surface">Sin datos de ventas aún</p>
        <p class="text-sm text-on-surface-variant mt-1">Las métricas aparecerán cuando se confirmen pedidos</p>
      </div>
    }

    <!-- Metrics List -->
    @else {
      <!-- Summary KPIs -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-surface-container-lowest rounded-xl p-6">
          <span class="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Total Revenue</span>
          <div class="text-2xl font-headline font-extrabold text-on-surface mt-1">
            {{ totalRevenue() | currency:'USD':'symbol':'1.0-0' }}
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl p-6">
          <span class="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Eventos con Ventas</span>
          <div class="text-2xl font-headline font-extrabold text-on-surface mt-1">
            {{ metrics().length }}
          </div>
        </div>
        <div class="bg-surface-container-lowest rounded-xl p-6">
          <span class="text-on-surface-variant font-bold text-xs uppercase tracking-wider">Evento Top</span>
          <div class="text-lg font-headline font-bold text-on-surface mt-1 truncate">
            {{ topEvent() }}
          </div>
        </div>
      </section>

      <!-- Event Ranking Table -->
      <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm ghost-border">
        <div class="px-6 py-4 border-b border-outline/10">
          <h3 class="font-headline text-lg font-bold">Ranking por Ingresos</h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-outline/10 text-on-surface-variant text-xs uppercase tracking-wider">
                <th class="text-left px-6 py-3 font-bold">#</th>
                <th class="text-left px-6 py-3 font-bold">Evento</th>
                <th class="text-right px-6 py-3 font-bold">Ingresos</th>
                <th class="text-right px-6 py-3 font-bold">Tickets</th>
                <th class="text-right px-6 py-3 font-bold">Órdenes</th>
                <th class="text-right px-6 py-3 font-bold w-40">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              @for (m of metrics(); track m.eventId; let i = $index) {
                <tr class="border-b border-outline/5 hover:bg-surface-container-low/50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      {{ i === 0 ? 'bg-primary text-white' : i === 1 ? 'bg-primary-container/30 text-primary' : i === 2 ? 'bg-secondary-container/30 text-secondary' : 'bg-surface-container text-on-surface-variant' }}">
                      {{ i + 1 }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="font-bold text-on-surface">{{ m.eventName }}</div>
                    <div class="text-xs text-on-surface-variant">{{ m.eventDate }} • {{ m.venue }}</div>
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-on-surface">
                    {{ m.totalRevenue | currency:'USD':'symbol':'1.0-0' }}
                  </td>
                  <td class="px-6 py-4 text-right text-on-surface-variant">
                    {{ m.totalTickets }}
                  </td>
                  <td class="px-6 py-4 text-right text-on-surface-variant">
                    {{ m.totalOrders }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-end space-x-2">
                      <div class="w-20 bg-surface-container-low h-2 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all"
                             [class.bg-primary]="m.occupancyRate >= 50"
                             [class.bg-tertiary]="m.occupancyRate < 50"
                             [style.width.%]="m.occupancyRate">
                        </div>
                      </div>
                      <span class="text-xs font-bold text-on-surface-variant w-10 text-right">
                        {{ m.occupancyRate | number:'1.0-0' }}%
                      </span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AnalyticsPage implements OnInit {
  private http = inject(HttpClient);

  readonly metrics = signal<EventMetric[]>([]);
  readonly isLoading = signal(true);

  readonly totalRevenue = signal(0);
  readonly topEvent = signal('—');

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const [analyticsRes, eventsRes] = await Promise.all([
        firstValueFrom(this.http.get<AnalyticsResponse>(`${API_URL}/api/orders/analytics/by-event`)),
        firstValueFrom(this.http.get<EventsResponse>(`${API_URL}/api/events?size=100`)),
      ]);

      const analyticsMap = new Map(
        analyticsRes.data.map((a) => [a.eventId, a]),
      );

      const allMetrics: EventMetric[] = eventsRes.data.content
        .filter((e) => analyticsMap.has(e.id))
        .map((e) => {
          const a = analyticsMap.get(e.id)!;
          const sold = e.totalCapacity - e.availableTickets;
          const occupancyRate = e.totalCapacity > 0 ? (sold / e.totalCapacity) * 100 : 0;
          return {
            eventId: e.id,
            eventName: e.name,
            eventDate: this.formatDate(e.eventDate),
            venue: e.venue,
            totalRevenue: a.totalRevenue,
            totalOrders: a.totalOrders,
            totalTickets: a.totalTickets,
            totalCapacity: e.totalCapacity,
            availableTickets: e.availableTickets,
            occupancyRate,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      this.metrics.set(allMetrics);
      this.totalRevenue.set(allMetrics.reduce((sum, m) => sum + m.totalRevenue, 0));
      this.topEvent.set(allMetrics[0]?.eventName ?? '—');
    } catch (_err) {
      this.metrics.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
