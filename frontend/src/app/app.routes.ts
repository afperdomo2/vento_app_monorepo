import { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';
import { EventDetailPage } from './features/event-detail/event-detail.page';
import { LoginPage } from './features/login/login.page';
import { CheckoutPage } from './features/checkout/checkout.page';
import { OrganizerPage } from './features/organizer/organizer.page';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'events/:id', component: EventDetailPage },
  { path: 'login', component: LoginPage },
  { path: 'checkout', component: CheckoutPage },
  { path: 'organizer', component: OrganizerPage },
  { path: '**', redirectTo: '/home' }
];
