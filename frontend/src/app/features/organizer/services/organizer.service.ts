import { Injectable, signal, computed } from '@angular/core';

/**
 * Event data for organizer dashboard
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
 * Notification for organizer dashboard
 */
interface OrganizerNotification {
  id: string;
  type: 'alert' | 'sale' | 'registration';
  title: string;
  message: string;
  time: string;
}

/**
 * KPI data for dashboard
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
 * Organizer dashboard state
 */
interface OrganizerState {
  events: OrganizerEvent[];
  notifications: OrganizerNotification[];
  kpis: OrganizerKPIs;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrganizerState = {
  events: [],
  notifications: [],
  kpis: {
    totalSales: 0,
    salesGrowth: 0,
    totalAttendees: 0,
    currentCapacity: 0,
    totalCapacity: 0,
    monthlyGoal: 50000,
  },
  isLoading: false,
  error: null,
};

/**
 * Organizer Service
 *
 * Manages state for the organizer dashboard feature.
 * Currently uses mock data - will be connected to backend APIs when available.
 *
 * TODO: Connect to backend endpoints:
 * - GET /api/organizer/events - List organizer's events
 * - GET /api/organizer/kpis - Dashboard KPIs
 * - GET /api/organizer/notifications - Real-time notifications
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizerService {
  private state = signal<OrganizerState>(initialState);

  // Public signals for components
  readonly events = computed(() => this.state().events);
  readonly notifications = computed(() => this.state().notifications);
  readonly kpis = computed(() => this.state().kpis);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  /**
   * Load organizer dashboard data
   * TODO: Replace with actual API calls
   */
  loadDashboardData(): void {
    this.state.update((s) => ({ ...s, isLoading: true, error: null }));

    // Mock data - replace with HTTP calls
    setTimeout(() => {
      this.state.update((s) => ({
        ...s,
        isLoading: false,
        events: [
          {
            id: '1',
            title: 'Summer Jazz Night',
            date: '24 June, 2024',
            location: 'Marina Bay',
            imageUrl:
              'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=200&h=200&fit=crop',
            status: 'sold-out',
            percentageSold: 100,
            totalTickets: 500,
            soldTickets: 500,
          },
          {
            id: '2',
            title: 'Tech Summit 2024',
            date: '12 July, 2024',
            location: 'Convention Hall',
            imageUrl:
              'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&h=200&fit=crop',
            status: 'selling',
            percentageSold: 85,
            totalTickets: 1000,
            soldTickets: 850,
          },
        ],
        notifications: [
          {
            id: '1',
            type: 'alert',
            title: 'Cambio de Horario',
            message:
              'El evento "Jazz Night" ha sido retrasado 30 minutos por condiciones climáticas.',
            time: 'Hace 5 min',
          },
          {
            id: '2',
            type: 'sale',
            title: 'Nueva Venta',
            message:
              'Se han vendido 5 entradas VIP para "Tech Summit 2024".',
            time: 'Hace 12 min',
          },
          {
            id: '3',
            type: 'registration',
            title: 'Registro de Expositor',
            message:
              'Marina Soler ha completado su registro para el área de prensa.',
            time: 'Hace 1 hora',
          },
        ],
        kpis: {
          totalSales: 42850,
          salesGrowth: 12.5,
          totalAttendees: 1284,
          currentCapacity: 452,
          totalCapacity: 500,
          monthlyGoal: 50000,
        },
      }));
    }, 500);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.update((s) => ({ ...s, error: null }));
  }
}
