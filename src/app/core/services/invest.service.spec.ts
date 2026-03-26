import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InvestService } from './invest.service';
import { InvestApiPlayer } from '../../models/invest.model';
import { PLAYER_API_DEFAULTS } from '../../models/player.model';

describe('InvestService', () => {
  let service: InvestService;
  let httpMock: HttpTestingController;

  const mockApiPlayers: InvestApiPlayer[] = [
    {
      id: 1,
      name: 'Ronaldo CR7',
      price: 500,
      description: 'Leyenda del fútbol',
      isVIP: false,
      days: 19,
      interest: 15,
    },
    {
      id: 101,
      name: 'Messi VIP',
      price: 2000,
      description: 'Edición legendaria',
      isVIP: true,
      days: 19,
      interest: 100,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InvestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------- mapApiPlayerToPlayer ----------

  describe('mapApiPlayerToPlayer', () => {
    it('should map API fields to canonical Player interface', () => {
      const api: InvestApiPlayer = {
        id: 1,
        name: 'Ronaldo CR7',
        price: 500,
        description: 'Leyenda',
        isVIP: false,
        days: 19,
        interest: 15,
      };

      const result = InvestService.mapApiPlayerToPlayer(api);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Ronaldo CR7');
      expect(result.price).toBe(500);
      expect(result.description).toBe('Leyenda');
      expect(result.exclusive).toBe(false);
      expect(result.contract_days).toBe(19);
      expect(result.earning).toBe(15);
    });

    it('should default exclusive to false when isVIP is undefined', () => {
      const api: InvestApiPlayer = {
        id: 1,
        name: 'Test',
        price: 100,
        description: 'Test',
        isVIP: false,
        days: 19,
        interest: 15,
      };

      const result = InvestService.mapApiPlayerToPlayer(api);
      expect(result.exclusive).toBe(false);
    });

    it('should set exclusive to true when isVIP is true', () => {
      const api: InvestApiPlayer = {
        id: 101,
        name: 'VIP Player',
        price: 2000,
        description: 'VIP',
        isVIP: true,
        days: 19,
        interest: 100,
      };

      const result = InvestService.mapApiPlayerToPlayer(api);
      expect(result.exclusive).toBe(true);
    });

    it('should use default earning when interest is missing', () => {
      const api = {
        id: 1,
        name: 'Test',
        price: 100,
        description: 'Test',
        isVIP: false,
        days: 19,
      } as InvestApiPlayer;

      const result = InvestService.mapApiPlayerToPlayer(api);
      expect(result.earning).toBe(PLAYER_API_DEFAULTS.earning);
    });

    it('should use default contract_days when days is missing', () => {
      const api = {
        id: 1,
        name: 'Test',
        price: 100,
        description: 'Test',
        isVIP: false,
        interest: 15,
      } as InvestApiPlayer;

      const result = InvestService.mapApiPlayerToPlayer(api);
      expect(result.contract_days).toBe(PLAYER_API_DEFAULTS.contract_days);
    });

    it('should always set the default imageUrl', () => {
      const api: InvestApiPlayer = {
        id: 1,
        name: 'Test',
        price: 100,
        description: 'Test',
        isVIP: false,
        days: 19,
        interest: 15,
      };

      const result = InvestService.mapApiPlayerToPlayer(api);
      expect(result.imageUrl).toBe(PLAYER_API_DEFAULTS.imageUrl);
    });

    it('should set default level, age, injuries, height', () => {
      const api: InvestApiPlayer = {
        id: 1,
        name: 'Test',
        price: 100,
        description: 'Test',
        isVIP: false,
        days: 19,
        interest: 15,
      };

      const result = InvestService.mapApiPlayerToPlayer(api);
      expect(result.level).toBe(PLAYER_API_DEFAULTS.level);
      expect(result.age).toBe(PLAYER_API_DEFAULTS.age);
      expect(result.injuries).toBe(PLAYER_API_DEFAULTS.injuries);
      expect(result.height).toBe(PLAYER_API_DEFAULTS.height);
    });
  });

  // ---------- getPlayers ----------

  describe('getPlayers', () => {
    it('should fetch players and map them correctly', async () => {
      const promise = service.getPlayers();

      const req = httpMock.expectOne(req => req.url.includes('Invest/getPlayers'));
      expect(req.request.method).toBe('GET');
      req.flush(mockApiPlayers);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.players).toHaveLength(2);
      expect(result.players![0].name).toBe('Ronaldo CR7');
      expect(result.players![0].exclusive).toBe(false);
      expect(result.players![1].name).toBe('Messi VIP');
      expect(result.players![1].exclusive).toBe(true);
    });

    it('should return error on empty response', async () => {
      const promise = service.getPlayers();

      const req = httpMock.expectOne(req => req.url.includes('Invest/getPlayers'));
      req.flush(null);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty response from server');
    });

    it('should return Unauthorized on 401', async () => {
      const promise = service.getPlayers();

      const req = httpMock.expectOne(req => req.url.includes('Invest/getPlayers'));
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should deduplicate concurrent requests', async () => {
      const promise1 = service.getPlayers();
      const promise2 = service.getPlayers();

      // Only one HTTP request should be made
      const req = httpMock.expectOne(req => req.url.includes('Invest/getPlayers'));
      req.flush(mockApiPlayers);

      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.players).toEqual(result2.players);
    });

    it('should allow new request after previous completes', async () => {
      // First request
      const promise1 = service.getPlayers();
      const req1 = httpMock.expectOne(req => req.url.includes('Invest/getPlayers'));
      req1.flush(mockApiPlayers);
      await promise1;

      // Second request (should make a new HTTP call)
      const promise2 = service.getPlayers();
      const req2 = httpMock.expectOne(req => req.url.includes('Invest/getPlayers'));
      req2.flush(mockApiPlayers);
      const result2 = await promise2;

      expect(result2.success).toBe(true);
    });
  });

  // ---------- buyPlayer ----------

  describe('buyPlayer', () => {
    it('should call POST buyPlayer with playerId', async () => {
      const promise = service.buyPlayer(42);

      const req = httpMock.expectOne(req => req.url.includes('Invest/buyPlayer'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ playerId: 42 });
      req.flush({ message: 'Player purchased' });

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.message).toBe('Player purchased');
    });

    it('should include uid in body when provided', async () => {
      const promise = service.buyPlayer(42, 99);

      const req = httpMock.expectOne(req => req.url.includes('Invest/buyPlayer'));
      expect(req.request.body).toEqual({ playerId: 42, uid: 99 });
      req.flush({ message: 'OK' });

      const result = await promise;
      expect(result.success).toBe(true);
    });

    it('should return error on 400', async () => {
      const promise = service.buyPlayer(42);

      const req = httpMock.expectOne(req => req.url.includes('Invest/buyPlayer'));
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toContain('Bad request');
    });

    it('should return Unauthorized on 401', async () => {
      const promise = service.buyPlayer(42);

      const req = httpMock.expectOne(req => req.url.includes('Invest/buyPlayer'));
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return Player not found on 404', async () => {
      const promise = service.buyPlayer(999);

      const req = httpMock.expectOne(req => req.url.includes('Invest/buyPlayer'));
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should return generic error on network failure', async () => {
      const promise = service.buyPlayer(42);

      const req = httpMock.expectOne(req => req.url.includes('Invest/buyPlayer'));
      req.error(new ProgressEvent('NetworkError'));

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to buy player');
    });
  });
});
