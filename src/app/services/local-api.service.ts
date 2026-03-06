import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';

// ============== INTERFACES ==============

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    balance: number;
    totalEarnings: number;
    level: number;
    joinedAt: string;
    status: 'active' | 'inactive' | 'banned';
    avatar?: string;
}

export interface UserStats {
    totalTaps: number;
    hourlyEarning: number;
    referrals: number;
    investments: number;
    achievements: number;
}

export interface EnergyState {
    current: number;
    maximum: number;
    recoveryRate: number; // puntos por segundo
    lastUpdated: string;
}

export interface Boost {
    id: number;
    name: string;
    description: string;
    cost: number;
    baseCost: number;
    level: number;
    amount?: number;
    baseAmount?: number;
    multiplier?: number;
    recoveryMultiplier?: number;
    duration: number | null; // segundos, null = permanente
    type: 'instant' | 'timed' | 'permanent';
    icon?: string;
}

export interface ActiveBoost {
    boostId: number | string;
    activatedAt: string;
    expiresAt: string | null;
}

export interface TapConfig {
    baseValue: number;
    currentMultiplier: number;
    maxMultiplier: number;
    levelBonus: { level: number; multiplier: number }[];
}

export interface EarningSource {
    source: string;
    amount: number;
    percentage: number;
}

export interface Transaction {
    id: number;
    type: 'deposit' | 'withdrawal' | 'earning' | 'boost_purchase' | 'spin_reward' | 'reward';
    amount: number;
    currency: string;
    status: 'completed' | 'pending' | 'failed';
    date: string;
    method?: string;
    reference: string;
    description?: string;
}

export interface DepositMethod {
    id: number;
    title: string;
    desc: string;
    icon: string;
    type: string;
    countries: string[];
    currencies?: string[];
}

export interface CryptoAddress {
    currency: string;
    network?: string;
    address: string;
    qrCode?: string;
}

export interface GameState {
    experience: number;
    experienceToNextLevel: number;
    sessionTaps: number;
    lastSessionStart: string;
    spinsRemaining: number;
    dailySpinsTotal: number;
    lastSpinReset: string;
}

export interface Player {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    description: string;
    earning: number;
    level: number;
    exclusive?: boolean;
    boughtAt?: string;
    contract_days: number;
    /**
     * Additional player details for the player details view:
     * - age: Player's age in years
     * - injuries: Number of current injuries (0 if none)
     * - height: Player's height in centimeters
     * Note: totalGoals is computed as earning * 24 * contract_days (not stored)
     */
    age?: number;
    injuries?: number;
    height?: number;
}

export interface PlayersData {
    availablePlayers: Player[];
    vipPlayers: Player[];
    ownedPlayers: Player[];
}

export interface LocalApiData {
    profile: UserProfile;
    stats: UserStats;
    energy: EnergyState;
    boosts: Boost[];
    activeBoosts: ActiveBoost[];
    tapConfig: TapConfig;
    perHourEarnings: EarningSource[];
    transactions: Transaction[];
    depositMethods: DepositMethod[];
    gameState: GameState;
    players: PlayersData;
}

// ============== STORAGE KEYS ==============

const STORAGE_KEYS = {
    PROFILE: 'nequi_profile',
    STATS: 'nequi_stats',
    ENERGY: 'nequi_energy',
    BOOSTS: 'nequi_boosts',
    ACTIVE_BOOSTS: 'nequi_active_boosts',
    TAP_CONFIG: 'nequi_tap_config',
    PER_HOUR_EARNINGS: 'nequi_per_hour_earnings',
    TRANSACTIONS: 'nequi_transactions',
    DEPOSIT_METHODS: 'nequi_deposit_methods',
    GAME_STATE: 'nequi_game_state',
    PLAYERS: 'nequi_players',
    INITIALIZED: 'nequi_initialized',
} as const;

// ============== DEFAULT DATA ==============

const DEFAULT_PROFILE: UserProfile = {
    id: 1,
    username: 'Nuevo Jugador',
    email: '',
    balance: 0,
    totalEarnings: 0,
    level: 1,
    joinedAt: new Date().toISOString(),
    status: 'active',
};

const DEFAULT_STATS: UserStats = {
    totalTaps: 0,
    hourlyEarning: 0,
    referrals: 0,
    investments: 0,
    achievements: 0,
};

// Configuración de niveles basados en toques
const LEVEL_THRESHOLDS = [
    { level: 1, tapsRequired: 0 },
    { level: 2, tapsRequired: 120 },
    { level: 3, tapsRequired: 300 },
    { level: 4, tapsRequired: 1100 },
    { level: 5, tapsRequired: 1600 },
    { level: 6, tapsRequired: 2100 },
    { level: 7, tapsRequired: 3200 },
    { level: 8, tapsRequired: 4100 },
];

const DEFAULT_ENERGY: EnergyState = {
    current: 500,
    maximum: 500,
    recoveryRate: 0.000556, // 1 punto cada 30 minutos (1/1800 por segundo)
    lastUpdated: new Date().toISOString(),
};

