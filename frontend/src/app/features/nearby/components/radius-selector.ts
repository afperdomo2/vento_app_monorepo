import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RADIUS_OPTIONS, RadiusOption } from '../services/nearby-events.service';

@Component({
  selector: 'app-radius-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-3 flex-wrap">
      <span class="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Radio:</span>
      @for (option of radiusOptions; track option) {
        <button
          type="button"
          (click)="radiusSelected.emit(option)"
          [class]="
            'px-4 py-2 rounded-full text-sm font-bold transition-all ' +
            (isSelected(option)
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')
          "
        >
          {{ option }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class RadiusSelectorComponent {
  readonly currentRadius = input.required<RadiusOption>();
  readonly radiusSelected = output<RadiusOption>();

  readonly radiusOptions = RADIUS_OPTIONS;

  isSelected(option: RadiusOption): boolean {
    return this.currentRadius() === option;
  }
}
