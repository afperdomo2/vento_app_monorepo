import { Component } from '@angular/core';
import { TopNavBar } from '../shared/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../shared/bottom-nav-bar/bottom-nav-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [TopNavBar, BottomNavBar, FormsModule],
  template: `
    <app-top-nav-bar />
    
    <main class="pt-24 pb-32 px-4 max-w-6xl mx-auto">
      <!-- Timer Banner: Kinetic Floating Element -->
      <div class="mb-12 flex justify-center">
        <div class="bg-surface-container-lowest border border-outline-variant/15 px-6 py-3 rounded-full flex items-center gap-3 shadow-xl shadow-on-surface/5 animate-pulse-slow">
          <span class="material-symbols-outlined text-tertiary">timer</span>
          <p class="font-label text-sm font-bold text-on-surface uppercase tracking-widest">
            Tu reserva expira en <span class="text-tertiary">09:59</span>
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <!-- Left Column: Payment Details (60%) -->
        <div class="lg:col-span-7 space-y-8">
          <div>
            <h1 class="font-headline text-4xl font-extrabold tracking-tighter text-on-surface mb-2">Finalizar Pago</h1>
            <p class="text-on-surface-variant font-medium">Completa los detalles de tu tarjeta para asegurar tus entradas.</p>
          </div>

          <!-- Payment Form -->
          <div class="bg-surface-container-low rounded-3xl p-8 space-y-6">
            <div class="space-y-4">
              <label class="block font-headline text-lg font-bold">Información de la Tarjeta</label>
              
              <!-- Credit Card Input -->
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Número de tarjeta
                </label>
                <div class="relative group">
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">credit_card</span>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000"
                    class="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all duration-200 placeholder:text-outline/50 font-medium"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                    Vencimiento
                  </label>
                  <input 
                    type="text" 
                    placeholder="MM/YY"
                    class="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all duration-200 placeholder:text-outline/50 font-medium"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                    CVC
                  </label>
                  <input 
                    type="text" 
                    placeholder="123"
                    class="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all duration-200 placeholder:text-outline/50 font-medium"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Nombre en la tarjeta
                </label>
                <input 
                  type="text" 
                  placeholder="JUAN PEREZ"
                  class="w-full px-4 py-4 bg-surface-container-lowest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all duration-200 placeholder:text-outline/50 font-medium"
                />
              </div>
            </div>

            <!-- Security Badge -->
            <div class="flex items-center gap-3 p-4 bg-primary-container/10 rounded-2xl border border-primary/10">
              <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">verified_user</span>
              <p class="text-xs font-medium text-on-primary-container">
                Tus datos están protegidos por encriptación bancaria de 256 bits.
              </p>
            </div>
          </div>

          <!-- Action Button -->
          <button class="kinetic-gradient w-full py-5 rounded-full text-white font-headline text-lg font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
            Confirmar Pago Seguro
            <span class="material-symbols-outlined">lock</span>
          </button>
        </div>

        <!-- Right Column: Order Summary (40%) -->
        <div class="lg:col-span-5">
          <div class="bg-surface-container-highest rounded-3xl overflow-hidden sticky top-28">
            <!-- Event Micro-Hero -->
            <div class="relative h-48 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop" 
                alt="Event"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-surface-container-highest via-transparent to-transparent"></div>
            </div>

            <div class="p-8 space-y-8">
              <div>
                <span class="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                  Solo quedan 5
                </span>
                <h2 class="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                  Neon Nights: Electronic Festival 2024
                </h2>
                <div class="flex items-center gap-4 mt-4 text-on-surface-variant text-sm font-medium">
                  <div class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-lg">calendar_today</span>
                    15 Sep
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-lg">location_on</span>
                    Madrid Arena
                  </div>
                </div>
              </div>

              <!-- Price Breakdown -->
              <div class="space-y-4 border-t border-outline-variant/10 pt-6">
                <div class="flex justify-between items-center">
                  <span class="text-on-surface-variant font-medium">Entrada General (x2)</span>
                  <span class="font-bold text-on-surface">$120.00</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-on-surface-variant font-medium">Cargos de servicio</span>
                  <span class="font-bold text-on-surface">$12.50</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-on-surface-variant font-medium">Seguro de cancelación</span>
                  <span class="font-bold text-on-surface">$5.00</span>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-on-surface/5">
                  <span class="font-headline text-xl font-extrabold text-on-surface">Total</span>
                  <span class="font-headline text-3xl font-extrabold text-primary tracking-tighter">$137.50</span>
                </div>
              </div>

              <!-- Promo Code Stub -->
              <div class="relative">
                <input 
                  type="text" 
                  placeholder="Código de descuento"
                  class="w-full px-4 py-3 bg-white/50 border-none rounded-2xl focus:ring-1 focus:ring-primary/30 transition-all font-medium text-sm"
                />
                <button class="absolute right-2 top-1/2 -translate-y-1/2 text-primary font-bold text-xs uppercase px-4 py-2 hover:bg-primary/10 rounded-xl transition-colors">
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <app-bottom-nav-bar />
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class Checkout { }
