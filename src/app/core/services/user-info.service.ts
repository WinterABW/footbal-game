import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse } from '../../models/user.model';
import { LocalApiService } from './local-api.service';

export interface ReferInfoResponse {
  earnLastMonth: number;
  earnLastWeek: number;
  earnToday: number;
  earnTotal: number;
  lastMonth: number;
  lastWeek: number;
  today: number;
  total: number;
}

export interface ActualInversion {
  articleId: number;
  created: string;
}

export interface SettingsInfo {
  language: string;
  vibration: boolean;
}

export interface WalletInfo {
  principalBalance: number;
  ticketBalance: number;
  totalTooks: number;
  energy: number;
}

export interface SkillsLevelReport {
  energyPlusLVL: number;
  maxEnergyLVL: number;
  tapPowerLVL: number;
}

export interface UserStatusResponse {
  actualInversion: ActualInversion[];
  createdAt: string;
  id: number;
  phone: string | null;
  referrealId: string | null;
  settings: SettingsInfo;
  skillsLevelReport: SkillsLevelReport;
  username: string;
  wallet: WalletInfo;
  earnPerHour: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserInfoService {
  private http = inject(HttpClient);
  private localApi = inject(LocalApiService);

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  async getReferInfo(): Promise<{ success: boolean; error?: string; data?: ReferInfoResponse }> {
    try {
      const url = `${this.getBaseUrl()}UserInfo/getReferInfo`;
      const response = await this.http.get<ReferInfoResponse>(url).toPromise();

      if (response) {
        return { success: true, data: response };
      }

      return { success: false, error: 'Failed to get refer info' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('GetReferInfo failed:', error);
      return { success: false, error: 'Failed to get refer info' };
    }
  }

  async updateSettings(settings: SettingsInfo): Promise<{ success: boolean; error?: string; data?: SettingsInfo }> {
    try {
      const url = `${this.getBaseUrl()}UserInfo/updateSettings`;
      const body = { language: settings.language, vibration: settings.vibration };
      const response = await this.http.put<SettingsInfo>(url, body).toPromise();

      if (response) {
        return { success: true, data: response };
      }

      return { success: false, error: 'Failed to update settings' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('UpdateSettings failed:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }

  async getUserStatus(): Promise<{ success: boolean; error?: string; data?: UserStatusResponse }> {
    try {
      const url = `${this.getBaseUrl()}UserInfo/getUserStatus`;
      const response = await this.http.get<UserStatusResponse>(url).toPromise();

      if (response) {
        return { success: true, data: response };
      }

      return { success: false, error: 'Failed to get user status' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('GetUserStatus failed:', error);
      return { success: false, error: 'Failed to get user status' };
    }
  }
}