const DEFAULT_BOOSTS: Boost[] = [
    {
        id: 1,
        name: 'Energy Plus',
        description: '+50 energía instantánea',
        cost: 100,
        baseCost: 100,
        level: 1,
        amount: 50,
        baseAmount: 50,
        duration: null,
        type: 'instant',
        icon: '/energy/thunder.png',
    },
    {
        id: 2,
        name: '2x Multiplier',
        description: 'Ganancias x2 por 60 minutos',
        cost: 500,
        baseCost: 500,
        level: 1,
        multiplier: 2,
        duration: 3600,
        type: 'timed',
        icon: '/icons/fire.png',
    },
    {
        id: 3,
        name: 'Energy Recovery',
        description: 'Recuperación +50% por 30 minutos',
        cost: 300,
        baseCost: 300,
        level: 1,
        recoveryMultiplier: 1.5,
        duration: 1800,
        type: 'timed',
        icon: '/energy/rocket.png',
    },
    {
        id: 4,
        name: 'Max Energy',
        description: '+100 energía máxima permanente',
        cost: 1000,
        baseCost: 1000,
        level: 1,
        amount: 100,
        baseAmount: 100,
        duration: null,
        type: 'permanent',
        icon: '/energy/aumento.png',
    },
    {
        id: 5,
        name: 'Tap Power',
        description: '+1 valor por toque permanente',
        cost: 500,
        baseCost: 500,
        level: 1,
        amount: 1,
        baseAmount: 1,
        duration: null,
        type: 'permanent',
        icon: '/energy/touch.png',
    },
];

const DEFAULT_TAP_CONFIG: TapConfig = {
    baseValue: 1,
    currentMultiplier: 1,
    maxMultiplier: 10,
    levelBonus: [
        { level: 1, multiplier: 1.0 },
        { level: 2, multiplier: 1.2 },
        { level: 3, multiplier: 1.5 },
        { level: 4, multiplier: 2.0 },
        { level: 5, multiplier: 2.5 },
        { level: 6, multiplier: 3.0 },
        { level: 7, multiplier: 3.5 },
        { level: 8, multiplier: 4.0 },
        { level: 9, multiplier: 4.5 },
        { level: 10, multiplier: 5.0 },
    ],
};

const DEFAULT_PER_HOUR_EARNINGS: EarningSource[] = [
    { source: 'Jugadores', amount: 0, percentage: 100 },
];

const CRYPTO_ADDRESSES: CryptoAddress[] = [
    { currency: 'USDT', network: 'TRC-20', address: 'Anwu61627kqjejbqik1872jqnz&1727bwjduuiq1827jwjs', qrCode: 'wallet/cryptos/USDT/trc.PNG' },
    { currency: 'USDT', network: 'BEP-20', address: 'Anwu61627kqjejbqik1872jqnz&1727bwjduuiq1827jwjs', qrCode: 'wallet/cryptos/USDT/bep.PNG' },
    { currency: 'USDT', network: 'ERC-20', address: 'Anwu61627kqjejbqik1872jqnz&1727bwjduuiq1827jwjs', qrCode: 'wallet/cryptos/USDT/erc.PNG' },
    { currency: 'BTC', address: 'Anwu61627kqjejbqik1872jqnz&1727bwjduuiq1827jwjs', qrCode: 'wallet/cryptos/btc-qr.png' },
    { currency: 'TRX', address: 'Anwu61627kqjejbqik1872jqnz&1727bwjduuiq1827jwjs', qrCode: 'wallet/cryptos/trx-qr.png' },
    { currency: 'BNB', address: 'Anwu61627kqjejbqik1872jqnz&1727bwjduuiq1827jwjs', qrCode: 'wallet/cryptos/bnb-qr.png' },
];

const DEFAULT_DEPOSIT_METHODS: DepositMethod[] = [
    {
        id: 1,
        title: 'Colombia',
        desc: 'Transfiere desde tu cuenta de banco.',
        icon: 'wallet/col.webp',
        type: 'bank_transfer',
        countries: ['Colombia'],
    },
    {
        id: 2,
        title: 'Cryptos',
        desc: 'Deposita desde tu wallet.',
        icon: 'wallet/bynance.png',
        type: 'cryptocurrency',
        countries: ['Global'],
        currencies: ['BTC', 'ETH', 'USDT', 'USDC'],
    },
    {
        id: 3,
        title: 'Perú',
        desc: 'Explora otras formas de depósito.',
        icon: 'wallet/peru.png',
        type: 'bank_transfer',
        countries: ['Perú'],
    },
];

const DEFAULT_GAME_STATE: GameState = {
    experience: 0,
    experienceToNextLevel: 100,
    sessionTaps: 0,
    lastSessionStart: new Date().toISOString(),
    spinsRemaining: 3,
    dailySpinsTotal: 3,
    lastSpinReset: new Date().toISOString(),
};

