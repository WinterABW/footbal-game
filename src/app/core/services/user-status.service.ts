import { Injectable, inject, signal, computed } from '@angular/core';
import { UserInfoService, UserStatusResponse, SettingsInfo } from './user-info.service';

@Injectable({
  providedIn: 'root',
})
export class UserStatusService {
  private userInfoService = inject(UserInfoService);

  // Core state signals
  readonly userStatus = signal<UserStatusResponse | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Individual data signals for granular reactivity
  readonly referrealId = signal<string | null>(null);
  readonly wallet = signal<UserStatusResponse['wallet'] | null>(null);
  readonly settings = signal<UserStatusResponse['settings'] | null>(null);
  readonly actualInversion = signal<UserStatusResponse['actualInversion'] | null>(null);
  readonly skillsLevelReport = signal<UserStatusResponse['skillsLevelReport'] | null>(null);
  readonly earnPerHour = signal<number>(0);

  // Computed signals
  readonly hasReferralId = computed(() => this.referrealId() !== null && this.referrealId() !== '');
  readonly isAuthenticated = computed(() => this.userStatus() !== null);

  async loadUserStatus(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    const result = await this.userInfoService.getUserStatus();

    if (result.success && result.data) {
      const data = result.data;
      this.userStatus.set(data);
      this.referrealId.set(data.referrealId);
      this.wallet.set(data.wallet);
      this.settings.set(data.settings);
      this.actualInversion.set(data.actualInversion);
      this.skillsLevelReport.set(data.skillsLevelReport);
      this.earnPerHour.set(data.earnPerHour);
    } else {
      console.error('UserStatusService: Failed to load user status:', result.error);
      this.error.set(result.error ?? 'Failed to load user status');
    }

    this.isLoading.set(false);
  }

  setSettings(newSettings: Partial<SettingsInfo>): void {
    this.settings.update(current => current ? { ...current, ...newSettings } : null);
  }

  clearUserStatus(): void {
    this.userStatus.set(null);
    this.referrealId.set(null);
    this.wallet.set(null);
    this.settings.set(null);
    this.actualInversion.set(null);
    this.skillsLevelReport.set(null);
    this.earnPerHour.set(0);
    this.error.set(null);
    this.isLoading.set(false);
  }
}
