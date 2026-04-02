import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizerService } from '../services/organizer.service';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Header Section -->
    <header class="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
      <div>
        <h2 class="font-headline text-4xl font-extrabold text-on-surface tracking-tight leading-none mb-2">Hub de Organizadores</h2>
        <p class="text-on-surface-variant font-medium">Gestiona tus eventos y rastrea el rendimiento en tiempo real.</p>
      </div>
      <div class="flex items-center space-x-3">
        <div class="glass-effect ghost-border px-4 py-2 rounded-xl flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span class="text-xs font-bold text-on-surface">EN VIVO: Jazz Night 2024</span>
        </div>
        <button class="p-3 bg-surface-container-lowest rounded-full ghost-border text-on-surface hover:scale-105 transition-transform" type="button">
          <span class="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>

    <!-- KPI Grid (Bento Style) -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div class="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between h-40 shadow-[0_4px_20px_rgba(74,64,224,0.03)] hover:translate-y-[-4px] transition-transform">
        <div class="flex justify-between items-start">
          <span class="text-on-surface-variant font-bold text-sm">Ventas Totales</span>
          <span class="material-symbols-outlined text-primary-fixed">payments</span>
        </div>
        <div>
          <div class="text-3xl font-headline font-extrabold text-on-surface">$42,850.00</div>
          <div class="text-xs text-green-600 font-bold flex items-center mt-1">
            <span class="material-symbols-outlined text-xs mr-1">trending_up</span>
            +12.5% vs last month
          </div>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between h-40 shadow-[0_4px_20px_rgba(74,64,224,0.03)] hover:translate-y-[-4px] transition-transform">
        <div class="flex justify-between items-start">
          <span class="text-on-surface-variant font-bold text-sm">Asistentes Registrados</span>
          <span class="material-symbols-outlined text-primary-fixed">group</span>
        </div>
        <div>
          <div class="text-3xl font-headline font-extrabold text-on-surface">1,284</div>
          <div class="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div class="bg-primary h-full w-3/4 rounded-full"></div>
          </div>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between h-40 shadow-[0_4px_20px_rgba(74,64,224,0.03)] hover:translate-y-[-4px] transition-transform border-2 border-primary-container/20">
        <div class="flex justify-between items-start">
          <span class="text-on-surface-variant font-bold text-sm">Aforo Actual (En Vivo)</span>
          <span class="material-symbols-outlined text-tertiary">sensors</span>
        </div>
        <div>
          <div class="text-3xl font-headline font-extrabold text-on-surface">452 / 500</div>
          <p class="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">90% de Capacidad Alcanzada</p>
        </div>
      </div>
    </section>

    <!-- Main Dashboard Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Sales Chart Simulation & Notifications (Left 8 cols) -->
      <div class="lg:col-span-8 space-y-8">
        <!-- Sales Analytics Area -->
        <div class="bg-surface-container-low rounded-2xl p-8 relative overflow-hidden">
          <div class="flex justify-between items-center mb-8">
            <h3 class="font-headline text-xl font-bold">Ventas por Tiempo</h3>
            <div class="flex bg-surface-container-lowest p-1 rounded-full ghost-border">
              <button class="px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-full" type="button">7D</button>
              <button class="px-4 py-1.5 text-xs font-bold text-on-surface-variant" type="button">30D</button>
              <button class="px-4 py-1.5 text-xs font-bold text-on-surface-variant" type="button">ALL</button>
            </div>
          </div>

          <!-- Simulated Chart Visual -->
          <div class="h-64 flex items-end justify-between space-x-2">
            <div class="w-full bg-primary-container/20 rounded-t-lg h-[40%] hover:bg-primary-container/40 transition-colors"></div>
            <div class="w-full bg-primary-container/20 rounded-t-lg h-[60%] hover:bg-primary-container/40 transition-colors"></div>
            <div class="w-full bg-primary-container/20 rounded-t-lg h-[55%] hover:bg-primary-container/40 transition-colors"></div>
            <div class="w-full bg-primary-container/20 rounded-t-lg h-[85%] hover:bg-primary-container/40 transition-colors"></div>
            <div class="w-full bg-primary-container/20 rounded-t-lg h-[70%] hover:bg-primary-container/40 transition-colors"></div>
            <div class="w-full bg-primary rounded-t-lg h-[95%] shadow-[0_-4px_15px_rgba(74,64,224,0.3)]"></div>
            <div class="w-full bg-primary-container/20 rounded-t-lg h-[65%] hover:bg-primary-container/40 transition-colors"></div>
          </div>

          <div class="flex justify-between mt-4 px-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Mon</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Tue</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Wed</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Thu</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Fri</span>
            <span class="text-[10px] font-bold text-primary uppercase">Sat</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Sun</span>
          </div>
        </div>

        <!-- My Events List -->
        <div>
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-headline text-xl font-bold">Mis Eventos</h3>
            <button class="text-primary font-bold text-sm flex items-center space-x-1 hover:underline" type="button">
              <span>Ver todos</span>
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

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
                <div class="flex space-x-2">
                  <button class="p-2 text-on-surface-variant hover:text-primary transition-colors" type="button">
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button class="p-2 text-on-surface-variant hover:text-error transition-colors" type="button">
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Notifications & Feed (Right 4 cols) -->
      <div class="lg:col-span-4 space-y-8">
        <div class="bg-surface-container rounded-2xl p-6 h-full border-l-0">
          <h3 class="font-headline text-xl font-bold mb-6 flex items-center">
            <span class="material-symbols-outlined mr-2 text-primary">notifications_active</span>
            Última hora
          </h3>

          <div class="space-y-6">
            @for (notification of notifications(); track notification.id; let first = $first) {
              <div class="flex space-x-3 relative">
                @if (!first) {
                  <div class="absolute left-3 top-8 bottom-0 w-[1px] bg-outline-variant/20"></div>
                }
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                     [ngClass]="getNotificationClasses(notification.type)">
                  <span class="material-symbols-outlined text-[14px]" [ngClass]="getNotificationIconClasses(notification.type)">
                    {{ getNotificationIcon(notification.type) }}
                  </span>
                </div>
                <div>
                  <p class="text-xs font-bold text-on-surface">{{ notification.title }}</p>
                  <p class="text-xs text-on-surface-variant mt-1">{{ notification.message }}</p>
                  <span class="text-[10px] text-slate-400 font-medium">{{ notification.time }}</span>
                </div>
              </div>
            }
          </div>

          <div class="mt-10 p-4 bg-surface-container-lowest rounded-xl ghost-border">
            <h4 class="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Meta Mensual</h4>
            <div class="flex items-end justify-between mb-2">
              <span class="text-2xl font-headline font-bold">$42k</span>
              <span class="text-xs font-bold text-on-surface-variant">$50k Meta</span>
            </div>
            <div class="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
              <div class="kinetic-cta h-full w-[84%] rounded-full"></div>
            </div>
            <p class="text-[10px] text-on-surface-variant mt-3 text-center">
              ¡Estás al 84% de tu objetivo mensual!
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardPage implements OnInit {
  private organizerService = inject(OrganizerService);

  readonly events = this.organizerService.events;
  readonly notifications = this.organizerService.notifications;
  readonly kpis = this.organizerService.kpis;

  ngOnInit(): void {
    this.organizerService.loadDashboardData();
  }

  getNotificationClasses(type: string): string {
    const classes: Record<string, string> = {
      'alert': 'bg-error-container/20',
      'sale': 'bg-primary-container/20',
      'registration': 'bg-secondary-container/30'
    };
    return classes[type] || '';
  }

  getNotificationIconClasses(type: string): string {
    const classes: Record<string, string> = {
      'alert': 'text-error',
      'sale': 'text-primary',
      'registration': 'text-secondary'
    };
    return classes[type] || '';
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'alert': 'priority_high',
      'sale': 'confirmation_number',
      'registration': 'person_add'
    };
    return icons[type] || 'notifications';
  }
}
