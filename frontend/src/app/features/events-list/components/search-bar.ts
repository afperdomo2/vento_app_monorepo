import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { EventsListService } from '../services/events-list.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="bg-surface-container-low rounded-xl p-4">
      <div class="flex items-center gap-3">
        <!-- Search Icon -->
        <span class="material-symbols-outlined text-on-surface-variant text-lg">
          @if (isSearching()) {
            <span class="animate-spin">progress_activity</span>
          } @else {
            search
          }
        </span>

        <!-- Search Input -->
        <input
          [formControl]="searchControl"
          type="text"
          placeholder="Buscar eventos por nombre, ubicación o categoría..."
          class="flex-1 bg-transparent border-none focus:ring-0 text-on-surface font-body text-base placeholder:text-on-surface-variant/50"
          [class.animate-pulse]="isSearching()"
        />

        <!-- Clear Button -->
        @if (searchControl.value || isSearching()) {
          <button
            (click)="clearSearch()"
            class="p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
            [attr.aria-label]="'Limpiar búsqueda'"
          >
            <span class="material-symbols-outlined text-on-surface-variant text-sm">close</span>
          </button>
        }
      </div>

      <!-- Search Info -->
      @if (isSearching()) {
        <div class="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
          <span class="material-symbols-outlined text-xs">search</span>
          <span>Buscando: "<strong class="text-on-surface">{{ searchControl.value }}</strong>"</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    input:focus {
      outline: none;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .animate-pulse {
      animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class SearchBarComponent implements OnInit, OnDestroy {
  private eventsListService = inject(EventsListService);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  // Use the service's isSearching signal (based on loading state + search term)
  isSearching = this.eventsListService.isSearching;

  ngOnInit(): void {
    // Subscribe to search term changes with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),        // Wait 300ms after last keystroke
        distinctUntilChanged(),   // Ignore if value didn't change
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.eventsListService.updateSearchTerm(term || '');
      });

    // Restore search term if coming back from navigation
    const existingSearchTerm = this.eventsListService.searchTerm();
    if (existingSearchTerm) {
      this.searchControl.setValue(existingSearchTerm);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.eventsListService.clearSearch();
  }
}