const DEFAULT_PLAYERS: PlayersData = {
    availablePlayers: [
        { id: 1, name: 'Ronaldo CR7', price: 500, imageUrl: 'players/image-removebg-preview.webp', description: 'Leyenda del fútbol', earning: 15, level: 1, contract_days: 19, age: 39, injuries: 0, height: 187 },
        { id: 2, name: 'Messi', price: 600, imageUrl: 'players/image-removebg-preview.webp', description: 'El mejor del mundo', earning: 15, level: 1, contract_days: 19, age: 37, injuries: 0, height: 170 },
        { id: 3, name: 'Neymar Jr', price: 700, imageUrl: 'players/image-removebg-preview.webp', description: 'Magia brasileña', earning: 15, level: 2, contract_days: 19, age: 33, injuries: 1, height: 175 },
        { id: 4, name: 'Mbappé', price: 800, imageUrl: 'players/image-removebg-preview.webp', description: 'Velocidad pura', earning: 15, level: 2, contract_days: 19, age: 25, injuries: 0, height: 178 },
        { id: 5, name: 'Haaland', price: 900, imageUrl: 'players/image-removebg-preview.webp', description: 'Goleador nato', earning: 15, level: 3, contract_days: 19, age: 24, injuries: 0, height: 194 },
        { id: 6, name: 'Vinicius Jr', price: 1000, imageUrl: 'players/image-removebg-preview.webp', description: 'Futuro del fútbol', earning: 15, level: 3, contract_days: 19, age: 23, injuries: 0, height: 176 },
    ],
    vipPlayers: [
        { id: 101, name: 'Messi VIP', price: 2000, imageUrl: 'players/image-removebg-preview.webp', description: 'Edición legendaria', earning: 100, level: 5, exclusive: true, contract_days: 19, age: 37, injuries: 0, height: 170 },
        { id: 102, name: 'CR7 VIP', price: 2500, imageUrl: 'players/image-removebg-preview.webp', description: 'El comandante', earning: 100, level: 5, exclusive: true, contract_days: 19, age: 39, injuries: 0, height: 187 },
        { id: 103, name: 'Mbappé VIP', price: 3000, imageUrl: 'players/image-removebg-preview.webp', description: 'Estrella exclusiva', earning: 100, level: 6, exclusive: true, contract_days: 19, age: 25, injuries: 0, height: 178 },
    ],
    ownedPlayers: [],
};

// ============== SERVICE ==============

@Injectable({
    providedIn: 'root'
})
export class LocalApiService {
    private storage = inject(StorageService);

    // Signals reactivos
    private _profile = signal<UserProfile | null>(null);
    private _stats = signal<UserStats | null>(null);
    private _energy = signal<EnergyState | null>(null);
    private _boosts = signal<Boost[]>([]);
    private _activeBoosts = signal<ActiveBoost[]>([]);
    private _tapConfig = signal<TapConfig | null>(null);
    private _perHourEarnings = signal<EarningSource[]>([]);
    private _transactions = signal<Transaction[]>([]);
    private _depositMethods = signal<DepositMethod[]>([]);
    private _gameState = signal<GameState | null>(null);
    private _players = signal<PlayersData | null>(null);
    private _isLoading = signal(false);
    private _isInitialized = signal(false);
    private _levelUp = signal<{ newLevel: number; oldLevel: number } | null>(null);

    // Signals de solo lectura
    readonly profile = this._profile.asReadonly();
    readonly stats = this._stats.asReadonly();
    readonly energy = this._energy.asReadonly();
    readonly boosts = this._boosts.asReadonly();
    readonly activeBoosts = this._activeBoosts.asReadonly();
    readonly tapConfig = this._tapConfig.asReadonly();
    readonly perHourEarnings = this._perHourEarnings.asReadonly();
    readonly transactions = this._transactions.asReadonly();
    readonly depositMethods = this._depositMethods.asReadonly();
    readonly gameState = this._gameState.asReadonly();
    readonly players = this._players.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();
    readonly isInitialized = this._isInitialized.asReadonly();
    readonly levelUp = this._levelUp.asReadonly();

    // Computed values
    readonly balance = computed(() => this._profile()?.balance ?? 0);
    readonly level = computed(() => this._profile()?.level ?? 1);
    readonly currentEnergy = computed(() => this._energy()?.current ?? 0);
    readonly maxEnergy = computed(() => this._energy()?.maximum ?? 500);
    readonly hourlyEarning = computed(() => this._stats()?.hourlyEarning ?? 20);
    readonly totalEarnings = computed(() => this._profile()?.totalEarnings ?? 0);
    readonly spinsRemaining = computed(() => this._gameState()?.spinsRemaining ?? 0);
    readonly ownedPlayers = computed(() => this._players()?.ownedPlayers ?? []);
    readonly availablePlayers = computed(() => this._players()?.availablePlayers ?? []);
    readonly vipPlayers = computed(() => this._players()?.vipPlayers ?? []);

    readonly tapValue = computed(() => {
        const config = this._tapConfig();
        const level = this._profile()?.level ?? 1;
        if (!config) return 10;

        const levelMultiplier = config.levelBonus.find(b => b.level === level)?.multiplier ?? 1;
        return Math.floor(config.baseValue * config.currentMultiplier * levelMultiplier);
    });

    readonly activeMultiplier = computed(() => {
        const activeBoosts = this._activeBoosts();
        const boosts = this._boosts();
        const now = Date.now();

        let multiplier = 1;
        for (const active of activeBoosts) {
            if (active.expiresAt && new Date(active.expiresAt).getTime() < now) continue;
            const boost = boosts.find(b => b.id === active.boostId);
            if (boost?.multiplier) {
                multiplier *= boost.multiplier;
            }
        }
        return multiplier;
    });

    // ============== INITIALIZATION ==============

    private hourlyEarningsInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Inicializa la API local, cargando datos existentes o creando defaults
     */
    initialize(): void {
        if (!this.storage.isBrowser) return;

        this._isLoading.set(true);

        const isInitialized = this.storage.get<boolean>(STORAGE_KEYS.INITIALIZED);

        if (!isInitialized) {
            this.initializeDefaults();
        }

        this.loadAllData();
        this._isInitialized.set(true);
        this._isLoading.set(false);

        // Iniciar el sistema de ganancias por hora
        this.startHourlyEarningsSystem();
    }

