import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { getEnvValue } from '../../../environments/env.config';
import { ApiResponse, PagedResponse } from '../models/api.models';
import {
  BackendEvent,
  Event,
  ListEventsParams,
  SearchEventsParams,
  NearbyEventsParams,
  CreateEventRequest,
  UpdateEventRequest,
} from '../models/event.models';
import { mapBackendEventsToEvents } from '../mappers/event.mapper';
import { createHttpErrorHandler } from '../handlers/http-error.handler';

/**
 * API URL configuration
 * Uses environment variable from window.__env (injected via index.html)
 */
const API_URL = getEnvValue('API_URL');

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/api/events`;

  private handleError = createHttpErrorHandler({
    context: 'EventService',
    messages: {
      default: 'Ocurrió un error al cargar los eventos',
      notFound: 'No se encontraron eventos destacados',
    },
  });

  createEvent(request: CreateEventRequest): Observable<Event> {
    return this.http.post<ApiResponse<BackendEvent>>(this.apiUrl, request).pipe(
      map((response) => mapBackendEventsToEvents([response.data])[0]),
      catchError(this.handleError),
    );
  }

  updateEvent(id: string, request: UpdateEventRequest): Observable<Event> {
    return this.http.put<ApiResponse<BackendEvent>>(`${this.apiUrl}/${id}`, request).pipe(
      map((response) => mapBackendEventsToEvents([response.data])[0]),
      catchError(this.handleError),
    );
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  getFeaturedEvents(limit: number = 6): Observable<Event[]> {
    // Ensure limit is between 6 and 20
    const safeLimit = Math.max(6, Math.min(20, limit));

    return this.http
      .get<ApiResponse<BackendEvent[]>>(`${this.apiUrl}/featured?limit=${safeLimit}`)
      .pipe(
        map((response) => mapBackendEventsToEvents(response.data)),
        catchError(this.handleError),
      );
  }

  listEvents(params: ListEventsParams): Observable<PagedResponse<Event>> {
    const queryParams: Record<string, string | number> = {
      page: params.page,
      size: params.size,
      sortBy: params.sortBy || 'eventDate',
      sortDir: params.sortDir || 'ASC',
    };

    return this.http
      .get<ApiResponse<PagedResponse<BackendEvent>>>(this.apiUrl, {
        params: queryParams,
      })
      .pipe(
        map((response) => ({
          ...response.data,
          content: mapBackendEventsToEvents(response.data.content),
        })),
        catchError(this.handleError),
      );
  }

  /**
   * Search events using Elasticsearch endpoint (full-text search).
   * Used when there's a search term; returns Page.empty() for blank queries.
   */
  searchEvents(params: SearchEventsParams): Observable<PagedResponse<Event>> {
    const queryParams: Record<string, string | number> = {
      q: params.q,
      page: params.page,
      size: params.size,
    };

    return this.http
      .get<ApiResponse<PagedResponse<BackendEvent>>>(`${this.apiUrl}/search`, {
        params: queryParams,
      })
      .pipe(
        map((response) => ({
          ...response.data,
          content: mapBackendEventsToEvents(response.data.content),
        })),
        catchError(this.handleError),
      );
  }

  /**
   * Search events by geographic proximity using Elasticsearch geo-distance query.
   * Returns events within a specified radius of the given coordinates.
   */
  searchNearbyEvents(params: NearbyEventsParams): Observable<PagedResponse<Event>> {
    const queryParams: Record<string, string | number> = {
      lat: params.lat,
      lon: params.lon,
      distance: params.distance || '10km',
      page: params.page,
      size: params.size,
    };

    return this.http
      .get<ApiResponse<PagedResponse<BackendEvent>>>(`${this.apiUrl}/search/nearby`, {
        params: queryParams,
      })
      .pipe(
        map((response) => ({
          ...response.data,
          content: mapBackendEventsToEvents(response.data.content),
        })),
        catchError(this.handleError),
      );
  }

  getEventById(id: string): Observable<Event> {
    return this.http.get<ApiResponse<BackendEvent>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => mapBackendEventsToEvents([response.data])[0]),
      catchError(this.handleError),
    );
  }
}
