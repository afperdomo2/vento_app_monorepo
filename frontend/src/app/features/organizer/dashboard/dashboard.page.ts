import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizerService } from '../services/organizer.service';

type ChartRange = '7d' | '30d' | 'all';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Header Section -->
    <header class="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
      <div>
        <h2 class="font-headline text-4xl font-extrabold text-on-surface tracking-tight leading-none mb-2">Dashboard General</h2>
        <p class="text-on-surface-variant font-medium">Métricas globales de la plataforma de eventos.</p>
      </div>
      <div class="flex items-center space-x-3">
        @if (isLoading()) {
          <span class="text-xs font-bold text-on-surface-variant animate-pulse">Cargando datos...</span>
        }
        @if (error()) {
          <div class="bg-error-container/20 text-error px-4 py-2 rounded-xl text-xs font-bold">
            {{ error() }}
            <button class="ml-2 underline" type="button" (click)="organizerService.clearError(); organizerService.loadDashboardData()">Reintentar</button>
          </div>
        }
      </div>
    </header>

    <!-- KPI Grid -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <!-- Ventas Totales -->
      <div class="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between h-40 shadow-[0_4px_20px_rgba(74,64,224,0.03)] hover:translate-y-[-4px] transition-transform">
        <div class="flex justify-between items-start">
          <span class="text-on-surface-variant font-bold text-sm">Ventas Totales</span>
          <span class="material-symbols-outlined text-primary-fixed">payments</span>
        </div>
        <div>
          @if (isLoading()) {
            <div class="h-9 w-32 bg-surface-container-low rounded animate-pulse"></div>
          } @else {
            <div class="text-3xl font-headline font-extrabold text-on-surface">{{ kpis().totalSales | currency:'USD':'symbol':'1.2-2' }}</div>
          }
          @if (kpis().salesGrowth !== 0) {
            <div class="text-xs text-green-600 font-bold flex items-center mt-1">
              <span class="material-symbols-outlined text-xs mr-1">trending_up</span>
              +{{ kpis().salesGrowth }}% vs mes anterior
            </div>
          }
        </div>
      </div>

      <!-- Asistentes / Tickets Vendidos -->
      <div class="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between h-40 shadow-[0_4px_20px_rgba(74,64,224,0.03)] hover:translate-y-[-4px] transition-transform">
        <div class="flex justify-between items-start">
          <span class="text-on-surface-variant font-bold text-sm">Tickets Vendidos</span>
          <span class="material-symbols-outlined text-primary-fixed">group</span>
        </div>
        <div>
          @if (isLoading()) {
            <div class="h-9 w-20 bg-surface-container-low rounded animate-pulse"></div>
          } @else {
            <div class="text-3xl font-headline font-extrabold text-on-surface">{{ kpis().totalAttendees | number }}</div>
          }
          <div class="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            @if (kpis().totalCapacity > 0) {
              <div class="bg-primary h-full rounded-full transition-all"
                   [style.width.%]="(kpis().currentCapacity / kpis().totalCapacity) * 100"></div>
            }
          </div>
        </div>
      </div>

      <!-- Aforo / Capacidad -->
      <div class="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between h-40 shadow-[0_4px_20px_rgba(74,64,224,0.03)] hover:translate-y-[-4px] transition-transform border-2 border-primary-container/20">
        <div class="flex justify-between items-start">
          <span class="text-on-surface-variant font-bold text-sm">Capacidad Total</span>
          <span class="material-symbols-outlined text-tertiary">sensors</span>
        </div>
        <div>
          @if (isLoading()) {
            <div class="h-9 w-32 bg-surface-container-low rounded animate-pulse"></div>
          } @else {
            <div class="text-3xl font-headline font-extrabold text-on-surface">
              {{ kpis().currentCapacity | number }} / {{ kpis().totalCapacity | number }}
            </div>
          }
          @if (kpis().totalCapacity > 0) {
            <p class="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">
              {{ (kpis().currentCapacity / kpis().totalCapacity * 100) | number:'1.0-0' }}% de Capacidad Ocupada
            </p>
          }
        </div>
      </div>
    </section>

    <!-- Sales Chart -->
    <div class="bg-surface-container rounded-2xl p-8 relative overflow-hidden mb-12">
      <div class="flex justify-between items-center mb-8">
        <h3 class="font-headline text-xl font-bold">Ventas por Día</h3>
        <div class="flex bg-surface-container-lowest p-1 rounded-full ghost-border">
          @for (r of chartRanges; track r.value) {
            <button class="px-4 py-1.5 text-xs font-bold rounded-full transition-colors"
                    type="button"
                    [class.bg-primary]="chartRange() === r.value"
                    [class.text-white]="chartRange() === r.value"
                    [class.text-on-surface-variant]="chartRange() !== r.value"
                    (click)="onChartRangeChange(r.value)">
              {{ r.label }}
            </button>
          }
        </div>
      </div>

      @if (salesChart().length > 0) {
        <div class="h-64 flex items-end justify-between space-x-2">
          @for (point of salesChart(); track point.date) {
            <div class="flex flex-col items-center flex-1 group" [style.height.%]="100">
              <div class="w-full rounded-t-lg transition-all group-hover:opacity-80 cursor-pointer relative"
                   [style.height.%]="barHeight(point.quantity)"
                   [class.bg-primary]="isMaxBar(point.quantity)"
                   [class.shadow-[0_-4px_15px_rgba(74,64,224,0.3)]]="isMaxBar(point.quantity)"
                   [class.bg-primary-container/20]="!isMaxBar(point.quantity)">
                <!-- Tooltip -->
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-lowest text-on-surface text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none z-10">
                  {{ point.quantity }} tix — {{ point.revenue | currency:'USD':'symbol':'1.0-0' }}
                </div>
              </div>
            </div>
          }
        </div>
        <div class="flex justify-between mt-4 px-2">
          @for (point of salesChart(); track point.date; let i = $index; let last = $last) {
            <span class="text-[10px] font-bold text-slate-400 uppercase truncate flex-1 text-center"
                  [class.text-primary]="last">
              {{ formatChartDate(point.date) }}
            </span>
          }
        </div>
      } @else {
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <span class="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">bar_chart</span>
            <p class="text-sm text-on-surface-variant font-medium">Sin datos de ventas aún</p>
            <p class="text-xs text-on-surface-variant/60 mt-1">Los datos aparecerán cuando se confirmen pedidos</p>
          </div>
        </div>
      }
    </div>

    <!-- Events List -->
    <div>
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-headline text-xl font-bold">Eventos en la Plataforma</h3>
      </div>

      @if (isLoading()) {
        <div class="space-y-4">
          @for (_ of [1, 2, 3]; track _) {
            <div class="bg-surface-container-lowest rounded-xl p-4 flex items-center space-x-4 animate-pulse">
              <div class="w-16 h-16 rounded-lg bg-surface-container-low"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-40 bg-surface-container-low rounded"></div>
                <div class="h-3 w-24 bg-surface-container-low rounded"></div>
              </div>
            </div>
          }
        </div>
      } @else if (events().length === 0) {
        <div class="bg-surface-container-lowest rounded-xl p-12 text-center">
          <span class="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-4">event_busy</span>
          <p class="text-lg font-bold text-on-surface">No hay eventos registrados</p>
          <p class="text-sm text-on-surface-variant mt-1">Crea tu primer evento desde la sección de Eventos</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (event of events(); track event.id) {
            <div class="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-sm ghost-border hover:shadow-md transition-shadow">
              <div class="flex items-center space-x-4">
                <div class="w-16 h-16 rounded-lg bg-surface-container overflow-hidden">
                  <img [src]="event.imageUrl" [alt]="event.title" class="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 class="font-bold text-on-surface">{{ event.title }}</h4>
                  <p class="text-xs text-on-surface-variant">{{ event.date }} • {{ event.location }}</p>
                  <div class="mt-1 flex items-center space-x-2">
                    @if (event.status === 'sold-out') {
                      <span class="bg-tertiary-container text-on-tertiary-container text-[10px] px-2 py-0.5 rounded-full font-bold">Agotado</span>
                    } @else if (event.status === 'selling') {
                      <span class="bg-primary-container/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{{ event.percentageSold }}% Vendido</span>
                    }
                  </div>
                </div>
              </div>
              <div class="text-right text-xs text-on-surface-variant">
                <div class="font-bold">{{ event.soldTickets }} / {{ event.totalTickets }}</div>
                <div class="text-[10px]">tickets</div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DashboardPage implements OnInit {
  protected organizerService = inject(OrganizerService);

  readonly events = this.organizerService.events;
  readonly kpis = this.organizerService.kpis;
  readonly salesChart = this.organizerService.salesChart;
  readonly isLoading = this.organizerService.isLoading;
  readonly error = this.organizerService.error;

  readonly chartRanges = [
    { value: '7d' as ChartRange, label: '7D' },
    { value: '30d' as ChartRange, label: '30D' },
    { value: 'all' as ChartRange, label: 'ALL' },
  ];
  readonly chartRange = signal<ChartRange>('7d');

  ngOnInit(): void {
    this.organizerService.loadDashboardData();
    this.organizerService.loadSalesChart('7d');
  }

  onChartRangeChange(range: ChartRange): void {
    this.chartRange.set(range);
    this.organizerService.loadSalesChart(range);
  }

  barHeight(quantity: number): number {
    const max = Math.max(...this.salesChart().map((p) => p.quantity), 1);
    return Math.max((quantity / max) * 95, 5);
  }

  isMaxBar(quantity: number): boolean {
    const max = Math.max(...this.salesChart().map((p) => p.quantity), 0);
    return quantity === max && max > 0;
  }

  formatChartDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }
}
