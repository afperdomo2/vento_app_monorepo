import { Directive, HostListener, inject, ElementRef, Output, EventEmitter } from '@angular/core';

/**
 * ClickOutside Directive
 * 
 * Emits an event when a click occurs outside the host element.
 * Useful for closing dropdowns, modals, and popovers.
 * 
 * Usage:
 * ```html
 * <div (clickOutside)="handleClickOutside()">
 *   Content
 * </div>
 * ```
 */
@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private elementRef = inject(ElementRef);

  @Output() clickOutside = new EventEmitter<void>();

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}
