import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private http = inject(HttpClient);

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  async addTooks(coins: number): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}Game/addTooks`;
      await this.http.post(url, { coins }).toPromise();

      return { success: true };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('AddTooks failed:', error);
      return { success: false, error: 'Failed to add coins' };
    }
  }

  async casinoPlay(earn: number, tickets: number): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Game/casinoPlay`;
      const response = await this.http.post<ApiMessageResponse>(url, { earn, tickets }).toPromise();

      if (response) {
        return { success: true, message: response.message };
      }

      return { success: false, error: 'Casino play failed' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
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
      const response = await this.http.post<ApiMessageResponse>(url, { energy }).toPromise();

      if (response) {
        return { success: true, message: response.message };
      }

      return { success: false, error: 'Failed to update energy' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('UpdateEnergyState failed:', error);
      return { success: false, error: 'Failed to update energy' };
    }
  }
}
