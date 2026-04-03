import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse } from '../../models/user.model';

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

export interface SkillLevelInfo {
  [level: string]: {
    $type: 'energy_plus' | 'max_energy' | 'tap_power';
    lvl: number;
    price: number;
    energyRechargeTime?: number;  // energy_plus: segundos de recarga
    maxEnergy?: number;           // max_energy: capacidad máxima
    tooks?: number;               // tap_power: monedas por toque
  };
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

  async getUserStatus(pendingTaps?: number): Promise<{ success: boolean; error?: string; data?: UserStatusResponse }> {
    try {
      const url = `${this.getBaseUrl()}UserInfo/getUserStatus`;
      // Send pendingTaps as query parameter if provided
      const options = pendingTaps ? { params: { pendingTaps: pendingTaps.toString() } } : {};
      const response = await this.http.get<UserStatusResponse>(url, options).toPromise();

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

  async getSkillInfo(skillId: number): Promise<{ success: boolean; error?: string; data?: SkillLevelInfo }> {
    try {
      const url = `${this.getBaseUrl()}Game/getSkillInfo`;
      const body = { skillId };
      const response = await this.http.post<SkillLevelInfo>(url, body).toPromise();

      if (response) {
        return { success: true, data: response };
      }

      return { success: false, error: 'Failed to get skill info' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('GetSkillInfo failed:', error);
      return { success: false, error: 'Failed to get skill info' };
    }
  }

  async purchaseSkill(skillId: number): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Game/purchaseSkill`;
      const body = { skillId };
      const response = await this.http.post<{ success: boolean; message?: string }>(url, body).toPromise();

      if (response) {
        return { success: response.success, message: response.message };
      }

      return { success: false, error: 'Failed to purchase skill' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('PurchaseSkill failed:', error);
      return { success: false, error: 'Failed to purchase skill' };
    }
  }
}
