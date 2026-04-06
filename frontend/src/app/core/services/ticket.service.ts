import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { getEnvValue } from '../../../environments/env.config';
import { createHttpErrorHandler } from '../handlers/http-error.handler';
import { ApiResponse } from '../models/api.models';
import { Ticket } from '../models/ticket.models';

const API_URL = getEnvValue('API_URL');

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/api/events/tickets`;

  private handleError = createHttpErrorHandler({
    context: 'TicketService',
    messages: {
      default: 'Ocurrió un error al cargar los tickets',
      notFound: 'Tickets no encontrados',
    },
  });

  /**
   * Obtiene los tickets de una orden específica.
   */
  getTicketsByOrder(orderId: string): Observable<Ticket[]> {
    return this.http
      .get<ApiResponse<Ticket[]>>(`${this.apiUrl}/order/${orderId}`)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene todos los tickets del usuario autenticado.
   */
  getMyTickets(): Observable<Ticket[]> {
    return this.http
      .get<ApiResponse<Ticket[]>>(`${this.apiUrl}/my-tickets`)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }
}
