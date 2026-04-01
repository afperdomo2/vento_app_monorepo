import { Component, inject, OnInit, OnDestroy, HostListener, signal, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TopNavBar } from '../../shared/ui/top-nav-bar/top-nav-bar';
import { BottomNavBar } from '../../shared/ui/bottom-nav-bar/bottom-nav-bar';
import { EventCard } from '../../shared/components/event-card/event-card';
import { EventsListService } from './services/events-list.service';
import { FiltersBarComponent } from './components/filters-bar';
import { SearchBarComponent } from './components/search-bar';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [TopNavBar, BottomNavBar, EventCard, FiltersBarComponent, SearchBarComponent],
  template: `
    <app-top-nav-bar />

    <main class="pt-20 pb-24 md:pb-8 min-h-screen">
      <!-- Header -->
      <header class="px-6 py-8 max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface">
              Todos los Eventos
            </h1>
            <p class="text-on-surface-variant mt-2">
              @if (isSearching() && searchTerm()) {
                {{ totalEvents() }} resultados para "<strong class="text-on-surface">{{ searchTerm() }}</strong>"
              } @else {
                {{ totalEvents() }} eventos disponibles
              }
            </p>
          </div>

          <!-- Mobile filters toggle -->
          <button
            class="md:hidden kinetic-gradient text-white px-6 py-3 rounded-full font-bold flex items-center gap-2"
            (click)="toggleFilters()"
          >
            <span class="material-symbols-outlined">tune</span>
            Filtros
          </button>
        </div>
      </header>

      <!-- Search Bar -->
      <section class="px-6 pb-6 max-w-7xl mx-auto">
        <app-search-bar />
      </section>

      <!-- Filters Bar (Desktop) -->
      <section class="px-6 pb-6 max-w-7xl mx-auto hidden md:block">
        <app-filters-bar
          (sortChange)="applySort($event)"
          (reset)="resetFilters()"
        />
      </section>

      <!-- Mobile Filters Drawer -->
      @if (showMobileFilters()) {
        <div class="fixed inset-0 z-50 md:hidden" (click)="toggleFilters()">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div
            class="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-bold text-on-surface">Filtros</h2>
              <button
                (click)="toggleFilters()"
                class="p-2 hover:bg-surface-container rounded-full transition-colors"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <app-filters-bar
              (sortChange)="applySort($event); toggleFilters()"
              (reset)="resetFilters(); toggleFilters()"
            />
          </div>
        </div>
      }

      <!-- Events Grid -->
      <section class="px-6 py-8 max-w-7xl mx-auto">
        @if (loading() && events().length === 0) {
          <!-- Initial Loading Skeleton -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="bg-surface-container-lowest rounded-xl overflow-hidden animate-pulse">
                <div class="aspect-[4/3] bg-surface-container-high"></div>
                <div class="p-6 space-y-4">
                  <div class="h-4 bg-surface-container-high rounded w-1/3"></div>
                  <div class="h-6 bg-surface-container-high rounded w-3/4"></div>
                  <div class="h-4 bg-surface-container-high rounded w-full"></div>
                  <div class="flex justify-between pt-4 border-t border-outline-variant/10">
                    <div class="h-4 bg-surface-container-high rounded w-1/4"></div>
                    <div class="h-6 bg-surface-container-high rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else if (error()) {
          <!-- Error State -->
          <div class="bg-error-container border border-error border-opacity-20 rounded-xl p-8 text-center max-w-md mx-auto">
            <span class="material-symbols-outlined text-error text-4xl mb-4">error</span>
            <h3 class="text-xl font-bold text-on-surface mb-2">Error al cargar eventos</h3>
            <p class="text-on-surface-variant mb-4">{{ error() }}</p>
            <button
              (click)="loadEvents()"
              class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Intentar nuevamente
            </button>
          </div>
        } @else if (events().length === 0) {
          <!-- Empty State -->
          <div class="text-center py-16">
            <span class="material-symbols-outlined text-outline text-6xl mb-4">event_busy</span>
            <h3 class="text-xl font-bold text-on-surface mb-2">No hay eventos disponibles</h3>
            <p class="text-on-surface-variant mb-6">
              @if (hasActiveFilters()) {
                Intenta ajustar los filtros o restablecerlos
              } @else {
                Vuelve pronto para ver nuevos eventos
              }
            </p>
            @if (hasActiveFilters()) {
              <button
                (click)="resetFilters()"
                class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
              >
                Restablecer filtros
              </button>
            }
          </div>
        } @else {
          <!-- Events Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (event of events(); track event.id) {
              <app-event-card [event]="event" />
            }
          </div>
        }

        <!-- Loading More Indicator -->
        @if (loadingMore()) {
          <div class="flex justify-center py-8">
            <div class="flex items-center gap-3 text-on-surface-variant">
              <span class="material-symbols-outlined animate-spin">progress_activity</span>
              <span>Cargando más eventos...</span>
            </div>
          </div>
        }

        <!-- End Message -->
        @if (!hasMore() && events().length > 0 && !loadingMore()) {
          <div class="text-center py-8">
            <p class="text-on-surface-variant font-medium">
              ¡Has llegado al final de la lista!
            </p>
          </div>
        }
      </section>
    </main>

    <app-bottom-nav-bar />
  `
})
export class EventsListPage implements OnInit, OnDestroy, AfterViewInit {
  private eventsListService = inject(EventsListService);
  private destroy$ = new Subject<void>();

  // Signals from service (public for template access)
  events = this.eventsListService.events;
  loading = this.eventsListService.loading;
  loadingMore = this.eventsListService.loadingMore;
  hasMore = this.eventsListService.hasMore;
  totalElements = this.eventsListService.totalElements;
  error = this.eventsListService.error;
  isSearching = this.eventsListService.isSearching;
  searchTerm = this.eventsListService.searchTerm;

  showMobileFilters = signal(false);

  ngOnInit(): void {
    this.eventsListService.loadEvents();
  }

  ngAfterViewInit(): void {
    // Restore scroll position when coming back from event detail
    this.eventsListService.restoreScrollPosition();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Scroll detection for infinite scroll
  @HostListener('window:scroll')
  onScroll(): void {
    const pos = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 800; // 800px before end

    if (pos >= threshold && !this.loading() && !this.loadingMore() && this.hasMore()) {
      this.eventsListService.loadMore();
    }
  }

  // Save scroll position before navigating to event detail
  saveScrollPosition(): void {
    this.eventsListService.saveScrollPosition();
  }

  loadEvents(): void {
    this.eventsListService.loadEvents();
  }

  toggleFilters(): void {
    this.showMobileFilters.update(show => !show);
  }

  applySort(sortConfig: { sortBy: string; sortDir: string }): void {
    this.eventsListService.applyFilters({
      sortBy: sortConfig.sortBy,
      sortDir: sortConfig.sortDir,
    });
  }

  resetFilters(): void {
    this.eventsListService.resetFilters();
  }

  hasActiveFilters(): boolean {
    const filters = this.eventsListService.getFilters();
    return (filters.sortBy !== 'eventDate') || (filters.sortDir !== 'ASC');
  }

  totalEvents(): number {
    return this.totalElements();
  }
}
