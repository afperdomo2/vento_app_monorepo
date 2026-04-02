import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { OrderService } from '../../../core/services/order.service';
import { EventService } from '../../../core/services/event.service';
import { Order } from '../../../core/models/order.models';
import { PagedResponse } from '../../../core/models/api.models';
import { EnrichedOrder } from '../models/order.model';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop';

/**
 * Feature-level orchestration service for the My Orders feature.
 * Responsibility: combine raw Order data from OrderService with Event display
 * data from EventService to produce EnrichedOrder objects ready for the UI.
 * No HTTP calls here — delegates entirely to core services.
 */
@Injectable({
  providedIn: 'root',
})
export class MyOrdersService {
  private orderService = inject(OrderService);
  private eventService = inject(EventService);

  /**
   * Returns a paginated list of orders enriched with event display data.
   * Event fetches run in parallel via forkJoin. A failed event fetch degrades
   * gracefully — the order is still shown with a fallback title and image.
   */
  getMyOrders(page: number, size: number = 10): Observable<{
    orders: EnrichedOrder[];
    page: PagedResponse<EnrichedOrder>;
  }> {
    return this.orderService.getMyOrders(page, size).pipe(
      switchMap((pageData) => {
        if (!pageData.content.length) {
          return of({
            orders: [] as EnrichedOrder[],
            page: { ...pageData, content: [] as EnrichedOrder[] },
          });
        }

        const enrichRequests = pageData.content.map((order) =>
          this.enrichOrder(order)
        );

        return forkJoin(enrichRequests).pipe(
          map((enrichedOrders) => ({
            orders: enrichedOrders,
            page: { ...pageData, content: enrichedOrders },
          }))
        );
      })
    );
  }

  /**
   * Returns a single order enriched with event display data.
   */
  getOrderById(id: string): Observable<EnrichedOrder> {
    return this.orderService
      .getOrderById(id)
      .pipe(switchMap((order) => this.enrichOrder(order)));
  }

  /**
   * Combines a raw Order with its corresponding Event fields.
   * Falls back gracefully if the event cannot be fetched.
   */
  private enrichOrder(order: Order): Observable<EnrichedOrder> {
    return this.eventService.getEventById(order.eventId).pipe(
      map((event) => ({
        ...order,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.location,
        eventImageUrl: event.imageUrl,
        eventPrice: String(event.price),
      })),
      catchError(() =>
        of({
          ...order,
          eventTitle: 'Evento no disponible',
          eventDate: '',
          eventTime: '',
          eventVenue: '',
          eventImageUrl: FALLBACK_IMAGE,
          eventPrice: '',
        })
      )
    );
  }
}
