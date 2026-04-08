import { Component } from '@angular/core';
import { HomeHeroBanner } from './components/home-hero-banner/home-hero-banner.component';
import { HomeFeaturedEvents } from './components/home-featured-events/home-featured-events.component';
import { HomeNearbyEvents } from './components/home-nearby-events/home-nearby-events.component';
import { HomeNewsletterCta } from './components/home-newsletter-cta/home-newsletter-cta.component';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TopNavBar, BottomNavBar, HomeHeroBanner, HomeFeaturedEvents, HomeNearbyEvents, HomeNewsletterCta],
  template: `
    <app-top-nav-bar />

    <main class="pt-20 pb-24 md:pb-12">
      <app-home-hero-banner />
      <app-home-featured-events />
      <app-home-nearby-events />
      <app-home-newsletter-cta />
    </main>

    <app-bottom-nav-bar />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HomePage {}
