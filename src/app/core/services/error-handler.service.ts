import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * User-friendly error messages mapped by error category.
 * Technical errors are NEVER shown to the user.
 */
const USER_MESSAGES: Record<string, string> = {
  // Network errors
  'offline': 'Sin conexión a internet. Verifica tu conexión e intenta de nuevo.',
  'timeout': 'La conexión tardó demasiado. Intenta de nuevo en unos segundos.',
  'network_error': 'Error de conexión. Verifica tu internet.',

  // Auth errors
  '401': 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  '403': 'No tienes permiso para realizar esta acción.',

  // Client errors
  '400': 'La solicitud no es válida. Verifica los datos.',
  '404': 'El recurso solicitado no fue encontrado.',
  '422': 'Los datos enviados no son válidos.',

  // Server errors
  '500': 'Ocurrió un error en el servidor. Intenta más tarde.',
  '502': 'El servidor no está disponible. Intenta más tarde.',
  '503': 'El servicio está en mantenimiento. Intenta más tarde.',
  '429': 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.',

  // Domain-specific
  'empty_response': 'No se recibió respuesta del servidor.',
  'buy_failed': 'No se pudo completar la compra. Intenta de nuevo.',
  'players_load_failed': 'No se pudieron cargar los jugadores.',
  'add_investment_failed': 'No se pudo agregar la inversión.',

  // Sync-specific (Cycle 5 UX de confianza)
  'sync_in_progress': 'Sincronización en progreso. Espera un momento...',
  'sync_pending': 'Tienes operaciones pendientes. Espera a que completen.',
  'sync_error': 'Error de sincronización. Intenta de nuevo.',
  'sync_retrying': 'Reintentando sincronización...',
  'sync_blocked': 'Operación bloqueada. Espera a que la sincronización complete.',

  // Fallback
  'unknown': 'Ocurrió un error inesperado. Intenta de nuevo.',
};

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  message: string;
  type: ToastType;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {

  // ---------- Toast signals ----------
  private _toast = signal<ToastMessage | null>(null);
  readonly toast = this._toast.asReadonly();

  /**
   * Maps an error to a user-friendly message.
   * Returns the safe message to display.
   */
  getUserFriendlyMessage(error: unknown, context?: string): string {
    // Offline detection
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return USER_MESSAGES['offline'];
    }

    if (error instanceof HttpErrorResponse) {
      // Check for domain-specific messages from API
      if (error.error && typeof error.error === 'object' && 'message' in error.error) {
        const apiMsg = error.error.message;
        if (typeof apiMsg === 'string' && apiMsg.length > 0) {
          // Only use API message if it looks user-friendly (not technical)
          if (!apiMsg.includes('Error') && !apiMsg.includes('Exception') && !apiMsg.includes('stack')) {
            return apiMsg;
          }
        }
      }

      // Map HTTP status to user message
      const statusKey = String(error.status);
      if (USER_MESSAGES[statusKey]) {
        return USER_MESSAGES[statusKey];
      }

      // Generic server error for 5xx
      if (error.status >= 500) {
        return USER_MESSAGES['500'];
      }
    }

    // Network error (no HTTP response)
    if (error instanceof ProgressEvent || (error instanceof Error && error.message === 'NetworkError')) {
      return USER_MESSAGES['network_error'];
    }

    // Context-specific fallback
    if (context) {
      const contextKey = `${context}_failed`;
      if (USER_MESSAGES[contextKey]) {
        return USER_MESSAGES[contextKey];
      }
    }

    return USER_MESSAGES['unknown'];
  }

  /**
   * Shows a toast notification to the user.
   * Auto-dismisses after durationMs (default: 3000ms).
   */
  showToast(message: string, type: ToastType = 'info', durationMs = 3000): void {
    this._toast.set({ message, type, durationMs });
    setTimeout(() => {
      // Only clear if it's the same toast (avoid race conditions)
      if (this._toast()?.message === message) {
        this._toast.set(null);
      }
    }, durationMs);
  }

  /**
   * Shows an error toast with a user-friendly message derived from the error.
   */
  showErrorToast(error: unknown, context?: string): void {
    const message = this.getUserFriendlyMessage(error, context);
    this.showToast(message, 'error');
  }

  /**
   * Shows a success toast notification.
   */
  showSuccessToast(message: string): void {
    this.showToast(message, 'success');
  }

  /**
   * Dismisses the current toast immediately.
   */
  dismissToast(): void {
    this._toast.set(null);
  }
}