    /**
     * Inicia el sistema que agrega monedas cada hora según la ganancia por hora
     */
    private startHourlyEarningsSystem(): void {
        // Limpiar intervalo anterior si existe
        if (this.hourlyEarningsInterval) {
            clearInterval(this.hourlyEarningsInterval);
        }

        // Aplicar ganancias pendientes desde la última vez
        this.applyPendingHourlyEarnings();

        // Iniciar intervalo cada hora (3600000 ms = 1 hora)
        // Para testing puedes cambiar a 60000 (1 minuto) o 10000 (10 segundos)
        const HOUR_IN_MS = 3600000;
        this.hourlyEarningsInterval = setInterval(() => {
            this.applyHourlyEarnings();
        }, HOUR_IN_MS);
    }

    /**
     * Aplica las ganancias por hora acumuladas desde la última sesión
     */
    private applyPendingHourlyEarnings(): void {
        const profile = this._profile();
        if (!profile) return;

        const lastHourlyUpdate = this.storage.get<string>('nequi_last_hourly_update');
        const now = Date.now();

        if (lastHourlyUpdate) {
            const lastUpdate = new Date(lastHourlyUpdate).getTime();
            const hoursElapsed = Math.floor((now - lastUpdate) / 3600000);

            if (hoursElapsed > 0) {
                const hourlyEarning = this.hourlyEarning();
                const pendingEarnings = hoursElapsed * hourlyEarning;

                if (pendingEarnings > 0) {
                    this.updateBalance(pendingEarnings);
                }
            }
        }

        // Actualizar timestamp
        this.storage.set('nequi_last_hourly_update', new Date().toISOString());
    }

    /**
     * Aplica las ganancias por hora actuales
     */
    private applyHourlyEarnings(): void {
        const hourlyEarning = this.hourlyEarning();

        if (hourlyEarning > 0) {
            this.updateBalance(hourlyEarning);
        }

        // Actualizar timestamp
        this.storage.set('nequi_last_hourly_update', new Date().toISOString());
    }

    private initializeDefaults(): void {
        this.storage.set(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
        this.storage.set(STORAGE_KEYS.STATS, DEFAULT_STATS);
        this.storage.set(STORAGE_KEYS.ENERGY, DEFAULT_ENERGY);
        this.storage.set(STORAGE_KEYS.BOOSTS, DEFAULT_BOOSTS);
        this.storage.set(STORAGE_KEYS.ACTIVE_BOOSTS, []);
        this.storage.set(STORAGE_KEYS.TAP_CONFIG, DEFAULT_TAP_CONFIG);
        this.storage.set(STORAGE_KEYS.PER_HOUR_EARNINGS, DEFAULT_PER_HOUR_EARNINGS);
        this.storage.set(STORAGE_KEYS.TRANSACTIONS, []);
        this.storage.set(STORAGE_KEYS.DEPOSIT_METHODS, DEFAULT_DEPOSIT_METHODS);
        this.storage.set(STORAGE_KEYS.GAME_STATE, DEFAULT_GAME_STATE);
        this.storage.set(STORAGE_KEYS.PLAYERS, DEFAULT_PLAYERS);
        this.storage.set(STORAGE_KEYS.INITIALIZED, true);
    }

    private loadAllData(): void {
        this._profile.set(this.storage.get<UserProfile>(STORAGE_KEYS.PROFILE));
        this._stats.set(this.storage.get<UserStats>(STORAGE_KEYS.STATS));
        this._energy.set(this.storage.get<EnergyState>(STORAGE_KEYS.ENERGY));
        this._boosts.set(this.storage.get<Boost[]>(STORAGE_KEYS.BOOSTS) ?? []);
        this._activeBoosts.set(this.storage.get<ActiveBoost[]>(STORAGE_KEYS.ACTIVE_BOOSTS) ?? []);
        this._tapConfig.set(this.storage.get<TapConfig>(STORAGE_KEYS.TAP_CONFIG));
        this._perHourEarnings.set(this.storage.get<EarningSource[]>(STORAGE_KEYS.PER_HOUR_EARNINGS) ?? []);
        const storedTransactions = this.storage.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS) ?? [];
        const cleanedTransactions = storedTransactions.filter(t => t.type !== 'earning');
        if (cleanedTransactions.length !== storedTransactions.length) {
            this.storage.set(STORAGE_KEYS.TRANSACTIONS, cleanedTransactions);
        }
        this._transactions.set(cleanedTransactions);
        this._depositMethods.set(this.storage.get<DepositMethod[]>(STORAGE_KEYS.DEPOSIT_METHODS) ?? []);
        this._gameState.set(this.storage.get<GameState>(STORAGE_KEYS.GAME_STATE));

        // Cargar y migrar datos de jugadores si es necesario
        this.loadAndMigratePlayers();

        // Limpiar boosts expirados y recuperar energía
        this.cleanExpiredBoosts();
        this.recoverEnergy();

        // Recalcular ganancias por hora basadas en jugadores comprados
        this.recalculateHourlyEarnings();
    }

