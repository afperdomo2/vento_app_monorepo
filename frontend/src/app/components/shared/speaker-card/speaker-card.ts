import { Component, Input } from '@angular/core';

interface SpeakerCardData {
  name: string;
  role: string;
  imageUrl: string;
}

@Component({
  selector: 'app-speaker-card',
  standalone: true,
  template: `
    <div class="group relative bg-surface-container rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
      <img 
        [src]="speaker.imageUrl" 
        [alt]="speaker.name"
        class="w-full h-64 object-cover"
      />
      <div class="p-6">
        <h3 class="font-headline font-bold text-xl">{{ speaker.name }}</h3>
        <p class="text-primary font-medium text-sm">{{ speaker.role }}</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SpeakerCard {
  @Input({ required: true }) speaker!: SpeakerCardData;
}
