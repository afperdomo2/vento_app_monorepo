import { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';
import { EventDetailPage } from './features/event-detail/event-detail.page';
import { LoginPage } from './features/login/login.page';
import { CheckoutPage } from './features/checkout/checkout.page';
import { OrganizerLayoutPage } from './features/organizer/organizer-layout.page';
import { DashboardPage } from './features/organizer/dashboard/dashboard.page';
import { AnalyticsPage } from './features/organizer/analytics/analytics.page';
import { EventsPage } from './features/organizer/events/events.page';
import { EventsListPage } from './features/events-list/events-list.page';
import { NearbyEventsPage } from './features/nearby/nearby.page';
import { ProfilePage } from './features/profile/profile.page';
import { MyOrdersPage } from './features/my-orders/my-orders.page';
import { MyOrdersDetailPage } from './features/my-orders/my-orders-detail.page';

import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';
import { organizerGuard } from './core/guards/organizer.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePage },
  { path: 'events', component: EventsListPage },
  { path: 'events/:id', component: EventDetailPage },
  { path: 'nearby', component: NearbyEventsPage },
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
    component: OrganizerLayoutPage,
    canActivate: [authGuard, organizerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPage },
      { path: 'analytics', component: AnalyticsPage },
      { path: 'events', component: EventsPage },
    ]
  },
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [authGuard]
  },
  {
    path: 'my-orders',
    component: MyOrdersPage,
    canActivate: [authGuard]
  },
  {
    path: 'my-orders/:id',
    component: MyOrdersDetailPage,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/home' }
];