    private loadAndMigratePlayers(): void {
        const storedPlayers = this.storage.get<any>(STORAGE_KEYS.PLAYERS);

        // Si no hay datos o tienen estructura antigua, usar defaults
        if (!storedPlayers || !storedPlayers.availablePlayers) {
            // Migrar datos antiguos si existen
            if (storedPlayers?.regularPlayers) {
                const migratedPlayers: PlayersData = {
                    availablePlayers: storedPlayers.regularPlayers.map((p: any) => ({
                        ...p,
                        imageUrl: 'players/image-removebg-preview.webp',
                        earning: 15,
                    })),
                    vipPlayers: (storedPlayers.vipPlayers || []).map((p: any) => ({
                        ...p,
                        imageUrl: 'players/image-removebg-preview.webp',
                        earning: 100,
                    })),
                    ownedPlayers: (storedPlayers.myPlayers || []).map((p: any) => ({
                        ...p,
                        imageUrl: 'players/image-removebg-preview.webp',
                    })),
                };
                this.storage.set(STORAGE_KEYS.PLAYERS, migratedPlayers);
                this._players.set(migratedPlayers);
            } else {
                // Usar defaults
                this.storage.set(STORAGE_KEYS.PLAYERS, DEFAULT_PLAYERS);
                this._players.set(DEFAULT_PLAYERS);
            }
        } else {
            this._players.set(storedPlayers as PlayersData);
        }
    }

    /**
     * Resetea todos los datos a los valores por defecto
     */
    resetAllData(): void {
        this.storage.remove(STORAGE_KEYS.INITIALIZED);
        this.initializeDefaults();
        this.loadAllData();
    }

    // ============== PROFILE ==============

    updateProfile(updates: Partial<UserProfile>): boolean {
        const current = this._profile();
        if (!current) return false;

        const updated = { ...current, ...updates };
        const success = this.storage.set(STORAGE_KEYS.PROFILE, updated);
        if (success) {
            this._profile.set(updated);
        }
        return success;
    }

    updateBalance(amount: number): boolean {
        const current = this._profile();
        if (!current) return false;

        return this.updateProfile({
            balance: current.balance + amount,
        });
    }

    setBalance(balance: number): boolean {
        return this.updateProfile({ balance });
    }

    // ============== STATS ==============

    updateStats(updates: Partial<UserStats>): boolean {
        const current = this._stats();
        if (!current) return false;

        const updated = { ...current, ...updates };
        const success = this.storage.set(STORAGE_KEYS.STATS, updated);
        if (success) {
            this._stats.set(updated);
        }
        return success;
    }

    incrementTaps(count: number = 1): void {
        const stats = this._stats();
        const gameState = this._gameState();

        if (stats) {
            const newTotalTaps = stats.totalTaps + count;
            this.updateStats({ totalTaps: newTotalTaps });

            // Recalcular nivel basado en toques
            this.recalculateLevelFromTaps(newTotalTaps);
        }

        if (gameState) {
            this.updateGameState({ sessionTaps: gameState.sessionTaps + count });
        }
    }

    /**
     * Calcula el nivel basado en la cantidad de toques
     */
    private recalculateLevelFromTaps(totalTaps: number): void {
        let newLevel = 1;

        for (const threshold of LEVEL_THRESHOLDS) {
            if (totalTaps >= threshold.tapsRequired) {
                newLevel = threshold.level;
            } else {
                break;
            }
        }

        const currentLevel = this._profile()?.level ?? 1;
        if (newLevel !== currentLevel) {
            this.updateProfile({ level: newLevel });
            this._levelUp.set({ newLevel, oldLevel: currentLevel });
        }
    }

    /**
     * Obtiene información del nivel actual
     */
    getLevelInfo(): { level: number; currentTaps: number; tapsForNextLevel: number; tapsToNextLevel: number; isMaxLevel: boolean } {
        const totalTaps = this._stats()?.totalTaps ?? 0;
        const currentLevel = this._profile()?.level ?? 1;

        const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
        const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);

        const isMaxLevel = !nextThreshold;
        const tapsForNextLevel = nextThreshold?.tapsRequired ?? totalTaps;
        const tapsToNextLevel = isMaxLevel ? 0 : tapsForNextLevel - totalTaps;

