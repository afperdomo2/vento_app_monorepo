import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserProfile } from '../../models/profile.model';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (profile()) {
      <div class="space-y-6">
        <!-- Avatar and Basic Info -->
        <div class="flex items-center gap-6 pb-6 border-b border-outline-variant/10">
          <img
            [src]="profile()!.avatarUrl"
            [alt]="profile()!.fullName || profile()!.username"
            class="w-24 h-24 rounded-full shadow-lg"
          />
          <div>
            <h2 class="text-2xl font-bold text-on-surface">{{ profile()!.fullName || profile()!.username }}</h2>
            <p class="text-on-surface-variant">@{{ profile()!.username }}</p>
            <div class="flex gap-2 mt-2">
              @for (role of getUserRoles(); track role) {
                <span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {{ role }}
                </span>
              }
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div>
          <h3 class="text-lg font-bold text-on-surface mb-4">Información de Contacto</h3>
          <div class="space-y-4">
            <!-- Email -->
            <div class="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
              <span class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">email</span>
              </span>
              <div class="flex-1">
                <p class="text-sm text-on-surface-variant font-bold uppercase tracking-wider mb-1">Email</p>
                <p class="text-on-surface">{{ profile()!.email }}</p>
                @if (profile()!.emailVerified) {
                  <span class="inline-flex items-center gap-1 text-xs text-primary mt-1">
                    <span class="material-symbols-outlined text-sm">verified</span>
                    Verificado
                  </span>
                }
              </div>
            </div>

            <!-- Username -->
            <div class="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
              <span class="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span class="material-symbols-outlined">person</span>
              </span>
              <div class="flex-1">
                <p class="text-sm text-on-surface-variant font-bold uppercase tracking-wider mb-1">Nombre de Usuario</p>
                <p class="text-on-surface">{{ profile()!.username }}</p>
              </div>
            </div>

            <!-- User ID -->
            <div class="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
              <span class="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span class="material-symbols-outlined">badge</span>
              </span>
              <div class="flex-1">
                <p class="text-sm text-on-surface-variant font-bold uppercase tracking-wider mb-1">ID de Usuario</p>
                <p class="text-on-surface font-mono text-sm">{{ profile()!.id }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Roles -->
        <div>
          <h3 class="text-lg font-bold text-on-surface mb-4">Roles y Permisos</h3>
          <div class="flex flex-wrap gap-2">
            @for (role of profile()!.roles; track role) {
              <span class="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-sm font-bold border border-outline-variant/20">
                {{ role }}
              </span>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProfileOverviewComponent {
  profile = input.required<UserProfile | null>();

  /**
   * Get user-friendly roles (filter out technical roles)
   */
  getUserRoles(): string[] {
    const roles = this.profile()?.roles || [];
    const technicalRoles = ['default-roles-ventoapp', 'offline_access', 'uma_authorization'];
    return roles.filter(role => !technicalRoles.includes(role));
  }
}
