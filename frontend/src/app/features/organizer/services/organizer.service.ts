import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getEnvValue } from '../../../../environments/env.config';

const API_URL = getEnvValue('API_URL');

/**
 * Event data for organizer dashboard (enriched from EventDto)
 */
interface OrganizerEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  status: 'sold-out' | 'selling' | 'draft';
  percentageSold?: number;
  totalTickets?: number;
  soldTickets?: number;
}

/**
 * KPI data for dashboard (from backend analytics)
 */
interface OrganizerKPIs {
  totalSales: number;
  salesGrowth: number;
  totalAttendees: number;
  currentCapacity: number;
  totalCapacity: number;
  monthlyGoal: number;
}

/**
 * Sales chart point (from backend)
 */
interface SalesChartPoint {
  date: string;
  quantity: number;
  revenue: number;
}

/**
 * Backend OrderSummaryDto response
 */
interface OrderSummaryResponse {
  data: {
    totalRevenue: number;
    totalOrders: number;
    totalTickets: number;
    totalEvents: number;
  };
}

/**
 * Backend EventDto response (paginated)
 */
interface EventsResponse {
  data: {
    content: Array<{
      id: string;
      name: string;
      description: string;
      eventDate: string;
      venue: string;
      totalCapacity: number;
      availableTickets: number;
      price: number;
      latitude: number | null;
      longitude: number | null;
      createdAt: string;
      updatedAt: string;
    }>;
    totalPages: number;
    totalElements: number;
  };
}

/**
 * Backend SalesChart response
 */
interface SalesChartResponse {
  data: Array<{
    date: string;
    quantity: number;
    revenue: number;
  }>;
}

/**
 * Organizer dashboard state
 */
interface OrganizerState {
  events: OrganizerEvent[];
  kpis: OrganizerKPIs;
  salesChart: SalesChartPoint[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OrganizerState = {
  events: [],
  kpis: {
    totalSales: 0,
    salesGrowth: 0,
    totalAttendees: 0,
    currentCapacity: 0,
    totalCapacity: 0,
    monthlyGoal: 50000,
  },
  salesChart: [],
  isLoading: false,
  error: null,
};

/**
 * Organizer Service
 *
 * Manages state for the organizer dashboard feature.
 * Connects to real backend APIs for KPIs, events, and sales chart data.
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizerService {
  private http = inject(HttpClient);

  private state = signal<OrganizerState>(initialState);

  // Public signals for components
  readonly events = computed(() => this.state().events);
  readonly kpis = computed(() => this.state().kpis);
  readonly salesChart = computed(() => this.state().salesChart);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  /**
   * Load organizer dashboard data from backend
   */
  async loadDashboardData(): Promise<void> {
    this.state.update((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const [summaryRes, eventsRes] = await Promise.all([
        firstValueFrom(this.http.get<OrderSummaryResponse>(`${API_URL}/api/orders/analytics/summary`)),
        firstValueFrom(this.http.get<EventsResponse>(`${API_URL}/api/events?size=100&sortBy=eventDate&sortDir=ASC`)),
      ]);

      const summary = summaryRes.data;
      const rawEvents = eventsRes.data.content;

      const kpis: OrganizerKPIs = {
        totalSales: summary.totalRevenue,
        salesGrowth: 0, // Requires historical comparison — set to 0 for now
        totalAttendees: summary.totalTickets,
        currentCapacity: summary.totalTickets,
        totalCapacity: rawEvents.reduce((sum, e) => sum + e.totalCapacity, 0),
        monthlyGoal: 50000,
      };

      const events: OrganizerEvent[] = rawEvents
        .filter((e) => e.totalCapacity > 0)
        .map((e) => {
          const sold = e.totalCapacity - e.availableTickets;
          const pct = e.totalCapacity > 0 ? Math.round((sold / e.totalCapacity) * 100) : 0;
          return {
            id: e.id,
            title: e.name,
            date: this.formatDate(e.eventDate),
            location: e.venue,
            imageUrl: this.getEventImage(e.name),
            status: pct === 100 ? 'sold-out' : 'selling',
            percentageSold: pct,
            totalTickets: e.totalCapacity,
            soldTickets: sold,
          };
        });

      this.state.update((s) => ({
        ...s,
        isLoading: false,
        events,
        kpis,
      }));
    } catch (err) {
      this.state.update((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error loading dashboard data',
      }));
    }
  }

  /**
   * Load sales chart data for a given time range
   */
  async loadSalesChart(range: '7d' | '30d' | 'all' = '7d'): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<SalesChartResponse>(`${API_URL}/api/orders/analytics/sales-chart?range=${range}`),
      );
      this.state.update((s) => ({ ...s, salesChart: res.data }));
    } catch (_err) {
      // If no data, keep empty chart
      this.state.update((s) => ({ ...s, salesChart: [] }));
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }

  private formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private getEventImage(eventName: string): string {
    // Use a deterministic placeholder based on event name
    const images = [
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200&h=200&fit=crop',
    ];
    const index = eventName.length % images.length;
    return images[index];
  }
}
