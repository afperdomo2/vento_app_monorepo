import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

/**
 * Configuración de mensajes de error por código de estado HTTP
 */
export interface HttpErrorMessages {
  /** Mensaje por defecto cuando no hay un mensaje específico */
  default: string;
  /** Mensaje para error de conexión (status 0) */
  connection?: string;
  /** Mensaje para recurso no encontrado (status 404) */
  notFound?: string;
  /** Mensaje para error de autorización (status 403) */
  forbidden?: string;
  /** Mensaje para error interno del servidor (status 500) */
  serverError?: string;
}

/**
 * Configuración del handler de errores HTTP
 */
export interface HttpErrorHandlerConfig {
  /** Contexto o recurso para logging (ej: 'EventService', 'OrderService') */
  context: string;
  /** Mensajes de error configurables */
  messages: HttpErrorMessages;
}

/**
 * Mensajes de error por defecto
 */
const DEFAULT_ERROR_MESSAGES: HttpErrorMessages = {
  default: 'Ocurrió un error al cargar los datos',
  connection:
    'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
  notFound: 'Recurso no encontrado',
  serverError: 'Error interno del servidor',
};

/**
 * Crea un handler de errores HTTP configurable para un servicio específico.
 *
 * @param config - Configuración con contexto y mensajes personalizados
 * @returns Función que maneja HttpErrorResponse y retorna Observable<never>
 *
 * @example
 * // En EventService
 * private handleError = createHttpErrorHandler({
 *   context: 'EventService',
 *   messages: {
 *     default: 'Ocurrió un error al cargar los eventos',
 *     notFound: 'No se encontraron eventos destacados',
 *   },
 * });
 */
export function createHttpErrorHandler(
  config: HttpErrorHandlerConfig
): (error: HttpErrorResponse) => Observable<never> {
  const messages: Required<HttpErrorMessages> = {
    default: config.messages.default,
    connection: config.messages.connection ?? DEFAULT_ERROR_MESSAGES.connection!,
    notFound: config.messages.notFound ?? DEFAULT_ERROR_MESSAGES.notFound!,
    forbidden:
      config.messages.forbidden ??
      'No tienes permiso para realizar esta acción',
    serverError:
      config.messages.serverError ?? DEFAULT_ERROR_MESSAGES.serverError!,
  };

  return (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = messages.default;

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 0:
          errorMessage = messages.connection;
          break;
        case 403:
          errorMessage = messages.forbidden;
          break;
        case 404:
          errorMessage = messages.notFound;
          break;
        case 500:
          errorMessage = messages.serverError;
          break;
        default:
          errorMessage = `Error: ${error.status}`;
      }
    }

    // Log del error con contexto para debugging
    console.error(`${config.context} error:`, error);

    return throwError(() => new Error(errorMessage));
  };
}
