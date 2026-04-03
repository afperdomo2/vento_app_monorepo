import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';

@Component({
  selector: 'app-organizer-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, BottomNavBar, TopNavBar],
  template: `
    <app-top-nav-bar />
    <div class="flex min-h-screen bg-surface pt-16">
      <!-- Sidebar - Desktop -->
      <aside
        class="hidden md:flex flex-col h-[calc(100vh-4rem)] w-64 bg-slate-50 dark:bg-slate-950 py-6 px-4 space-y-2 border-r-0 font-inter text-sm font-medium sticky top-16"
      >
        <nav class="flex-1 space-y-1">
          <a
            routerLink="/organizer/dashboard"
            routerLinkActive="active-nav"
            class="rounded-xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ease-in-out"
            [class.active-nav]="isActive('/dashboard')"
          >
            <span class="material-symbols-outlined" [class.fill-icon]="isActive('/dashboard')"
              >dashboard</span
            >
            <span>Dashboard</span>
          </a>

          <a
            routerLink="/organizer/analytics"
            routerLinkActive="active-nav"
            class="rounded-xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ease-in-out"
            [class.active-nav]="isActive('/analytics')"
          >
            <span class="material-symbols-outlined" [class.fill-icon]="isActive('/analytics')"
              >insights</span
            >
            <span>Analíticas</span>
          </a>

          <a
            routerLink="/organizer/events"
            routerLinkActive="active-nav"
            class="rounded-xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ease-in-out"
            [class.active-nav]="isActive('/events')"
          >
            <span class="material-symbols-outlined" [class.fill-icon]="isActive('/events')"
              >event</span
            >
            <span>Eventos</span>
          </a>

          <a
            routerLink="/organizer/ticketing"
            routerLinkActive="active-nav"
            class="rounded-xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ease-in-out"
            [class.active-nav]="isActive('/ticketing')"
          >
            <span class="material-symbols-outlined" [class.fill-icon]="isActive('/ticketing')"
              >confirmation_number</span
            >
            <span>Tickets</span>
          </a>
        </nav>

        <div class="mt-auto space-y-1 pt-4 border-t border-slate-200/50">
          <button
            (click)="navigateToCreateEvent()"
            class="w-full kinetic-cta text-white font-bold py-3 px-4 rounded-full flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"
            type="button"
          >
            <span class="material-symbols-outlined text-sm">add</span>
            <span>Crear Evento</span>
          </button>
        </div>
      </aside>

      <!-- Mobile Sidebar Overlay -->
      @if (showMobileSidebar()) {
        <div class="fixed inset-0 bg-black/50 z-40 md:hidden" (click)="toggleMobileSidebar()"></div>
      }

      <!-- Mobile Sidebar -->
      <aside
        class="fixed top-0 left-0 h-full w-64 bg-slate-50 dark:bg-slate-950 z-50 transform transition-transform duration-300 ease-in-out md:hidden"
        [class.translate-x-0]="showMobileSidebar()"
        [class.-translate-x-full]="!showMobileSidebar()"
      >
        <div class="flex flex-col h-full py-6 px-4">
          <div class="flex justify-between items-center mb-8">
            <button
              (click)="toggleMobileSidebar()"
              class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 ml-auto"
              type="button"
              aria-label="Cerrar menú"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav class="flex-1 space-y-1">
            <a
              routerLink="/organizer/dashboard"
              routerLinkActive="active-nav"
              class="rounded-xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ease-in-out"
              [class.active-nav]="isActive('/dashboard')"
              (click)="toggleMobileSidebar()"
            >
              <span class="material-symbols-outlined" [class.fill-icon]="isActive('/dashboard')"
                >dashboard</span
              >
              <span>Dashboard</span>
            </a>

            <a
              routerLink="/organizer/analytics"
              routerLinkActive="active-nav"
              class="rounded-xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ease-in-out"
              [class.active-nav]="isActive('/analytics')"
              (click)="toggleMobileSidebar()"
            >
              <span class="material-symbols-outlined" [class.fill-icon]="isActive('/analytics')"
                >insights</span
              >
              <span>Analíticas</span>
            </a>

            <a
              routerLink="/organizer/events"
              routerLinkActive="active-nav"
              class="rounded-xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ease-in-out"
              [class.active-nav]="isActive('/events')"
              (click)="toggleMobileSidebar()"
            >
              <span class="material-symbols-outlined" [class.fill-icon]="isActive('/events')"
                >event</span
              >
              <span>Eventos</span>
            </a>

            <a
              routerLink="/organizer/ticketing"
              routerLinkActive="active-nav"
              class="rounded-xl px-4 py-3 flex items-center space-x-3 transition-all duration-300 ease-in-out"
              [class.active-nav]="isActive('/ticketing')"
              (click)="toggleMobileSidebar()"
            >
              <span class="material-symbols-outlined" [class.fill-icon]="isActive('/ticketing')"
                >confirmation_number</span
              >
              <span>Tickets</span>
            </a>
          </nav>

          <div class="mt-auto pt-4 border-t border-slate-200/50">
            <button
              (click)="navigateToCreateEvent()"
              class="w-full kinetic-cta text-white font-bold py-3 px-4 rounded-full flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"
              type="button"
            >
              <span class="material-symbols-outlined text-sm">add</span>
              <span>Crear Evento</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 min-w-0 bg-surface px-6 md:px-10 py-8 pb-32 md:pb-8 overflow-y-auto">
        <!-- Mobile Header with Hamburger -->
        <div class="md:hidden mb-6 flex items-center justify-between">
          <button
            (click)="toggleMobileSidebar()"
            class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
            type="button"
            aria-label="Abrir menú"
          >
            <span class="material-symbols-outlined">menu</span>
          </button>
          <h1 class="font-manrope font-bold text-indigo-700 text-xl tracking-tighter">
            Hub de Organizadores
          </h1>
          <div class="w-10"></div>
        </div>

        <!-- Router Outlet for Child Routes -->
        <router-outlet></router-outlet>
      </main>
    </div>

    <app-bottom-nav-bar />
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .active-nav {
        background-color: rgba(99, 102, 241, 0.1);
        color: #4a40e0;
      }

      .fill-icon {
        font-variation-settings: 'FILL' 1;
      }
    `,
  ],
})
export class OrganizerLayoutPage {
  private router = inject(Router);
  showMobileSidebar = signal(false);

  toggleMobileSidebar(): void {
    this.showMobileSidebar.update((value) => !value);
  }

  isActive(route: string): boolean {
    return window.location.pathname.includes(route);
  }

  navigateToCreateEvent(): void {
    this.router.navigate(['/organizer/events']);
    // Close mobile sidebar if open
    this.showMobileSidebar.set(false);
  }
}
