import { Injectable, inject } from '@angular/core';
import { ErrorHandlerService } from './error-handler.service';

/**
 * ClipboardService handles clipboard operations for both Telegram Mini App
 * and standard web environments.
 */
@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Reads text from the clipboard.
   * In Telegram Mini App, it uses the Telegram.WebApp API (Bot API 6.4+).
   * In standard browsers, it falls back to the navigator.clipboard API.
   * 
   * @param callback Function to call with the retrieved text
   */
  readText(callback: (text: string | null) => void): void {
    const win = window as any;
    const isTelegram = typeof win.Telegram !== 'undefined' && win.Telegram?.WebApp;

    if (isTelegram) {
      const webApp = win.Telegram.WebApp;

      // Check if the current version supports readTextFromClipboard (Bot API 6.4+)
      if (webApp.isVersionAtLeast('6.4')) {
        try {
          // Telegram triggers the 'clipboardTextReceived' event when this is called
          webApp.readTextFromClipboard((text: string | null) => {
            // According to docs, text is null if no access, empty string if non-text
            if (text === null) {
              this.errorHandler.showToast('Permiso de portapapeles denegado en Telegram.', 'error');
              callback(null);
            } else if (text === '') {
              this.errorHandler.showToast('El portapapeles no contiene texto.', 'info');
              callback('');
            } else {
              callback(text);
            }
          });
        } catch (err) {
          console.error('Telegram readTextFromClipboard error:', err);
          this.fallbackWebRead(callback);
        }
      } else {
        // Version older than 6.4, use web fallback
        this.fallbackWebRead(callback);
      }
    } else {
      // Not in Telegram, use web API
      this.fallbackWebRead(callback);
    }
  }

  /**
   * Standard Web Navigator Clipboard API fallback
   */
  private async fallbackWebRead(callback: (text: string | null) => void) {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }
      const text = await navigator.clipboard.readText();
      callback(text || '');
    } catch (err) {
      console.error('Web Clipboard API error:', err);
      this.errorHandler.showToast(
        'No se pudo acceder al portapapeles. Intenta pegar manualmente.',
        'error'
      );
      callback(null);
    }
  }

  /**
   * Writes text to the clipboard.
   */
  async writeText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard write error:', err);
      return false;
    }
  }
}
