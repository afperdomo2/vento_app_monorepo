import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { AuthStateService, injectAuthState } from '../../core/auth/auth.provider';
import { getAndClearReturnUrl } from '../../core/guards/auth.guard';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="min-h-screen flex items-center justify-center p-4">
      <!-- Container: Using Layering Principle (Surface-Container over Surface) -->
      <main class="relative w-full max-w-6xl grid lg:grid-cols-2 bg-surface-container rounded-xl overflow-hidden shadow-2xl">
        <!-- Branding & Visual Section (The Kinetic Editorial) -->
        <section class="hidden lg:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
          <!-- Decorative Elements -->
          <div class="absolute top-0 right-0 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

          <div class="relative z-10">
            <span class="text-3xl font-black tracking-tighter text-on-primary font-headline">Evento</span>
          </div>

          <div class="relative z-10 space-y-6">
            <h1 class="headline-lg text-5xl text-on-primary leading-tight">
              Descubre experiencias <br/> que cobran vida.
            </h1>
            <p class="text-on-primary/80 text-lg max-w-md font-body leading-relaxed">
              La plataforma editorial para los eventos más exclusivos. Gestiona, descubre y vive momentos únicos.
            </p>
          </div>

          <!-- Kinetic Image Card Overlay -->
          <div class="relative z-10 mt-8 group">
            <div class="absolute -inset-2 bg-white/10 blur-xl rounded-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <div class="relative bg-surface-container-lowest/10 backdrop-blur-md p-6 rounded-xl border border-white/10">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop"
                    alt="Testimonial"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p class="text-on-primary font-bold text-sm">"La mejor experiencia en gestión de eventos"</p>
                  <p class="text-on-primary/60 text-xs">— Elena R., Organizadora Premium</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Auth Form Section (The Functional Canvas) -->
        <section class="bg-surface-container-lowest p-8 lg:p-20 flex flex-col justify-center">
          <div class="max-w-md w-full mx-auto space-y-10">
            <!-- Back Button -->
            <button
              type="button"
              (click)="goBack()"
              class="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-bold text-sm mb-4"
            >
              <span class="material-symbols-outlined text-lg">arrow_back</span>
              <span>Volver</span>
            </button>

            <!-- Header -->
            <header class="space-y-2">
              <h2 class="headline-lg text-3xl text-on-surface">Bienvenido de nuevo</h2>
              <p class="text-on-surface-variant font-body">Ingresa tus credenciales para acceder a tu cuenta.</p>
            </header>

            <!-- Error Message -->
            @if (errorMessage()) {
              <div class="bg-error-container border border-error border-opacity-20 rounded-xl p-4 flex items-start gap-3">
                <span class="material-symbols-outlined text-error text-xl">error</span>
                <div class="flex-1">
                  <p class="text-error font-bold text-sm">Error de autenticación</p>
                  <p class="text-error/80 text-sm mt-1">{{ errorMessage() }}</p>
                </div>
                <button
                  type="button"
                  (click)="clearError()"
                  class="text-error/60 hover:text-error transition-colors"
                >
                  <span class="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            }

            <!-- Form -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <!-- Email/Username Field -->
              <div class="space-y-2 group">
                <label class="block text-sm font-bold text-on-surface-variant ml-1 font-label" for="username">
                  Correo Electrónico o Usuario
                </label>
                <div class="relative flex items-center input-focus-effect">
                  <span class="material-symbols-outlined absolute left-4 text-outline-variant">person</span>
                  <input
                    type="text"
                    id="username"
                    formControlName="username"
                    placeholder="nombre@ejemplo.com o usuario"
                    class="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant font-body transition-all"
                    [class.ring-2]="usernameField?.invalid && usernameField?.touched ? 'ring-error' : ''"
                  />
                </div>
                
                <!-- Validation Errors -->
                @if (usernameField?.invalid && usernameField?.touched) {
                  <div class="flex items-center gap-2 text-error text-sm ml-1">
                    <span class="material-symbols-outlined text-xs">error</span>
                    @if (usernameField?.errors?.['required']) {
                      <span>El correo o usuario es requerido</span>
                    }
                  </div>
                }
              </div>

              <!-- Password Field -->
              <div class="space-y-2">
                <div class="flex justify-between items-center ml-1">
                  <label class="block text-sm font-bold text-on-surface-variant font-label" for="password">
                    Contraseña
                  </label>
                  <a href="#" class="text-xs font-bold text-primary hover:text-primary-dim transition-colors font-label">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div class="relative flex items-center input-focus-effect">
                  <span class="material-symbols-outlined absolute left-4 text-outline-variant">lock</span>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="password"
                    formControlName="password"
                    placeholder="••••••••"
                    class="w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant font-body transition-all"
                    [class.ring-2]="passwordField?.invalid && passwordField?.touched ? 'ring-error' : ''"
                  />
                  <button
                    type="button"
                    (click)="togglePasswordVisibility()"
                    class="absolute right-4 text-outline-variant hover:text-on-surface transition-colors"
                    [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    <span class="material-symbols-outlined">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
                
                <!-- Validation Errors -->
                @if (passwordField?.invalid && passwordField?.touched) {
                  <div class="flex items-center gap-2 text-error text-sm ml-1">
                    <span class="material-symbols-outlined text-xs">error</span>
                    @if (passwordField?.errors?.['required']) {
                      <span>La contraseña es requerida</span>
                    }
                    @if (passwordField?.errors?.['minlength']) {
                      <span>La contraseña debe tener al menos 6 caracteres</span>
                    }
                  </div>
                }
              </div>

              <!-- Remember Me -->
              <div class="flex items-center space-x-2 ml-1">
                <input
                  type="checkbox"
                  id="remember"
                  formControlName="remember"
                  class="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container-low"
                />
                <label class="text-sm text-on-surface-variant font-body" for="remember">
                  Recordarme en este dispositivo
                </label>
              </div>

              <!-- Submit Button (Kinetic CTA) -->
              <button
                type="submit"
                [disabled]="isLoading() || loginForm.invalid"
                class="w-full kinetic-gradient text-on-primary py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                @if (isLoading()) {
                  <span class="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Iniciando sesión...</span>
                } @else {
                  <span>Iniciar Sesión</span>
                  <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                }
              </button>
            </form>

            <!-- Divider -->
            <div class="relative flex items-center py-4">
              <div class="flex-grow border-t border-outline-variant/10"></div>
              <span class="flex-shrink mx-4 text-outline-variant text-xs font-bold uppercase tracking-widest font-label">
                O continúa con
              </span>
              <div class="flex-grow border-t border-outline-variant/10"></div>
            </div>

            <!-- Social Logins (Surface-Container-High backgrounds) -->
            <div class="grid grid-cols-2 gap-4">
              <button class="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-high rounded-full hover:bg-surface-dim transition-colors group">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span class="text-sm font-bold text-on-surface">Google</span>
              </button>
              <button class="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-high rounded-full hover:bg-surface-dim transition-colors group">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span class="text-sm font-bold text-on-surface">Apple</span>
              </button>
            </div>

            <!-- Footer Link -->
            <footer class="text-center pt-4">
              <p class="text-on-surface-variant font-body">
                ¿No tienes una cuenta?
                <a href="#" class="text-primary font-bold hover:underline underline-offset-4 ml-1">
                  Regístrate gratis
                </a>
              </p>
            </footer>
          </div>
        </section>
      </main>

      <!-- Background Decorative Elements for the whole page -->
      <div class="fixed top-0 left-0 -z-10 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-surface-container-high/40 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-surface-variant/30 rounded-full blur-[100px]"></div>
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

    .input-focus-effect:focus-within {
      transform: scale(1.01);
      transition: transform 0.2s ease;
    }
  `]
})
export class LoginPage {
  private authService = inject(AuthService);
  private authState = injectAuthState();
  private router = inject(Router);
  private fb = inject(FormBuilder);

  showPassword = signal(false);

  loginForm: FormGroup = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  usernameField = this.loginForm.get('username');
  passwordField = this.loginForm.get('password');

  constructor() {
    // Clear error when user starts typing
    effect(() => {
      this.loginForm.valueChanges.subscribe(() => {
        this.errorMessage.set(null);
      });
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  clearError(): void {
    this.errorMessage.set(null);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.loginForm.getRawValue();

    this.authService.login(username, password).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.redirectAfterLogin();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  private redirectAfterLogin(): void {
    // Get return URL from sessionStorage (set by authGuard)
    const returnUrl = getAndClearReturnUrl();

    // Redirect to return URL or home page
    this.router.navigateByUrl(returnUrl || '/home');
  }

  goBack(): void {
    // Navigate to home as default fallback
    this.router.navigate(['/home']);
  }
}
