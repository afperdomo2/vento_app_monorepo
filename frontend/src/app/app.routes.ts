import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { EventDetail } from './components/event-detail/event-detail';
import { Login } from './components/login/login';
import { Checkout } from './components/checkout/checkout';
import { OrganizerDashboard } from './components/organizer-dashboard/organizer-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Landing },
  { path: 'events/:id', component: EventDetail },
  { path: 'login', component: Login },
  { path: 'checkout', component: Checkout },
  { path: 'organizer', component: OrganizerDashboard },
  { path: '**', redirectTo: '/home' }
];
