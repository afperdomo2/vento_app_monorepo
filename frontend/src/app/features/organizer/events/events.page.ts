import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { EventService } from '../../../core/services/event.service';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCurrency } from '../../../core/format/format';
import { Event } from '../../../core/models/event.models';
import { EventFormDialog } from '../../../shared/components/event-form-dialog/event-form-dialog.component';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FiltersBarComponent } from '../../events-list/components/filters-bar';

interface EventsState {
  events: Event[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  editingEvent: Event | null;
  deletingEvent: Event | null;
  isDeleting: boolean;
  searchTerm: string;
  sortBy: string;
  sortDir: 'ASC' | 'DESC';
}

const initialState: EventsState = {
  events: [],
  isLoading: false,
  isCreating: false,
  error: null,
  currentPage: 0,
  totalPages: 0,
  totalElements: 0,
  pageSize: 10,
  editingEvent: null,
  deletingEvent: null,
  isDeleting: false,
  searchTerm: '',
  sortBy: 'eventDate',
  sortDir: 'ASC',
};

@Component({
  selector: 'app-organizer-events',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EventFormDialog,
    ConfirmDialog,
    FiltersBarComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <header class="flex items-center justify-between">
        <div>
          <h2 class="font-headline text-2xl font-bold text-on-surface">Mis Eventos</h2>
          <p class="text-on-surface-variant text-sm">
            @if (isSearching() && searchTerm()) {
              {{ totalElements() }} resultados para "<strong class="text-on-surface">{{ searchTerm() }}</strong>"
            } @else {
              {{ totalElements() }} evento{{ totalElements() !== 1 ? 's' : '' }} en total
            }
          </p>
        </div>
        <button
          type="button"
          (click)="openCreateDialog()"
          class="kinetic-cta text-white font-bold py-2.5 px-5 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-100 hover:scale-105 transition-transform text-sm"
        >
          <span class="material-symbols-outlined text-sm">add</span>
          Crear Evento
        </button>
      </header>

      <!-- Search Bar -->
      <div class="bg-surface-container-low rounded-xl p-4">
        <div class="flex items-center gap-3">
          <!-- Search Icon -->
          <span class="material-symbols-outlined text-on-surface-variant text-lg">
            @if (isLoading()) {
              <span class="animate-spin">progress_activity</span>
            } @else {
              search
            }
          </span>

          <!-- Search Input -->
          <input
            [formControl]="searchControl"
            type="text"
            placeholder="Buscar eventos por nombre, ubicación..."
            class="flex-1 bg-transparent border-none focus:ring-0 text-on-surface font-body text-base placeholder:text-on-surface-variant/50"
          />

          <!-- Clear Button -->
          @if (searchControl.value) {
            <button
              (click)="clearSearch()"
              class="p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
              [attr.aria-label]="'Limpiar búsqueda'"
            >
              <span class="material-symbols-outlined text-on-surface-variant text-sm">close</span>
            </button>
          }
        </div>
      </div>

      <!-- Filters Bar (Desktop) -->
      <div class="hidden md:block">
        <app-filters-bar
          (sortChange)="applySort($event)"
          (reset)="resetFilters()"
        />
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="space-y-4">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="bg-surface-container rounded-2xl p-5 flex gap-4 animate-pulse">
              <div class="w-20 h-20 rounded-xl bg-surface-container-high flex-shrink-0"></div>
              <div class="flex-1 space-y-3 py-1">
                <div class="h-5 w-3/4 rounded bg-surface-container-high"></div>
                <div class="h-4 w-1/2 rounded bg-surface-container-high"></div>
                <div class="h-4 w-1/3 rounded bg-surface-container-high"></div>
              </div>
              <div class="flex flex-col gap-2">
                <div class="w-8 h-8 rounded-full bg-surface-container-high"></div>
                <div class="w-8 h-8 rounded-full bg-surface-container-high"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Error State -->
      @if (error() && !events().length) {
        <div class="bg-error-container border border-error/20 rounded-2xl p-6 text-center">
          <span class="material-symbols-outlined text-error text-4xl mb-4">error</span>
          <p class="text-error font-bold mb-2">Error al cargar los eventos</p>
          <p class="text-error/80 text-sm mb-4">{{ error() }}</p>
          <button
            (click)="loadEvents()"
            class="kinetic-gradient text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
          >
            Reintentar
          </button>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && !events().length && !error()) {
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <span class="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4"
            >event_busy</span
          >
          <h3 class="font-headline text-xl font-bold text-on-surface mb-2">
            Aún no tienes eventos
          </h3>
          <p class="text-on-surface-variant text-sm max-w-xs mb-6">
            Crea tu primer evento y comienza a vender entradas para tu próxima experiencia.
          </p>
          <button
            type="button"
            (click)="openCreateDialog()"
            class="kinetic-gradient text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-sm">add</span>
            Crear mi primer evento
          </button>
        </div>
      }

      <!-- Events List -->
      @if (!isLoading() && events().length) {
        <div class="space-y-4">
          @for (event of events(); track event.id) {
            <div
              class="bg-surface-container rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div class="flex gap-4 p-5">
                <!-- Event Image -->
                <div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    [src]="event.imageUrl"
                    [alt]="event.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <!-- Event Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <h3 class="font-headline font-bold text-on-surface text-sm truncate">
                      {{ event.title }}
                    </h3>
                    @if (event.isSoldOut) {
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary flex-shrink-0"
                      >
                        Agotado
                      </span>
                    } @else {
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 flex-shrink-0"
                      >
                        Disponible
                      </span>
                    }
                  </div>

                  <div class="flex items-center gap-3 text-xs text-on-surface-variant mb-2">
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">calendar_today</span>
                      {{ event.date }}
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">schedule</span>
                      {{ event.time }}
                    </span>
                  </div>

                  <div class="flex items-center gap-1 text-xs text-on-surface-variant mb-1">
                    <span class="material-symbols-outlined text-xs">location_on</span>
                    <span class="truncate">{{ event.location }}</span>
                  </div>

                  <div class="flex items-center gap-4 text-xs text-on-surface-variant">
                    <span class="font-bold text-primary">{{ formatPrice(event.price) }}</span>
                    <span>
                      {{ event.ticketsLeft ?? event.category }} ticket{{
                        (event.ticketsLeft ?? 0) !== 1 ? 's' : ''
                      }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-1">
                  <button
                    type="button"
                    (click)="openEditDialog(event)"
                    class="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-primary"
                    title="Editar evento"
                  >
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    type="button"
                    (click)="openDeleteDialog(event)"
                    class="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-error"
                    title="Eliminar evento"
                  >
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div
            class="flex items-center justify-between mt-8 pt-6 border-t border-outline-variant/10"
          >
            <button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() === 0"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed
                     bg-surface-container text-on-surface hover:bg-surface-container-high"
            >
              <span class="material-symbols-outlined text-lg">chevron_left</span>
              Anterior
            </button>

            <div class="flex items-center gap-2 text-sm text-on-surface-variant">
              <span class="font-bold text-on-surface">{{ currentPage() + 1 }}</span>
              <span>de</span>
              <span class="font-bold text-on-surface">{{ totalPages() }}</span>
            </div>

            <button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() >= totalPages() - 1"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed
                     bg-surface-container text-on-surface hover:bg-surface-container-high"
            >
              Siguiente
              <span class="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        }
      }
    </div>

    <!-- Create Dialog -->
    @if (isCreating()) {
      <app-event-form-dialog (close)="closeCreateDialog()" (saved)="onEventCreated($event)" />
    }

    <!-- Edit Dialog -->
    @if (editingEvent()) {
      <app-event-form-dialog
        [event]="editingEvent()"
        (close)="closeEditDialog()"
        (saved)="onEventUpdated($event)"
      />
    }

    <!-- Delete Confirmation Dialog -->
    @if (deletingEvent()) {
      <app-confirm-dialog
        title="¿Eliminar evento?"
        message="Esta acción no se puede deshacer. El evento &quot;{{
          deletingEvent()?.title
        }}&quot; y su inventario de tickets serán eliminados permanentemente."
        confirmText="Eliminar"
        [isConfirming]="isDeleting()"
        (confirm)="confirmDelete()"
        (cancel)="closeDeleteDialog()"
      />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class EventsPage implements OnInit, OnDestroy {
  private eventService = inject(EventService);
  private notification = inject(NotificationService);
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');

  private state = signal<EventsState>(initialState);

  readonly events = computed(() => this.state().events);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly currentPage = computed(() => this.state().currentPage);
  readonly totalPages = computed(() => this.state().totalPages);
  readonly totalElements = computed(() => this.state().totalElements);
  readonly pageSize = computed(() => this.state().pageSize);
  readonly isCreating = computed(() => this.state().isCreating);
  readonly editingEvent = computed(() => this.state().editingEvent);
  readonly deletingEvent = computed(() => this.state().deletingEvent);
  readonly isDeleting = computed(() => this.state().isDeleting);
  readonly searchTerm = computed(() => this.state().searchTerm);
  readonly sortBy = computed(() => this.state().sortBy);
  readonly sortDir = computed(() => this.state().sortDir);
  readonly isSearching = computed(() => 
    this.state().searchTerm.trim().length > 0 && this.state().isLoading
  );

  ngOnInit(): void {
    this.setupSearchControl();
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchControl(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(term => {
        this.updateSearchTerm(term || '');
      });
  }

  loadEvents(): void {
    const page = this.state().currentPage;
    const size = this.state().pageSize;
    const search = this.state().searchTerm;
    const sortBy = this.state().sortBy;
    const sortDir = this.state().sortDir;

    this.state.update((s) => ({ ...s, isLoading: true, error: null }));

    const hasSearch = search && search.trim().length > 0;

    const request$ = hasSearch
      ? this.eventService.searchEvents({ q: search.trim(), page, size })
      : this.eventService.listEvents({ page, size, sortBy, sortDir });

    request$.subscribe({
      next: (pageData) => {
        this.state.update((s) => ({
          ...s,
          events: pageData.content,
          isLoading: false,
          error: null,
          totalPages: pageData.totalPages,
          totalElements: pageData.totalElements,
        }));
      },
      error: (err) => {
        this.state.update((s) => ({ ...s, isLoading: false, error: err.message }));
      },
    });
  }

  applySort(sort: { sortBy: string; sortDir: string }): void {
    this.state.update((s) => ({
      ...s,
      sortBy: sort.sortBy,
      sortDir: sort.sortDir as 'ASC' | 'DESC',
      currentPage: 0,
    }));
    this.loadEvents();
  }

  resetFilters(): void {
    this.state.update((s) => ({
      ...s,
      sortBy: 'eventDate',
      sortDir: 'ASC',
      searchTerm: '',
      currentPage: 0,
    }));
    this.searchControl.setValue('');
    this.loadEvents();
  }

  updateSearchTerm(term: string): void {
    this.state.update((s) => ({
      ...s,
      searchTerm: term,
      currentPage: 0,
    }));
    this.loadEvents();
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.updateSearchTerm('');
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.state().totalPages) return;
    this.state.update((s) => ({ ...s, currentPage: page }));
    this.loadEvents();
  }

  openCreateDialog(): void {
    this.state.update((s) => ({ ...s, isCreating: true }));
  }

  closeCreateDialog(): void {
    this.state.update((s) => ({ ...s, isCreating: false }));
  }

  onEventCreated(event: Event): void {
    this.closeCreateDialog();
    this.notification.success('Evento creado exitosamente');
    this.loadEvents();
  }

  openEditDialog(event: Event): void {
    this.state.update((s) => ({ ...s, editingEvent: event }));
  }

  closeEditDialog(): void {
    this.state.update((s) => ({ ...s, editingEvent: null }));
  }

  onEventUpdated(_event: Event): void {
    this.closeEditDialog();
    this.notification.success('Evento actualizado exitosamente');
    this.loadEvents();
  }

  openDeleteDialog(event: Event): void {
    this.state.update((s) => ({ ...s, deletingEvent: event }));
  }

  closeDeleteDialog(): void {
    this.state.update((s) => ({ ...s, deletingEvent: null, isDeleting: false }));
  }

  confirmDelete(): void {
    const event = this.state().deletingEvent;
    if (!event) return;

    this.state.update((s) => ({ ...s, isDeleting: true }));

    this.eventService.deleteEvent(event.id).subscribe({
      next: () => {
        this.closeDeleteDialog();
        this.notification.success('Evento eliminado exitosamente');
        this.loadEvents();
      },
      error: (err) => {
        this.notification.error(err.message || 'No se pudo eliminar el evento');
        this.state.update((s) => ({ ...s, isDeleting: false }));
      },
    });
  }

  formatPrice(price: number): string {
    return formatCurrency(price);
  }
}
