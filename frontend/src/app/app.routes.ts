import { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';
import { EventDetailPage } from './features/event-detail/event-detail.page';
import { LoginPage } from './features/login/login.page';
import { CheckoutPage } from './features/checkout/checkout.page';
import { OrganizerPage } from './features/organizer/organizer.page';

import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'events/:id', component: EventDetailPage },
  { 
    path: 'login', 
    component: LoginPage,
    canActivate: [publicGuard]
  },
  { 
    path: 'checkout', 
    component: CheckoutPage,
    canActivate: [authGuard]
  },
  { 
    path: 'organizer', 
    component: OrganizerPage,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/home' }
];
