import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-6 pt-2 glass-nav shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-3xl">
      <a routerLink="/home" routerLinkActive="active-mobile" 
         class="flex flex-col items-center justify-center p-2 text-slate-400 transition-transform active:scale-90">
        <span class="material-symbols-outlined">home</span>
        <span class="font-inter text-[10px] font-bold uppercase tracking-widest mt-1">Home</span>
      </a>
      
      <a href="#" class="flex flex-col items-center justify-center p-2 text-slate-400 transition-transform active:scale-90">
        <span class="material-symbols-outlined">search</span>
        <span class="font-inter text-[10px] font-bold uppercase tracking-widest mt-1">Search</span>
      </a>
      
      <a routerLink="/checkout" routerLinkActive="active-mobile-highlight" 
         class="flex flex-col items-center justify-center bg-indigo-600 text-white rounded-2xl p-3 mb-2 transform -translate-y-2 shadow-lg shadow-indigo-200 transition-transform active:scale-90">
        <span class="material-symbols-outlined">confirmation_number</span>
        <span class="font-inter text-[10px] font-bold uppercase tracking-widest mt-1">My Tickets</span>
      </a>
      
      <a routerLink="/organizer" routerLinkActive="active-mobile" 
         class="flex flex-col items-center justify-center p-2 text-slate-400 transition-transform active:scale-90">
        <span class="material-symbols-outlined">person_outline</span>
        <span class="font-inter text-[10px] font-bold uppercase tracking-widest mt-1">Profile</span>
      </a>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .active-mobile {
      color: #4a40e0;
    }
    
    .active-mobile-highlight {
      background-color: #4a40e0;
    }
  `]
})
export class BottomNavBar { }
