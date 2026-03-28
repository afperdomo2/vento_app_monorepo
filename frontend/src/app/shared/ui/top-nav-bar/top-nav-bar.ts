import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-top-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
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
              Explore
            </a>
            <a href="#" class="text-slate-600 hover:text-indigo-500 hover:scale-105 transition-transform duration-200">
              Categories
            </a>
            <a href="#" class="text-slate-600 hover:text-indigo-500 hover:scale-105 transition-transform duration-200">
              Venues
            </a>
            <a href="#" class="text-slate-600 hover:text-indigo-500 hover:scale-105 transition-transform duration-200">
              Schedule
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

          <!-- Profile / Login -->
          <a routerLink="/login" class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
              alt="User Profile"
              class="w-full h-full object-cover"
            />
          </a>
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
export class TopNavBar { }
