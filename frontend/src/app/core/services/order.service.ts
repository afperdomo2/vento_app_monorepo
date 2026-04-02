import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { getEnvValue } from '../../../environments/env.config';
import { createHttpErrorHandler } from '../handlers/http-error.handler';
import { ApiResponse, PagedResponse } from '../models/api.models';
import { Order } from '../models/order.models';

const API_URL = getEnvValue('API_URL');

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/api/orders`;


  private handleError = createHttpErrorHandler({
    context: 'OrderService',
    messages: {
      default: 'Ocurrió un error al cargar los pedidos',
      notFound: 'Pedido no encontrado',
      forbidden: 'No tienes permiso para ver este pedido',
    },
  });


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


  getOrderById(id: string): Observable<Order> {
    return this.http
      .get<ApiResponse<Order>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }
}
