import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { getEnvValue } from '../../../environments/env.config';
import { ApiResponse, PagedResponse } from '../models/api.models';
import { Order } from '../models/order.models';

const API_URL = getEnvValue('API_URL');

/**
 * Pure HTTP layer for the orders API.
 * Responsibility: talk to /api/orders, return raw Order DTOs.
 * No UI logic, no enrichment, no state management.
 */
@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/api/orders`;

  /**
   * Fetch a paginated list of the authenticated user's orders.
   * Orders are sorted by createdAt DESC (enforced server-side).
   */
  getMyOrders(page: number, size: number = 10): Observable<PagedResponse<Order>> {
    return this.http
      .get<ApiResponse<PagedResponse<Order>>>(`${this.apiUrl}/my-orders`, {
        params: { page: String(page), size: String(size) },
      })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Fetch a single order by ID.
   * The API Gateway validates ownership via the Bearer token / X-User-Id header.
   */
  getOrderById(id: string): Observable<Order> {
    return this.http
      .get<ApiResponse<Order>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error al cargar los pedidos';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 0:
          errorMessage =
            'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
          break;
        case 404:
          errorMessage = 'Pedido no encontrado';
          break;
        case 403:
          errorMessage = 'No tienes permiso para ver este pedido';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error: ${error.status}`;
      }
    }

    console.error('OrderService error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