        return {
            level: currentLevel,
            currentTaps: totalTaps,
            tapsForNextLevel,
            tapsToNextLevel: Math.max(0, tapsToNextLevel),
            isMaxLevel,
        };
    }

    // ============== ENERGY ==============

    updateEnergy(updates: Partial<EnergyState>): boolean {
        const current = this._energy();
        if (!current) return false;

        const updated = {
            ...current,
            ...updates,
            lastUpdated: new Date().toISOString()
        };
        const success = this.storage.set(STORAGE_KEYS.ENERGY, updated);
        if (success) {
            this._energy.set(updated);
        }
        return success;
    }

    consumeEnergy(amount: number): boolean {
        const current = this._energy();
        if (!current || current.current < amount) return false;

        return this.updateEnergy({
            current: current.current - amount,
        });
    }

    addEnergy(amount: number): boolean {
        const current = this._energy();
        if (!current) return false;

        return this.updateEnergy({
            current: Math.min(current.maximum, current.current + amount),
        });
    }

    increaseMaxEnergy(amount: number): boolean {
        const current = this._energy();
        if (!current) return false;

        return this.updateEnergy({
            maximum: current.maximum + amount,
        });
    }

    /**
     * Regenera energía basada en el tiempo transcurrido
     */
    regenerateEnergy(): void {
        const current = this._energy();
        if (!current) return;

        const now = Date.now();
        const lastUpdated = new Date(current.lastUpdated).getTime();
        const secondsElapsed = Math.floor((now - lastUpdated) / 1000);

        if (secondsElapsed > 0 && current.current < current.maximum) {
            const energyToAdd = secondsElapsed * current.recoveryRate;
            this.addEnergy(energyToAdd);
        }
    }

    // ============== BOOSTS ==============

    purchaseBoost(boostId: number): { success: boolean; message: string } {
        const boosts = this._boosts();
        const boostIndex = boosts.findIndex(b => b.id === boostId);
        const boost = boosts[boostIndex];
        const profile = this._profile();

        if (!boost || boostIndex === -1) {
            return { success: false, message: 'Boost no encontrado' };
        }

        if (!profile || profile.balance < boost.cost) {
            return { success: false, message: `Saldo insuficiente. Necesitas ${boost.cost} monedas` };
        }

        // Descontar el costo
        this.updateBalance(-boost.cost);

        // Aplicar efecto según el tipo
        switch (boost.type) {
            case 'instant':
                if (boost.amount) {
                    this.addEnergy(boost.amount);
                }
                break;

            case 'timed':
                const activeBoost: ActiveBoost = {
                    boostId: boost.id,
                    activatedAt: new Date().toISOString(),
                    expiresAt: boost.duration
                        ? new Date(Date.now() + boost.duration * 1000).toISOString()
                        : null,
                };
                this.addActiveBoost(activeBoost);
                break;

            case 'permanent':
                if (boost.id === 4 && boost.amount) {
                    // Max Energy
                    this.increaseMaxEnergy(boost.amount);
                } else if (boost.id === 5 && boost.amount) {
                    // Tap Power
                    const tapConfig = this._tapConfig();
                    if (tapConfig) {
                        this.updateTapConfig({ baseValue: tapConfig.baseValue + boost.amount });
                    }
                }
                break;
        }

        // Subir de nivel el boost (aumentar precio y recompensa)
        const updatedBoost = this.upgradeBoost(boost);
        const updatedBoosts = [...boosts];
        updatedBoosts[boostIndex] = updatedBoost;
        this.storage.set(STORAGE_KEYS.BOOSTS, updatedBoosts);
        this._boosts.set(updatedBoosts);

        // Registrar transacción
        this.addTransaction({
            type: 'boost_purchase',
            amount: -boost.cost,
            currency: 'coins',
            status: 'completed',
            method: 'internal',
            description: `${boost.name} Lv${boost.level}`,
        });

        return { success: true, message: `¡${boost.name} Lv${boost.level} aplicado! Próximo: Lv${updatedBoost.level}` };
    }

    /**
     * Sube de nivel un boost, aumentando precio y recompensa
     */
    private upgradeBoost(boost: Boost): Boost {
        const newLevel = boost.level + 1;
        const priceMultiplier = 1.5; // El precio sube 50% por nivel

        const newCost = Math.floor(boost.baseCost * Math.pow(priceMultiplier, newLevel - 1));

        let newAmount: number | undefined;
        let newDescription = boost.description;

        if (boost.id === 5) {
            // Tap Power: el amount es igual al nivel (Lv1: +1, Lv2: +2, Lv3: +3)
            newAmount = newLevel;
            newDescription = `+${newAmount} valor por toque permanente`;
        } else if (boost.baseAmount) {
            // Otros boosts: el amount escala con 1.2^nivel
            newAmount = Math.floor(boost.baseAmount * Math.pow(1.2, newLevel - 1));

            if (boost.type === 'instant') {
                newDescription = `+${newAmount} energía instantánea`;
            } else if (boost.type === 'permanent' && boost.id === 4) {
                newDescription = `+${newAmount} energía máxima permanente`;
            }
        }

        return {
            ...boost,
            level: newLevel,
            cost: newCost,
            amount: newAmount,
            description: newDescription,
        };
    }

    private addActiveBoost(boost: ActiveBoost): void {
        const current = this._activeBoosts();
        const updated = [...current, boost];
        this.storage.set(STORAGE_KEYS.ACTIVE_BOOSTS, updated);
        this._activeBoosts.set(updated);
    }

    /**
     * Activa un boost temporal (ej: desde la ruleta)
     */
    activateBoost(boostId: string, multiplier: number, expiresAt: number): void {
        const activeBoost: ActiveBoost = {
            boostId,
            activatedAt: new Date().toISOString(),
            expiresAt: new Date(expiresAt).toISOString(),
        };
        this.addActiveBoost(activeBoost);

        // Si necesitamos guardar info del multiplier temporal
        const tapConfig = this._tapConfig();
        if (tapConfig && multiplier > 1) {
            this.updateTapConfig({ currentMultiplier: multiplier });

            // Restaurar multiplier cuando expire
            const timeUntilExpire = expiresAt - Date.now();
            if (timeUntilExpire > 0) {
                setTimeout(() => {
                    this.updateTapConfig({ currentMultiplier: 1 });
                    this.cleanExpiredBoosts();
                }, timeUntilExpire);
            }
        }
    }

    private cleanExpiredBoosts(): void {
        const now = Date.now();
        const active = this._activeBoosts().filter(b => {
            if (!b.expiresAt) return true;
            return new Date(b.expiresAt).getTime() > now;
        });

        this.storage.set(STORAGE_KEYS.ACTIVE_BOOSTS, active);
        this._activeBoosts.set(active);
    }

    // ============== TAP CONFIG ==============

    updateTapConfig(updates: Partial<TapConfig>): boolean {
        const current = this._tapConfig();
        if (!current) return false;

        const updated = { ...current, ...updates };
        const success = this.storage.set(STORAGE_KEYS.TAP_CONFIG, updated);
        if (success) {
            this._tapConfig.set(updated);
        }
        return success;
    }

    // ============== TRANSACTIONS ==============

    addTransaction(transaction: Omit<Transaction, 'id' | 'date' | 'reference'>): Transaction {
        // Do not persist earnings to keep transaction storage light
        if (transaction.type === 'earning') {
            return {
                ...transaction,
                id: this._transactions().length + 1,
                date: new Date().toISOString(),
                reference: `TXN${Date.now().toString(36).toUpperCase()}`,
            };
        }

        const current = this._transactions();
        const newTransaction: Transaction = {
            ...transaction,
            id: current.length + 1,
            date: new Date().toISOString(),
            reference: `TXN${Date.now().toString(36).toUpperCase()}`,
        };

        const updated = [newTransaction, ...current];
        this.storage.set(STORAGE_KEYS.TRANSACTIONS, updated);
        this._transactions.set(updated);

        return newTransaction;
    }

    getTransactionsByType(type: Transaction['type']): Transaction[] {
        return this._transactions().filter(t => t.type === type);
    }

    // ============== CRYPTO ADDRESSES ==============

    getCryptoAddress(currency: string, network?: string): CryptoAddress | undefined {
        return CRYPTO_ADDRESSES.find(addr =>
            addr.currency === currency &&
            (network ? addr.network === network : true)
        );
    }

    getWithdrawalCryptos(): CryptoAddress[] {
        // For withdrawals: exclude BTC entirely and exclude ERC-20 from USDT
        return CRYPTO_ADDRESSES.filter(addr => {
            if (addr.currency === 'BTC') return false; // Exclude BTC
            if (addr.currency === 'USDT' && addr.network === 'ERC-20') return false; // Exclude USDT ERC-20
            return true;
        });
    }

    // ============== DEPOSITS & WITHDRAWALS ==============

    createDeposit(amount: number, method: string, currency: string = 'COP'): Transaction {
        const transaction = this.addTransaction({
            type: 'deposit',
            amount,
            currency,
            status: 'pending',
            method,
        });

        // Simular completar depósito después de 2 segundos
        setTimeout(() => {
            this.completeDeposit(transaction.id);
        }, 2000);

        return transaction;
    }

    private completeDeposit(transactionId: number): void {
        const transactions = this._transactions();
        const index = transactions.findIndex(t => t.id === transactionId);

        if (index !== -1) {
            const transaction = transactions[index];
            transactions[index] = { ...transaction, status: 'completed' };

            this.storage.set(STORAGE_KEYS.TRANSACTIONS, transactions);
            this._transactions.set([...transactions]);

            // Añadir al balance
            this.updateBalance(transaction.amount);
        }
    }

    createWithdrawal(amount: number, method: string, currency: string = 'COP'): { success: boolean; transaction?: Transaction; message: string } {
        const profile = this._profile();

        if (!profile || profile.balance < amount) {
            return { success: false, message: 'Saldo insuficiente' };
        }

        // Descontar del balance
        this.updateBalance(-amount);

        const transaction = this.addTransaction({
            type: 'withdrawal',
            amount,
            currency,
            status: 'pending',
            method,
        });

        return { success: true, transaction, message: 'Retiro en proceso' };
    }

    // ============== GAME STATE ==============

    updateGameState(updates: Partial<GameState>): boolean {
        const current = this._gameState();
        if (!current) return false;

        const updated = { ...current, ...updates };
        const success = this.storage.set(STORAGE_KEYS.GAME_STATE, updated);
        if (success) {
            this._gameState.set(updated);
        }
        return success;
    }

    useSpin(): boolean {
        const gameState = this._gameState();
        if (!gameState || gameState.spinsRemaining <= 0) return false;

        return this.updateGameState({
            spinsRemaining: gameState.spinsRemaining - 1,
        });
    }

    addSpins(count: number): boolean {
        const gameState = this._gameState();
        if (!gameState) return false;

        return this.updateGameState({
            spinsRemaining: gameState.spinsRemaining + count,
        });
    }

    resetDailySpins(): void {
        const gameState = this._gameState();
        if (!gameState) return;

        const lastReset = new Date(gameState.lastSpinReset);
        const now = new Date();

        // Resetear si ha pasado un día
        if (now.toDateString() !== lastReset.toDateString()) {
            this.updateGameState({
                spinsRemaining: 10,
                lastSpinReset: now.toISOString(),
            });
        }
    }

    addExperience(amount: number): void {
        const gameState = this._gameState();
        const profile = this._profile();
        if (!gameState || !profile) return;

        let newExp = gameState.experience + amount;
        let newLevel = profile.level;
        let expToNext = gameState.experienceToNextLevel;

        // Level up si corresponde
        while (newExp >= expToNext) {
            newExp -= expToNext;
            newLevel++;
            expToNext = Math.floor(expToNext * 1.5); // Cada nivel requiere 50% más XP
        }

        this.updateGameState({
            experience: newExp,
            experienceToNextLevel: expToNext,
        });

        /*
        if (newLevel !== profile.level) {
            this.updateProfile({ level: newLevel });
        }
        */
    }

    // ============== EARNINGS ==============

    addEarnings(amount: number): void {
        this.updateBalance(amount);

        const profile = this._profile();
        if (profile) {
            this.updateProfile({
                totalEarnings: profile.totalEarnings + amount,
            });
        }
    }

    addSpinReward(amount: number): void {
        this.updateBalance(amount);

        const profile = this._profile();
        if (profile) {
            this.updateProfile({
                totalEarnings: profile.totalEarnings + amount,
            });
        }

        this.addTransaction({
            type: 'spin_reward',
            amount,
            currency: 'coins',
            status: 'completed',
            method: 'lucky_wheel',
            description: 'Premio de la ruleta',
        });
    }

    updatePerHourEarnings(earnings: EarningSource[]): boolean {
        const success = this.storage.set(STORAGE_KEYS.PER_HOUR_EARNINGS, earnings);
        if (success) {
            this._perHourEarnings.set(earnings);

            // Actualizar hourlyEarning en stats
            const total = earnings.reduce((sum, e) => sum + e.amount, 0);
            this.updateStats({ hourlyEarning: total });
        }
        return success;
    }

    // ============== ENERGY RECOVERY ==============

    /**
     * Recupera energía basada en el tiempo transcurrido desde la última actualización
     * Rate: 1 punto cada 30 minutos (1800 segundos)
     */
    private recoverEnergy(): void {
        const energy = this._energy();
        if (!energy) return;

        const now = Date.now();
        const lastUpdated = new Date(energy.lastUpdated).getTime();
        const secondsElapsed = (now - lastUpdated) / 1000;

        // 1 punto cada 30 minutos = 1/1800 puntos por segundo
        const recoveryPerSecond = 1 / 1800;
        const recoveredEnergy = Math.floor(secondsElapsed * recoveryPerSecond);

        if (recoveredEnergy > 0) {
            const newEnergy = Math.min(energy.current + recoveredEnergy, energy.maximum);
            this.updateEnergy({
                current: newEnergy,
                lastUpdated: new Date().toISOString(),
            });
        }
    }

    // ============== PLAYERS ==============

    /**
     * Resetea los datos de jugadores a los valores por defecto
     */
    resetPlayers(): void {
        this.storage.set(STORAGE_KEYS.PLAYERS, DEFAULT_PLAYERS);
        this._players.set(DEFAULT_PLAYERS);
    }

    /**
     * Compra un jugador disponible o VIP
     */
    purchasePlayer(playerId: number): { success: boolean; message: string; player?: Player } {
        const profile = this._profile();
        const playersData = this._players();

        if (!profile || !playersData) {
            return { success: false, message: 'Datos no disponibles' };
        }

        // Buscar jugador en disponibles o VIP
        let player = playersData.availablePlayers.find(p => p.id === playerId);
        let isVip = false;

        if (!player) {
            player = playersData.vipPlayers.find(p => p.id === playerId);
            isVip = true;
        }

        if (!player) {
            return { success: false, message: 'Jugador no encontrado' };
        }

        // Verificar si ya lo tiene
        if (playersData.ownedPlayers.some(p => p.id === playerId)) {
            return { success: false, message: 'Ya tienes este jugador' };
        }

        // Verificar balance
        if (profile.balance < player.price) {
            return { success: false, message: `Saldo insuficiente. Necesitas ${player.price} monedas` };
        }

        // Descontar balance
        this.updateBalance(-player.price);

        // Agregar a jugadores comprados con la ganancia correspondiente
        // Comunes: +15/hora, VIP: +100/hora
        const purchasedPlayer: Player = {
            ...player,
            earning: isVip ? 100 : 15,
            exclusive: isVip,
            boughtAt: new Date().toISOString(),
        };

        // Eliminar de la lista de disponibles y agregar a comprados
        const updatedPlayers: PlayersData = {
            availablePlayers: isVip
                ? playersData.availablePlayers
                : playersData.availablePlayers.filter(p => p.id !== playerId),
            vipPlayers: isVip
                ? playersData.vipPlayers.filter(p => p.id !== playerId)
                : playersData.vipPlayers,
            ownedPlayers: [...playersData.ownedPlayers, purchasedPlayer],
        };

        this.storage.set(STORAGE_KEYS.PLAYERS, updatedPlayers);
        this._players.set(updatedPlayers);

        // Actualizar ganancias por hora
        this.recalculateHourlyEarnings();

        // Registrar transacción
        this.addTransaction({
            type: 'boost_purchase',
            amount: -player.price,
            currency: 'coins',
            status: 'completed',
            description: `Compra jugador: ${player.name} (+${purchasedPlayer.earning}/h)`,
        });

        return { success: true, message: `¡${player.name} comprado! +${purchasedPlayer.earning} monedas/hora`, player: purchasedPlayer };
    }

    /**
     * Recalcula las ganancias por hora basándose en los jugadores comprados
     */
    private recalculateHourlyEarnings(): void {
        const playersData = this._players();

        let playersEarning = 0;
        if (playersData) {
            playersEarning = playersData.ownedPlayers.reduce((sum, p) => sum + (p.earning || 0), 0);
        }

        const earnings: EarningSource[] = [
            { source: 'Jugadores', amount: playersEarning, percentage: 100 },
        ];

        this.updatePerHourEarnings(earnings);
    }

    /**
     * Obtiene todos los jugadores disponibles para comprar
     */
    getAvailablePlayersForPurchase(): Player[] {
        const playersData = this._players();
        if (!playersData) return [];

        const ownedIds = new Set(playersData.ownedPlayers.map(p => p.id));

        return [
            ...playersData.availablePlayers.filter(p => !ownedIds.has(p.id)),
            ...playersData.vipPlayers.filter(p => !ownedIds.has(p.id)),
        ];
    }
    clearLevelUp(): void {
        this._levelUp.set(null);
    }
}
