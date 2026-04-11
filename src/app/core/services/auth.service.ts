import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, ApiMessageResponse, ProfileResponse } from '../../models/user.model';
import { UserStatusService } from './user-status.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSignal = signal<any>(null);
  private http = inject(HttpClient);
  private router = inject(Router);
  private userStatusService = inject(UserStatusService);

  user = this.userSignal.asReadonly();
  isAuthenticated = computed(() => this.userSignal() !== null);
  authToken = signal<string | null>(null);
  restored = signal<boolean>(false);

  constructor() {
    // Load auth from storage without blocking
    this.loadAuthFromStorage().catch(err => console.error('Failed to load auth from storage:', err));
  }

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  private async loadAuthFromStorage(): Promise<void> {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        this.userSignal.set(parsedUser);
        this.authToken.set(storedToken);
      } catch {
        this.clearAuthStorage();
        this.restored.set(true);
        return;
      }

      // Fetch fresh user status (wallet, coins, etc.) — don't fail auth if this errors
      try {
        await this.userStatusService.loadUserStatus();
        const userStatus = this.userStatusService.userStatus();
        if (userStatus && userStatus.id && !this.userSignal()?.id) {
          const updatedUser = { ...this.userSignal()!, id: userStatus.id };
          this.userSignal.set(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Failed to refresh user status on restore:', error);
        // Keep auth — user stays logged in, status will refresh on next action
      }
    }
    this.restored.set(true);
  }

  private saveAuthStorage(user: any, token: string): void {
    // Ensure id is captured from various possible sources
    const userId = user.id ?? user.Id ?? user.userId;
    const userData = {
      ...user,
      id: userId ?? null,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('auth_token', token);
    this.userSignal.set(userData);
    this.authToken.set(token);
  }

  private clearAuthStorage(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    this.userSignal.set(null);
    this.authToken.set(null);
  }

  async login(username: string, password: string, phone?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}Auth/login`;
      const body: { username: string; password: string; phone?: string } = { username, password };
      if (phone) body.phone = phone;
      
      const response = await lastValueFrom(this.http.post(url, body)) as AuthResponse | string | null;

      let user: { id?: number; username: string; isGuest: boolean } = { username, isGuest: false };
      let token: string;

      if (response && typeof response === 'string') {
        token = response;
      } else if (response && typeof response === 'object' && 'token' in response) {
        const authResp = response as AuthResponse;
        token = authResp.token;
        user.id = authResp.id;
      } else {
        return { success: false, error: 'Login failed' };
      }

      this.saveAuthStorage(user, token);
      await this.userStatusService.loadUserStatus();
      
      // Update user with ID from userStatus if not present
      const userStatus = this.userStatusService.userStatus();
      if (userStatus && userStatus.id && !this.userSignal()?.id) {
        const updatedUser = { ...this.userSignal()!, id: userStatus.id };
        this.userSignal.set(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return { success: true };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      if (httpError?.error && typeof httpError.error === 'string') {
        return { success: false, error: httpError.error };
      }
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async guest(username: string, refId?: number | string | null): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}Auth/guest`;
      const body: { username: string; refId?: number | string | null } = { username };
      if (refId !== undefined) body.refId = refId;

      const response = await lastValueFrom(this.http.post(url, body)) as AuthResponse | string | null;

      let user: { id?: number; username: string; isGuest: boolean } = { username, isGuest: true };
      let token: string;

      if (response && typeof response === 'string') {
        token = response;
      } else if (response && typeof response === 'object' && 'token' in response) {
        const authResp = response as AuthResponse;
        token = authResp.token;
        user.id = authResp.id;
      } else {
        return { success: false, error: 'Guest login failed' };
      }

      this.saveAuthStorage(user, token);
      await this.userStatusService.loadUserStatus();
      
      // Update user with ID from userStatus if not present
      const userStatus = this.userStatusService.userStatus();
      if (userStatus && userStatus.id && !this.userSignal()?.id) {
        const updatedUser = { ...this.userSignal()!, id: userStatus.id };
        this.userSignal.set(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return { success: true };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('Guest login failed:', error);
      return { success: false, error: 'Guest login failed' };
    }
  }

  async register(username: string, password: string, phone?: string | null, refId?: number | string | null): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}Auth/register`;
      const body: any = { username, password };
      if (phone !== undefined) body.phone = phone;
      if (refId !== undefined) body.refId = refId;

      const response = await lastValueFrom(this.http.post<AuthResponse>(url, body));

      if (response) {
        const user: any = { username: response.username, isGuest: response.isGuest };
        if (response.id) user.id = response.id;
        this.saveAuthStorage(user, response.token);
        await this.userStatusService.loadUserStatus();
        
        // Update user with ID from userStatus if not present
        const userStatus = this.userStatusService.userStatus();
        if (userStatus && userStatus.id && !this.userSignal()?.id) {
          const updatedUser = { ...this.userSignal()!, id: userStatus.id };
          this.userSignal.set(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  logout(): void {
    this.clearAuthStorage();
    this.userStatusService.clearUserStatus();
    this.router.navigate(['/welcome']);
  }

  getUsername(): string {
    return this.userSignal()?.username || 'Usuario';
  }

  getToken(): string | null {
    // Use signal first, fallback to localStorage
    return this.authToken() ?? localStorage.getItem('auth_token');
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  async getProfile(username: string): Promise<{ success: boolean; profile?: ProfileResponse; error?: string }> {
    try {
      const url = `${this.getBaseUrl()}Auth/profile/${username}`;
      const response = await lastValueFrom(this.http.get<ProfileResponse>(url, { responseType: 'json' }));

      if (response) {
        return { success: true, profile: response };
      }

      return { success: false, error: 'Failed to get profile' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 404) {
        return { success: false, error: 'Profile not found' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'detail' in httpError.error) {
        return { success: false, error: String((httpError.error as any).detail) };
      }
      console.error('Get profile failed:', error);
      return { success: false, error: 'Failed to get profile' };
    }
  }
}
