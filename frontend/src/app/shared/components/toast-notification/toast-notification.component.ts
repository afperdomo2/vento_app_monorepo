import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';

const TYPE_CONFIG: Record<
  Notification['type'],
  { icon: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  success: {
    icon: 'check_circle',
    colorClass: 'text-success',
    bgClass: 'bg-success-container',
    borderClass: 'border-success/20',
  },
  error: {
    icon: 'error',
    colorClass: 'text-error',
    bgClass: 'bg-error-container',
    borderClass: 'border-error/20',
  },
  warning: {
    icon: 'warning',
    colorClass: 'text-warning',
    bgClass: 'bg-warning-container',
    borderClass: 'border-warning/20',
  },
  info: {
    icon: 'info',
    colorClass: 'text-info',
    bgClass: 'bg-info-container',
    borderClass: 'border-info/20',
  },
};

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-20 right-4 z-[100] flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)]">
      @for (notification of notifications(); track notification.id) {
        @let cfg = getTypeConfig(notification.type);
        <div
          class="{{ cfg.bgClass }} {{
            cfg.borderClass
          }} border rounded-xl p-4 flex items-start gap-3 shadow-lg
                 animate-slide-in-right"
          role="alert"
        >
          <span class="material-symbols-outlined {{ cfg.colorClass }} text-xl flex-shrink-0 mt-0.5">
            {{ cfg.icon }}
          </span>
          <p class="{{ cfg.colorClass }} text-sm font-medium flex-1">{{ notification.message }}</p>
          <button
            type="button"
            (click)="dismiss(notification.id)"
            class="p-0.5 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
            aria-label="Cerrar notificación"
          >
            <span class="material-symbols-outlined {{ cfg.colorClass }} text-sm">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slide-in-right {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
      }
    `,
  ],
})
export class ToastNotificationComponent {
  private notificationSvc = inject(NotificationService);
  protected notifications = this.notificationSvc.notifications;

  protected getTypeConfig(type: Notification['type']) {
    return TYPE_CONFIG[type];
  }

  protected dismiss(id: string): void {
    this.notificationSvc.dismiss(id);
  }
}
