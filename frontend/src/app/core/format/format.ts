/**
 * Centralized formatting utilities for the Vento application.
 * All date, time, and currency formatting goes through this module
 * to ensure consistency across the entire app.
 */

/**
 * Format a number as currency (e.g., "$150.00" or "Gratis").
 */
export function formatCurrency(amount: number, freeLabel: string = 'Gratis'): string {
  if (amount === 0) {
    return freeLabel;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Format an ISO date string to a readable date (e.g., "03 abr. 2026").
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format an ISO date string to a readable time (e.g., "20:00").
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format an ISO date string to a full date+time (e.g., "3 de abr. de 2026, 20:00").
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format an ISO date string to a relative time label (e.g., "Hace 5 min", "Hace 1 hora").
 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHr < 24) return `Hace ${diffHr} hora${diffHr > 1 ? 's' : ''}`;
  if (diffDay < 7) return `Hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;

  return formatDate(isoString);
}
