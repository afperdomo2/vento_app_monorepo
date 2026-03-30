import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface SortOption {
  value: string;
  label: string;
  dir: 'ASC' | 'DESC';
}

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-surface-container-low rounded-xl p-4">
      <div class="flex flex-wrap gap-4 items-center">
        <!-- Sort Filter -->
        <div class="flex items-center gap-2">
          <label class="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
            Ordenar
          </label>
          <select
            [ngModel]="selectedSort"
            (ngModelChange)="onSortChange($event)"
            class="bg-surface-container-lowest border-none rounded-full py-2 px-4 focus:ring-2 ring-primary-container font-body text-sm min-w-[200px]"
          >
            @for (option of sortOptions; track option) {
              <option [value]="option.value + '|' + option.dir">{{ option.label }}</option>
            }
          </select>
        </div>

        <!-- Reset Button -->
        <button
          (click)="onReset()"
          class="ml-auto flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dim transition-colors"
        >
          <span class="material-symbols-outlined text-lg">refresh</span>
          Restablecer
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FiltersBarComponent {
  @Output() sortChange = new EventEmitter<{ sortBy: string; sortDir: string }>();
  @Output() reset = new EventEmitter<void>();

  selectedSort = 'eventDate|ASC';

  sortOptions: SortOption[] = [
    { value: 'eventDate', label: 'Fecha (próximos primero)', dir: 'ASC' },
    { value: 'eventDate', label: 'Fecha (más lejanos primero)', dir: 'DESC' },
    { value: 'price', label: 'Precio (menor a mayor)', dir: 'ASC' },
    { value: 'price', label: 'Precio (mayor a menor)', dir: 'DESC' },
    { value: 'name', label: 'Nombre (A-Z)', dir: 'ASC' },
  ];

  onSortChange(value: string): void {
    this.selectedSort = value;
    const [sortBy, sortDir] = value.split('|');
    this.sortChange.emit({ sortBy, sortDir: sortDir as 'ASC' | 'DESC' });
  }

  onReset(): void {
    this.selectedSort = 'eventDate|ASC';
    this.reset.emit();
  }
}
