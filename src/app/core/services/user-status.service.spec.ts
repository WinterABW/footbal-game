import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserStatusService, UserStatusResponse } from './user-status.service';
import { UserInfoService } from './user-info.service';

// ============================================
// TEST DATA
// ============================================

const mockUserStatusResponse: UserStatusResponse = {
  id: 1,
  phone: '+1234567890',
  username: 'testuser',
  createdAt: new Date().toISOString(),
  referrealId: 'ref-123',
  wallet: {
    principalBalance: 1000,
    ticketBalance: 50,
    totalTooks: 300,
    energy: 100,
  },
  settings: {
    language: 'es',
    vibration: true,
  },
  skillsLevelReport: {
    energyPlusLVL: 1,
    maxEnergyLVL: 1,
    tapPowerLVL: 1,
  },
  actualInversion: [],
  earnPerHour: 10,
};

// ============================================
// TESTS
// ============================================

describe('UserStatusService', () => {
  let service: UserStatusService;
  let mockGetUserStatus: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockGetUserStatus = vi.fn().mockResolvedValue({ success: true, data: mockUserStatusResponse });

    await TestBed.configureTestingModule({
      providers: [
        UserStatusService,
        {
          provide: UserInfoService,
          useValue: { getUserStatus: mockGetUserStatus }
        }
      ]
    });

    service = TestBed.inject(UserStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadUserStatus()', () => {
    it('should load user status successfully', async () => {
      await service.loadUserStatus();

      expect(mockGetUserStatus).toHaveBeenCalledWith(undefined);
      expect(service.userStatus()).toBeTruthy();
      expect(service.userStatus()?.wallet?.principalBalance).toBe(1000);
    });

    it('should respect pendingTaps parameter', async () => {
      await service.loadUserStatus(50);

      expect(mockGetUserStatus).toHaveBeenCalledWith(50);
    });

    it('should set isLoading to false after completion', async () => {
      await service.loadUserStatus();

      expect(service.isLoading()).toBe(false);
    });
  });

  // ============================================
  // CONCURRENT REFRESH - THE BUG TESTS
  // ============================================
  describe('concurrent refresh calls', () => {
    it('CURRENT BUG: should make multiple calls even when they overlap in time', async () => {
      let callOrder: number[] = [];

      // Mock returns different data per call
      mockGetUserStatus.mockImplementation(async () => {
        const callNum = callOrder.length + 1;
        callOrder.push(callNum);
        return {
          success: true,
          data: {
            ...mockUserStatusResponse,
            wallet: { ...mockUserStatusResponse.wallet, principalBalance: callNum * 1000 }
          }
        };
      });

      // Primera llamada - lenta
      const firstPromise = service.loadUserStatus();

      // Segunda llamada - inmediatamente después (DROPEADA con bug original!)
      const secondPromise = service.loadUserStatus();

      await Promise.all([firstPromise, secondPromise]);

      // Después de la fix: 2 llamadas
      const callCount = mockGetUserStatus.mock.calls.length;
      console.log(`[COALESCING TEST] Llamadas realizadas: ${callCount}, esperado: 2`);

      //Assertions para verificar comportamiento
      expect(callCount).toBe(2);
      expect(callOrder).toEqual([1, 2]);
    });

    it('should update signal with latest data after concurrent calls', async () => {
      mockGetUserStatus.mockImplementation(async () => {
        const callNum = mockGetUserStatus.mock.calls.length;
        // Primera llamada lenta, segunda rápida
        return new Promise(resolve => {
          const delay = callNum === 1 ? 30 : 5;
          setTimeout(() => {
            resolve({
              success: true,
              data: {
                ...mockUserStatusResponse,
                wallet: { ...mockUserStatusResponse.wallet, principalBalance: callNum * 1000 }
              }
            });
          }, delay);
        });
      });

      const p1 = service.loadUserStatus();
      await new Promise(r => setTimeout(r, 5));
      const p2 = service.loadUserStatus();

      await Promise.all([p1, p2]);

      expect(service.userStatus()?.wallet?.principalBalance).toBeDefined();
    });
  });

  // ============================================
  // REFRESH REASON - NEW FEATURE (for post-fix)
  // ============================================
  describe('refreshReason tracking', () => {
    it('should accept periodic refresh reason', async () => {
      await service.loadUserStatus(0, 'periodic');

      expect(mockGetUserStatus).toHaveBeenCalled();
      expect((service as any).lastRefreshReason).toBe('periodic');
    });

    it('should accept manual refresh reason', async () => {
      await service.loadUserStatus(0, 'manual');

      expect(mockGetUserStatus).toHaveBeenCalled();
      expect((service as any).lastRefreshReason).toBe('manual');
    });

    it('should accept auth-restore refresh reason', async () => {
      await service.loadUserStatus(0, 'auth-restore');

      expect(mockGetUserStatus).toHaveBeenCalled();
      expect((service as any).lastRefreshReason).toBe('auth-restore');
    });
  });
});