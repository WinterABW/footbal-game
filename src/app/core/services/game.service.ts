import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse } from '../../models/user.model';
import { UserStatusService } from './user-status.service';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private http = inject(HttpClient);
  private userStatusService = inject(UserStatusService);
  private authService = inject(AuthService);
  private encryptionService = inject(EncryptionService);
  // SECURITY FIX: Removed secretKey from client - server validates via session

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  async addTooks(coins: number): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}Game/addTooks`;
      
      // Generate token and timestamp following the same pattern as casinoPlay
      const user = this.authService.user();
      const userId = user ? (user.id || user.Id) : null;
      
      // Ensure userId is present - same as casinoPlay
      if (!userId) {
        await this.userStatusService.loadUserStatus();
        const refreshedUser = this.authService.user();
        const refreshedUserId = refreshedUser ? (refreshedUser.id || refreshedUser.Id) : null;
        
        if (!refreshedUserId) {
          return { success: false, error: 'User not authenticated' };
        }
      }
      
const timestamp = Math.floor(Date.now() / 1000);
      const finalUserId = userId || (this.authService.user()?.id || this.authService.user()?.Id);
      // SECURITY FIX: Remove secret from client
      const token = ''; // Server validates via session
      
      const response = await this.http.post<ApiMessageResponse>(url, {
        earn: 0, 
        tickets: 1,
        token,
        timestamp
      }).toPromise();

      // Refresh user status to reflect the deducted ticket
      await this.userStatusService.loadUserStatus();
      
      return { success: true };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.status === 400) {
        return { success: false, error: 'No tickets available' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('DeductTicket failed:', error);
      return { success: false, error: 'Failed to deduct ticket' };
    }
  }

  async casinoPlay(earn: number, tickets: number): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Game/casinoPlay`;
      
      // Generate token and timestamp - ensure userId is present
      const user = this.authService.user();
      const userId = user ? (user.id || user.Id) : null;
      
      if (!userId) {
        // Try to refresh user status in case session was restored
        await this.userStatusService.loadUserStatus();
        const refreshedUser = this.authService.user();
        const refreshedUserId = refreshedUser ? (refreshedUser.id || refreshedUser.Id) : null;
        
        if (!refreshedUserId) {
          return { success: false, error: 'User not authenticated' };
        }
      }
      
      const timestamp = Math.floor(Date.now() / 1000);
      const finalUserId = userId || (this.authService.user()?.id || this.authService.user()?.Id);
      const token = ''; // Server validates via session
      
      const response = await this.http.post<ApiMessageResponse>(url, { 
        earn, 
        tickets,
        token,
        timestamp
      }).toPromise();

      // Refresh user status after successful operation
      await this.userStatusService.loadUserStatus();
      
      return { success: true, message: response?.message || 'Success' };
    } catch (error: unknown) {
      // Always refresh user status on failure to stay in sync with backend
      await this.userStatusService.loadUserStatus();
      
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.status === 400) {
        return { success: false, error: 'Invalid request' };
      }
      if (httpError?.status === 500) {
        return { success: false, error: 'Server error' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('CasinoPlay failed:', error);
      return { success: false, error: 'Casino play failed' };
    }
  }

  async upgradeSkills(skillId: number, price: number): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Game/upgradeSkills`;
      const response = await this.http.post<ApiMessageResponse>(url, { skillId, price }).toPromise();

      if (response) {
        // Refresh user status after successful operation
        await this.userStatusService.loadUserStatus();
        
        return { success: true, message: response.message };
      }

      return { success: false, error: 'Upgrade skills failed' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 400) {
        return { success: false, error: 'Bad request' };
      }
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('UpgradeSkills failed:', error);
      return { success: false, error: 'Upgrade skills failed' };
    }
  }

  async updateEnergyState(energy: number): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Game/updateEnergyState`;
      
      // Generate token and timestamp for security
      const user = this.authService.user();
      const userId = user ? (user.id || user.Id) : null;
      
      if (!userId) {
        await this.userStatusService.loadUserStatus();
        const refreshedUser = this.authService.user();
        const refreshedUserId = refreshedUser ? (refreshedUser.id || refreshedUser.Id) : null;
        
        if (!refreshedUserId) {
          return { success: false, error: 'User not authenticated' };
        }
      }
      
      const timestamp = Math.floor(Date.now() / 1000);
      const finalUserId = userId || (this.authService.user()?.id || this.authService.user()?.Id);
      const token = ''; // Server validates via session
      
      const response = await this.http.post<ApiMessageResponse>(url, { energy, token, timestamp }).toPromise();

      // Refresh user status to sync energy balance
      await this.userStatusService.loadUserStatus();

      return { success: true, message: response?.message || 'Energy updated' };
    } catch (error: unknown) {
      // Always refresh user status on failure to stay in sync
      await this.userStatusService.loadUserStatus();
      
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.status === 400) {
        return { success: false, error: 'Bad request' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('UpdateEnergyState failed:', error);
      return { success: false, error: 'Failed to update energy' };
    }
  }

  // Mini-games ticket deduction
  async deductTicket(): Promise<{ success: boolean; error?: string }> {
    // Stub for mini-games - implement if needed
    return { success: true };
  }
}
