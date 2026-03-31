import { Component, inject, signal, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthStateService, injectAuthState } from '../../../core/auth/auth.provider';
import { AuthService } from '../../../core/auth/auth.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-top-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, ClickOutsideDirective],
  template: `
    <nav class="fixed top-0 w-full z-50 glass-nav">
      <div class="flex justify-between items-center w-full px-6 py-3 max-w-full">
        <!-- Logo and Main Nav -->
        <div class="flex items-center gap-8">
          <a routerLink="/home" class="text-2xl font-black tracking-tighter text-indigo-700 font-headline">
            Evento
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-6 font-manrope text-sm font-semibold tracking-tight">
            <a routerLink="/home" routerLinkActive="active"
               class="text-slate-600 hover:text-indigo-500 hover:scale-105 transition-transform duration-200">
              Inicio
            </a>
            <a routerLink="/events" routerLinkActive="active"
               class="text-slate-600 hover:text-indigo-500 hover:scale-105 transition-transform duration-200">
              Eventos
            </a>
          </div>
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-4">
          <!-- Search Bar (Desktop) -->
          <div class="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 py-1.5 focus-within:ring-2 ring-primary transition-all">
            <span class="material-symbols-outlined text-outline text-lg">search</span>
            <input
              type="text"
              placeholder="Buscar eventos..."
              class="bg-transparent border-none focus:ring-0 text-sm w-48 font-body"
            />
          </div>

          <!-- Notifications -->
          <button class="p-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-full relative">
            <span class="material-symbols-outlined">notifications</span>
            <span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
          </button>

          <!-- Auth State: Not Logged In -->
          @if (!authState.isLoggedIn()) {
            <a
              routerLink="/login"
              class="kinetic-gradient text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              Iniciar Sesión
            </a>
          }

          <!-- Auth State: Logged In -->
          @if (authState.isLoggedIn()) {
            <div class="relative" #userMenuContainer>
              <!-- User Avatar Button -->
              <button
                (click)="toggleUserMenu()"
                class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                [attr.aria-label]="'Menu de usuario de ' + (authState.userName() || 'Usuario')"
              >
                @if (currentUser()?.avatarUrl) {
                  <img
                    [src]="currentUser()!.avatarUrl!"
                    [alt]="authState.userName() || 'Usuario'"
                    class="w-full h-full object-cover"
                  />
                } @else {
                  <div class="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {{ authState.userInitials() }}
                  </div>
                }
              </button>

              <!-- Dropdown Menu -->
              @if (isUserMenuOpen()) {
                <div
                  class="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/10 overflow-hidden z-50"
                  (clickOutside)="closeUserMenu()"
                >
                  <!-- User Info Header -->
                  <div class="px-4 py-3 border-b border-outline-variant/10">
                    <p class="text-sm font-bold text-on-surface">{{ authState.userName() || 'Usuario' }}</p>
                    <p class="text-xs text-on-surface-variant truncate">{{ currentUser()?.email }}</p>
                  </div>

                  <!-- Menu Items -->
                  <div class="py-2">
                    <a
                      routerLink="/profile"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    >
                      <span class="material-symbols-outlined text-lg">person</span>
                      Mi Perfil
                    </a>
                    <a
                      href="#"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    >
                      <span class="material-symbols-outlined text-lg">receipt_long</span>
                      Mis Pedidos
                    </a>
                    <a
                      href="#"
                      class="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    >
                      <span class="material-symbols-outlined text-lg">settings</span>
                      Configuración
                    </a>
                  </div>

                  <!-- Logout -->
                  <div class="py-2 border-t border-outline-variant/10">
                    <button
                      (click)="logout()"
                      class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container transition-colors"
                    >
                      <span class="material-symbols-outlined text-lg">logout</span>
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }

    .active {
      color: #4a40e0;
      border-bottom: 2px solid #4a40e0;
      padding-bottom: 2px;
    }
  `]
})
export class TopNavBar {
  authState = injectAuthState();
  private authService = inject(AuthService);
  private router = inject(Router);

  isUserMenuOpen = signal(false);

  currentUser = this.authState.currentUser;

  toggleUserMenu() {
    this.isUserMenuOpen.update(open => !open);
  }

  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.closeUserMenu();
    this.router.navigate(['/home']);
  }
}
