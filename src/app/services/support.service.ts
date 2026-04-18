import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiMessage, SupportMessage, HasPendingMessagesResponse, SendMessageRequest, SendMessageResponse } from '../models/support.model';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;
  private pollingIntervalMs = environment.supportChatPollingInterval || 3000;
  
  // Timer reference for polling
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  
  // State signals
  messages = signal<SupportMessage[]>([]);
  isPolling = signal(false);
  sendError = signal<string | null>(null);
  hasPending = signal(false);
  
  // Computed values - track if we have any messages
  hasMessages = computed(() => this.messages().length > 0);
  
  private apiUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // Fetch all messages from backend
  fetchMessages(): void {
    this.http.get<ApiMessage[]>(this.apiUrl('Support/getMessages'))
      .pipe(
        // Note: Using rxjs catchError pattern with HttpClient
      )
      .subscribe({
        next: (apiMessages) => {
          const supportMessages: SupportMessage[] = (apiMessages || []).map(apiMsg => ({
            id: apiMsg.id,
            content: apiMsg.message,
            timestamp: apiMsg.created,
            isFromSupport: apiMsg.fromAdmin
          }));

          // Sort chronologically (oldest first for chat display)
          const sorted = [...supportMessages].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          this.messages.set(sorted);
        },
        error: (err) => {
          console.error('[SupportService] Failed to fetch messages:', err);
        }
      });
  }

  // Check for pending messages (lightweight poll)
  checkForPendingMessages(): void {
    this.http.get<HasPendingMessagesResponse>(this.apiUrl('Support/hasPendingMessages'))
      .subscribe({
        next: (response) => {
          const pending = response?.hasPending ?? false;
          this.hasPending.set(pending);
          
          // Only fetch full history if there are pending messages
          if (pending) {
            this.fetchMessages();
          }
        },
        error: (err) => {
          console.error('[SupportService] Failed to check pending:', err);
          this.hasPending.set(false);
        }
      });
  }

  // Start polling with optional interval override
  startPolling(interval?: number): void {
    if (this.isPolling()) {
      return; // Already polling, prevent duplicate timers
    }
    
    this.isPolling.set(true);
    
    // Fetch immediately on start (full history)
    this.fetchMessages();
    
    // Then run periodic full fetches
    const ms = interval || this.pollingIntervalMs;
    
    this.pollingTimer = setInterval(() => {
      this.fetchMessages();
    }, ms);
  }

  // Stop polling safely
  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPolling.set(false);
  }

  // Send a message with optimistic UI
  sendMessage(content: string): void {
    const trimmed = content.trim();
    if (!trimmed) return;
    
    // Optimistic UI: add message immediately
    const optimisticId = Date.now();
    const optimisticMessage: SupportMessage = {
      id: optimisticId,
      content: trimmed,
      timestamp: new Date().toISOString(),
      isFromSupport: false
    };
    
    this.messages.update(msgs => [...msgs, optimisticMessage]);
    this.sendError.set(null);
    
    const request: SendMessageRequest = { message: trimmed };
    
    this.http.post<SendMessageResponse>(this.apiUrl('Support/sendMessage'), [request])
      .subscribe({
        next: (response) => {
          if (response?.success) {
            // Mark that we should check for more messages on next poll
            this.hasPending.set(true);
          } else {
            // Rollback on server failure
            this.messages.update(msgs => msgs.filter(m => m.id !== optimisticId));
            this.sendError.set('Error del servidor. Intenta de nuevo.');
          }
        },
        error: (err) => {
          console.error('[SupportService] Failed to send message:', err);
          // Rollback optimistic update on failure
          this.messages.update(msgs => msgs.filter(m => m.id !== optimisticId));
          this.sendError.set('Error al enviar mensaje. Intenta de nuevo.');
        }
      });
  }
}