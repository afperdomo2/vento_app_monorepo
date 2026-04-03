import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';

const TYPE_CONFIG: Record<
  Notification['type'],
  {
    icon: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    iconBgClass: string;
  }
> = {
  success: {
    icon: 'check_circle',
    textClass: 'text-green-800',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    iconBgClass: 'bg-green-100',
  },
  error: {
    icon: 'error',
    textClass: 'text-red-800',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    iconBgClass: 'bg-red-100',
  },
  warning: {
    icon: 'warning',
    textClass: 'text-amber-800',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    iconBgClass: 'bg-amber-100',
  },
  info: {
    icon: 'info',
    textClass: 'text-blue-800',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    iconBgClass: 'bg-blue-100',
  },
};

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-20 right-4 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)]">
      @for (notification of notifications(); track notification.id) {
        @let cfg = TYPE_CONFIG[notification.type];
        <div
          [ngClass]="[
            cfg.bgClass,
            cfg.borderClass,
            'border',
            'rounded-xl',
            'p-4',
            'flex',
            'items-start',
            'gap-3',
            'shadow-lg',
            'animate-slide-in-right',
          ]"
          role="alert"
        >
          <span
            [ngClass]="[
              cfg.iconBgClass,
              'w-9',
              'h-9',
              'rounded-full',
              'flex',
              'items-center',
              'justify-center',
              'flex-shrink-0',
            ]"
          >
            <span [ngClass]="[cfg.textClass, 'material-symbols-outlined', 'text-lg']">{{
              cfg.icon
            }}</span>
          </span>
          <p [ngClass]="[cfg.textClass, 'text-sm', 'font-medium', 'flex-1', 'pt-1']">
            {{ notification.message }}
          </p>
          <button
            type="button"
            (click)="dismiss(notification.id)"
            [ngClass]="[
              cfg.textClass,
              'p-1',
              'rounded-full',
              'hover:bg-black/10',
              'transition-colors',
              'flex-shrink-0',
            ]"
            aria-label="Cerrar notificación"
          >
            <span class="material-symbols-outlined text-sm">close</span>
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

      @keyframes fade-out-up {
        from {
          opacity: 1;
          transform: translateX(0) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(40px) translateY(-8px);
        }
      }
    `,
  ],
})
export class ToastNotificationComponent {
  private notificationSvc = inject(NotificationService);
  protected notifications = this.notificationSvc.notifications;
  protected TYPE_CONFIG = TYPE_CONFIG;

  protected dismiss(id: string): void {
    this.notificationSvc.dismiss(id);
  }
}
