import { Injectable, signal, computed } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

/**
 * Lightweight toast notification service using signals.
 *
 * Usage:
 * ```ts
 * private notification = inject(NotificationService);
 *
 * // Success
 * this.notification.success('Evento creado exitosamente');
 *
 * // Error
 * this.notification.error('No se pudo conectar con el servidor');
 *
 * // Warning
 * this.notification.warning('La capacidad está por debajo de los tickets vendidos');
 *
 * // Info
 * this.notification.info('Hay 3 eventos próximos esta semana');
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private state = signal<NotificationState>(initialState);

  readonly notifications = computed(() => this.state().notifications);

  /**
   * Show a success toast (green).
   */
  success(message: string, duration = 5000): void {
    this.show('success', message, duration);
  }

  /**
   * Show an error toast (red).
   */
  error(message: string, duration = 6000): void {
    this.show('error', message, duration);
  }

  /**
   * Show a warning toast (yellow/amber).
   */
  warning(message: string, duration = 5000): void {
    this.show('warning', message, duration);
  }

  /**
   * Show an info toast (blue).
   */
  info(message: string, duration = 5000): void {
    this.show('info', message, duration);
  }

  /**
   * Dismiss a notification by ID.
   */
  dismiss(id: string): void {
    this.state.update((s) => ({
      ...s,
      notifications: s.notifications.filter((n) => n.id !== id),
    }));
  }

  /**
   * Dismiss all notifications.
   */
  dismissAll(): void {
    this.state.set(initialState);
  }

  private show(type: NotificationType, message: string, duration: number): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const notification: Notification = { id, type, message, duration };

    this.state.update((s) => ({
      ...s,
      notifications: [...s.notifications, notification],
    }));

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
