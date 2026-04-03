import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastNotificationComponent],
  template: `
    <router-outlet />
    <app-toast-notification />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ],
})
export class App {}
