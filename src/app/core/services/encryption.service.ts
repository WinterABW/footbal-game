import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Encryption service using Web Crypto API for SHA256 hashing.
 */
@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  // SECURITY FIX: Removed secretKey from client - server validates via session

  /**
   * Computes SHA256 hash of the input string.
   * Uses Web Crypto API for browser-compatible hashing.
   */
  async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Generates a unique anti-automation token.
   * Format: SHA256(userId:timestamp) - no secret in client
   */
  async generateUniqueToken(userId: string | number): Promise<{ token: string; timestamp: number }> {
    const timestamp = Date.now();
    // SECURITY FIX: Remove secret from client
    const payload = `${userId}:${timestamp}`;
    const token = await this.sha256(payload);
    return { token, timestamp };
  }
}
