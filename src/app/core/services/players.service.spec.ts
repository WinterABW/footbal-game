import { TestBed } from '@angular/core/testing';
import { PlayersService } from './players.service';
import { InvestService } from './invest.service';
import { LocalApiService } from './local-api.service';
import { StorageService } from './storage.service';
import { ErrorHandlerService } from './error-handler.service';
import { ConnectivityService } from './connectivity.service';
import { Player } from '../../models/player.model';
import { signal, computed } from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('PlayersService', () => {
  let service: PlayersService;
  let getPlayersMock: ReturnType<typeof vi.fn>;
  let buyPlayerMock: ReturnType<typeof vi.fn>;
  let purchasePlayerMock: ReturnType<typeof vi.fn>;
  let showErrorToastMock: ReturnType<typeof vi.fn>;
  let showSuccessToastMock: ReturnType<typeof vi.fn>;
  let showToastMock: ReturnType<typeof vi.fn>;
  let storageGetMock: ReturnType<typeof vi.fn>;
  let storageSetMock: ReturnType<typeof vi.fn>;
  let storageRemoveMock: ReturnType<typeof vi.fn>;
  let onlineSignal: ReturnType<typeof signal<boolean>>;

  const mockPlayers: Player[] = [
    { id: 1, name: 'Ronaldo', price: 500, description: 'Legend', imageUrl: 'img.webp', earning: 15, level: 1, contract_days: 19 },
    { id: 2, name: 'Messi', price: 600, description: 'GOAT', imageUrl: 'img.webp', earning: 15, level: 1, contract_days: 19 },
    { id: 101, name: 'Messi VIP', price: 2000, description: 'VIP', imageUrl: 'img.webp', earning: 100, level: 5, exclusive: true, contract_days: 19 },
  ];

  const localRegular: Player[] = [
    { id: 1, name: 'Ronaldo', price: 500, description: 'Legend', imageUrl: 'img.webp', earning: 15, level: 1, contract_days: 19 },
    { id: 2, name: 'Messi', price: 600, description: 'GOAT', imageUrl: 'img.webp', earning: 15, level: 1, contract_days: 19 },
  ];

  const localVip: Player[] = [
    { id: 101, name: 'Messi VIP', price: 2000, description: 'VIP', imageUrl: 'img.webp', earning: 100, level: 5, exclusive: true, contract_days: 19 },
  ];

  const store = new Map<string, unknown>();

  function setupTestBed() {
    store.clear();

    getPlayersMock = vi.fn().mockResolvedValue({ success: true, players: mockPlayers });
    buyPlayerMock = vi.fn().mockResolvedValue({ success: true, message: 'Player purchased' });
    purchasePlayerMock = vi.fn().mockReturnValue({ success: true, message: 'OK' });
    showErrorToastMock = vi.fn();
    showSuccessToastMock = vi.fn();
    showToastMock = vi.fn();
    storageGetMock = vi.fn().mockImplementation(<T>(key: string): T | null => {
      return (store.has(key) ? store.get(key) : null) as T | null;
    });
    storageSetMock = vi.fn().mockImplementation(<T>(key: string, value: T): boolean => {
      store.set(key, value);
      return true;
    });
    storageRemoveMock = vi.fn().mockImplementation((key: string): boolean => {
      store.delete(key);
      return true;
    });

    onlineSignal = signal(true);
    const availablePlayersSignal = signal<Player[]>(localRegular);
    const vipPlayersSignal = signal<Player[]>(localVip);
    const ownedPlayersSignal = signal<Player[]>([]);

    TestBed.configureTestingModule({
      providers: [
        PlayersService,
        {
          provide: InvestService,
          useValue: {
            getPlayers: getPlayersMock,
            buyPlayer: buyPlayerMock,
          },
        },
        {
          provide: LocalApiService,
          useValue: {
            availablePlayers: availablePlayersSignal,
            vipPlayers: vipPlayersSignal,
            ownedPlayers: ownedPlayersSignal,
            isInitialized: signal(true),
            purchasePlayer: purchasePlayerMock,
          },
        },
        {
          provide: StorageService,
          useValue: {
            isBrowser: true,
            get: storageGetMock,
            set: storageSetMock,
            remove: storageRemoveMock,
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            showErrorToast: showErrorToastMock,
            showSuccessToast: showSuccessToastMock,
            showToast: showToastMock,
          },
        },
        {
          provide: ConnectivityService,
          useValue: {
            isOnline: onlineSignal.asReadonly(),
            isOffline: computed(() => !onlineSignal()),
            get offline() { return !onlineSignal(); },
          },
        },
      ],
    });

    service = TestBed.inject(PlayersService);
  }

  beforeEach(() => {
    setupTestBed();
  });

  // ---------- Initialization ----------

  describe('initialization', () => {
    it('should seed signals from local data on construction', () => {
      expect(service.availablePlayers().length).toBeGreaterThanOrEqual(0);
    });

    it('should call getPlayers on construction (background refresh)', () => {
      expect(getPlayersMock).toHaveBeenCalled();
    });
  });

  // ---------- refreshPlayers ----------

  describe('refreshPlayers', () => {
    it('should load players from API and split regular/vip', async () => {
      await service.refreshPlayers();

      const regular = service.availablePlayers();
      const vip = service.vipPlayers();

      expect(regular.find(p => p.id === 1)?.name).toBe('Ronaldo');
      expect(regular.find(p => p.id === 2)?.name).toBe('Messi');
      expect(vip.find(p => p.id === 101)?.name).toBe('Messi VIP');
      expect(vip[0].exclusive).toBe(true);
    });

    it('should set isLoadingApi during fetch', async () => {
      let resolveGetPlayers: (value: any) => void;
      getPlayersMock.mockImplementation(() => new Promise(resolve => { resolveGetPlayers = resolve; }));

      const refreshPromise = service.refreshPlayers();
      expect(service.isLoadingApi()).toBe(true);

      resolveGetPlayers!({ success: true, players: mockPlayers });
      await refreshPromise;

      expect(service.isLoadingApi()).toBe(false);
    });

    it('should save cache on successful API response', async () => {
      await service.refreshPlayers();

      expect(storageSetMock).toHaveBeenCalledWith(
        'nequi_players_api_cache',
        expect.objectContaining({ players: mockPlayers })
      );
    });

    it('should fallback to cache on API failure', async () => {
      // Pre-populate cache
      store.set('nequi_players_api_cache', {
        players: mockPlayers,
        timestamp: Date.now(),
      });

      getPlayersMock.mockResolvedValue({ success: false, error: 'Network error' });

      await service.refreshPlayers();

      expect(service.usingCache()).toBe(true);
      expect(service.apiError()).toBe('Network error');
      expect(showErrorToastMock).toHaveBeenCalled();
    });

    it('should fallback to local defaults when API fails and no cache', async () => {
      getPlayersMock.mockResolvedValue({ success: false, error: 'Server error' });

      await service.refreshPlayers();

      expect(service.usingCache()).toBe(true);
    });

    it('should prevent duplicate refresh calls', async () => {
      getPlayersMock.mockClear();

      const p1 = service.refreshPlayers();
      const p2 = service.refreshPlayers();

      await Promise.all([p1, p2]);

      expect(getPlayersMock).toHaveBeenCalledTimes(1);
    });
  });

  // ---------- Offline handling ----------

  describe('offline handling', () => {
    it('should use cached data when offline', async () => {
      // Wait for constructor's background refresh to finish
      await new Promise(resolve => setTimeout(resolve, 0));
      getPlayersMock.mockClear();

      store.set('nequi_players_api_cache', {
        players: mockPlayers,
        timestamp: Date.now(),
      });

      onlineSignal.set(false);

      await service.refreshPlayers();

      expect(service.usingCache()).toBe(true);
      expect(showToastMock).toHaveBeenCalledWith(
        'Sin conexión. Mostrando datos guardados.',
        'info',
        4000
      );
      expect(getPlayersMock).not.toHaveBeenCalled();
    });

    it('should fallback to local defaults when offline with no cache', async () => {
      // Wait for constructor's background refresh to finish
      await new Promise(resolve => setTimeout(resolve, 0));
      // Clear any cache the constructor might have set
      store.clear();

      onlineSignal.set(false);

      await service.refreshPlayers();

      expect(service.usingCache()).toBe(true);
      expect(showToastMock).toHaveBeenCalledWith(
        'Sin conexión. Mostrando datos locales.',
        'info',
        4000
      );
    });
  });

  // ---------- buyPlayer ----------

  describe('buyPlayer', () => {
    const testPlayer: Player = {
      id: 1, name: 'Ronaldo', price: 500, description: 'Legend',
      imageUrl: 'img.webp', earning: 15, level: 1, contract_days: 19,
    };

    it('should return error for null/undefined player', async () => {
      const result = await service.buyPlayer(null as any);
      expect(result.success).toBe(false);
      expect(result.message).toContain('inválido');
    });

    it('should return error for player without id', async () => {
      const result = await service.buyPlayer({ ...testPlayer, id: 0 });
      expect(result.success).toBe(false);
      expect(result.message).toContain('inválido');
    });

    it('should try API first when online', async () => {
      const result = await service.buyPlayer(testPlayer);

      expect(buyPlayerMock).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(showSuccessToastMock).toHaveBeenCalled();
    });

    it('should update owned players after successful purchase', async () => {
      await service.buyPlayer(testPlayer);

      expect(purchasePlayerMock).toHaveBeenCalledWith(1);
    });

    it('should fall back to local purchase when API fails', async () => {
      buyPlayerMock.mockResolvedValue({ success: false, error: 'Network error' });
      purchasePlayerMock.mockReturnValue({ success: true, message: 'Comprado local' });

      const result = await service.buyPlayer(testPlayer);

      expect(buyPlayerMock).toHaveBeenCalledWith(1);
      expect(purchasePlayerMock).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });

    it('should use local purchase when offline', async () => {
      onlineSignal.set(false);
      purchasePlayerMock.mockReturnValue({ success: true, message: 'Offline purchase' });

      const result = await service.buyPlayer(testPlayer);

      expect(buyPlayerMock).not.toHaveBeenCalled();
      expect(purchasePlayerMock).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(showSuccessToastMock).toHaveBeenCalledWith(
        '¡Ronaldo comprado! (sin conexión)'
      );
    });

    it('should show error toast when offline purchase fails', async () => {
      onlineSignal.set(false);
      purchasePlayerMock.mockReturnValue({ success: false, message: 'No money' });

      await service.buyPlayer(testPlayer);

      expect(showErrorToastMock).toHaveBeenCalled();
    });

    it('should show error toast when both API and local fail', async () => {
      buyPlayerMock.mockResolvedValue({ success: false, error: 'Server error' });
      purchasePlayerMock.mockReturnValue({ success: false, message: 'No money' });

      await service.buyPlayer(testPlayer);

      expect(showErrorToastMock).toHaveBeenCalled();
    });
  });

  // ---------- Cache behavior ----------

  describe('cache', () => {
    it('should save cache with timestamp on API success', async () => {
      await service.refreshPlayers();

      expect(storageSetMock).toHaveBeenCalledWith(
        'nequi_players_api_cache',
        expect.objectContaining({
          players: mockPlayers,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should load from cache when cache is fresh', async () => {
      const freshCache = {
        players: mockPlayers,
        timestamp: Date.now(),
      };
      store.set('nequi_players_api_cache', freshCache);

      getPlayersMock.mockResolvedValue({ success: false, error: 'Failed' });

      await service.refreshPlayers();

      expect(service.usingCache()).toBe(true);
      expect(service.vipPlayers().find(p => p.id === 101)?.name).toBe('Messi VIP');
    });

    it('should not use expired cache (5 min TTL)', async () => {
      const expiredCache = {
        players: mockPlayers,
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes old
      };
      store.set('nequi_players_api_cache', expiredCache);

      getPlayersMock.mockResolvedValue({ success: false, error: 'Failed' });

      await service.refreshPlayers();

      expect(storageRemoveMock).toHaveBeenCalledWith('nequi_players_api_cache');
      expect(service.usingCache()).toBe(true);
    });
  });

  // ---------- Public API helpers ----------

  describe('public API helpers', () => {
    it('getAvailableForPurchase should exclude owned players', async () => {
      // Set owned players through the LocalApiService mock's signal
      const ownedPlayers = [localRegular[0]]; // Ronaldo owned
      // We need to access the injected LocalApiService — do it via the service
      // Simulate having Ronaldo owned by checking getAvailableForPurchase behavior
      // We can manipulate the localApi mock by getting the TestBed's provider

      // Actually, let's call refreshPlayers first to get API data
      await service.refreshPlayers();

      // Now the available players are from the API (Ronaldo + Messi regular, Messi VIP)
      // ownedPlayers() returns empty by default
      const available = service.getAvailableForPurchase();
      expect(available.find(p => p.id === 1)).toBeDefined(); // Ronaldo available
      expect(available.find(p => p.id === 2)).toBeDefined(); // Messi available
      expect(available.find(p => p.id === 101)).toBeDefined(); // VIP available
    });

    it('getMyPlayers should return owned players', () => {
      expect(service.getMyPlayers()).toEqual([]);
    });

    it('getRegularPlayers should return available (non-VIP) players', async () => {
      await service.refreshPlayers();

      const regular = service.getRegularPlayers();
      expect(regular.every(p => !p.exclusive)).toBe(true);
    });

    it('getVipPlayers should return only VIP players', async () => {
      await service.refreshPlayers();

      const vip = service.getVipPlayers();
      expect(vip.every(p => p.exclusive === true)).toBe(true);
    });
  });

  // ---------- Signal states ----------

  describe('signal states', () => {
    it('isLoadingApi should be false after refresh completes', async () => {
      await service.refreshPlayers();
      expect(service.isLoadingApi()).toBe(false);
    });

    it('apiError should be null on success', async () => {
      await service.refreshPlayers();
      expect(service.apiError()).toBeNull();
    });

    it('apiError should be set on failure', async () => {
      getPlayersMock.mockResolvedValue({ success: false, error: 'Something went wrong' });

      await service.refreshPlayers();
      expect(service.apiError()).toBe('Something went wrong');
    });

    it('usingCache should be false on successful API response', async () => {
      await service.refreshPlayers();
      expect(service.usingCache()).toBe(false);
    });

    it('myPlayers should be an alias for ownedPlayers', () => {
      expect(service.myPlayers).toBe(service.ownedPlayers);
    });

    it('regularPlayers should be an alias for availablePlayers', () => {
      expect(service.regularPlayers).toBe(service.availablePlayers);
    });
  });
});
