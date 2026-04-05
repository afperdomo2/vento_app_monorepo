import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { getEnvValue } from '../../../environments/env.config';
import { createHttpErrorHandler } from '../handlers/http-error.handler';
import { ApiResponse } from '../models/api.models';
import { PaymentRequest, PaymentResult } from '../models/payment.models';

const API_URL = getEnvValue('API_URL');

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/api/payments`;

  private handleError = createHttpErrorHandler({
    context: 'PaymentService',
    messages: {
      default: 'Ocurrió un error al procesar el pago',
    },
  });

  /**
   * Procesa un pago simulado para una orden.
   * El servicio simula 80% éxito, 20% fallo con 2s de delay.
   */
  processPayment(request: PaymentRequest): Observable<PaymentResult> {
    return this.http
      .post<ApiResponse<PaymentResult>>(`${this.apiUrl}/process`, request)
      .pipe(
        map((response) => response.data),
        catchError(this.handleError)
      );
  }
}
