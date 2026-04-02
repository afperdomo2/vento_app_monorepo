import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { ProfileService } from './services/profile.service';
import { ProfileOverviewComponent } from './components/profile-overview/profile-overview.component';
import { ProfileTab, ProfileState, initialProfileState } from './models/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    TopNavBar,
    ProfileOverviewComponent,
  ],
  template: `
    <app-top-nav-bar />
    <main class="pt-20 pb-8 px-4 bg-surface-container-lowest min-h-screen">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <header class="mb-8">
          <h1 class="headline-lg text-3xl text-on-surface">Mi Perfil</h1>
          <p class="text-on-surface-variant">
            Gestiona tu información personal
          </p>
        </header>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="flex items-center justify-center py-12">
            <span class="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          </div>
        }

        <!-- Error State -->
        @if (error() && !profile()) {
          <div class="bg-error-container border border-error border-opacity-20 rounded-xl p-6 text-center">
            <span class="material-symbols-outlined text-error text-4xl mb-4">error</span>
            <p class="text-error font-bold mb-2">Error al cargar el perfil</p>
            <p class="text-error/80 text-sm mb-4">{{ error() }}</p>
            <button
              (click)="loadProfile()"
              class="kinetic-gradient text-on-primary px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Reintentar
            </button>
          </div>
        }

        <!-- Profile Content -->
        @if (profile() || !error()) {
          <div class="bg-surface-container rounded-2xl shadow-lg overflow-hidden">
            <!-- Tab Navigation -->
            <nav class="flex border-b border-outline-variant/10">
              <button
                (click)="activeTab.set('overview')"
                [class.border-b-2]="activeTab() === 'overview'"
                [class.border-primary]="activeTab() === 'overview'"
                [class.text-primary]="activeTab() === 'overview'"
                [class.text-on-surface-variant]="activeTab() !== 'overview'"
                class="flex-1 py-4 px-6 font-bold transition-all hover:bg-surface-container-high/50"
              >
                <div class="flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined">person</span>
                  <span>Información</span>
                </div>
              </button>
            </nav>

            <!-- Tab Content -->
            <div class="p-6">
              @switch (activeTab()) {
                @case ('overview') {
                  <app-profile-overview
                    [profile]="profile()"
                    (manageAccount)="manageAccount()"
                  />
                }
              }
            </div>
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }

    .headline-lg {
      font-family: 'Manrope', sans-serif;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
  `]
})
export class ProfilePage implements OnInit {
  private profileService = inject(ProfileService);

  activeTab = signal<ProfileTab>('overview');

  private state = signal<ProfileState>(initialProfileState);

  readonly profile = computed(() => this.state().profile);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.state.update(state => ({ ...state, isLoading: true, error: null }));

    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.state.update(state => ({
          ...state,
          profile,
          isLoading: false,
          error: null,
        }));
      },
      error: (error) => {
        this.state.update(state => ({
          ...state,
          isLoading: false,
          error: error.message,
        }));
      },
    });
  }

  /**
   * Redirect user to Keycloak Account Console for account management
   * Opens in a new tab to maintain the current session
   */
  manageAccount(): void {
    const accountUrl = this.profileService.getAccountConsoleUrl();
    window.open(accountUrl, '_blank');
  }
}
