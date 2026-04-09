import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BackendMission, MisionReport, MisionState, VISIBLE_MISSION_STATES, Mission } from '../../models/mision.model';
import { GlassTab } from '../../shared/ui'; // Added this import
import { environment } from '../../../environments/environment';
import { MotionEvent } from './types/motion-event';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

// Default icon for missions when no specific icon is available
const DEFAULT_MISSION_ICON = 'social/icons/Whatsapp_37229.png';

// Backend sends numeric IDs, frontend uses string IDs for Mission.
// This helper centralizes the conversion to prevent type drift.
function toMissionId(n: number): string {
  return String(n);
}

// Normalize category from backend (string | number | null) to frontend string | null.
function normalizeCategory(cat: string | number | null | undefined): string | null {
  if (cat === null || cat === undefined) return null;
  return typeof cat === 'number' ? String(cat) : cat;
}

// Domain model for a completed mission record (parsed from backend MisionReport)
export interface CompletedMission {
  id: string;
  userId: number;
  misionsId: number;
  state: MisionState | null;
  created: Date;
  // Fields from MisionReport.mision — preserved as historical snapshot
  misionName?: string | null;
  misionDescription?: string | null;
  misionReward?: number | null;
  misionIcon?: string | null;
  misionCategory?: string | number | null;
}

// Display model for mission history items (joins backend records with mission details)
export interface MissionHistoryItem {
  id: string;         // record id from backend
  title: string;
  description: string;
  reward: number;
  icon: string;
  completed: boolean; // derived from state
  category: string | null;
  created: Date;
}



interface DailyReward {
  day: number;
  state: 'claimed' | 'available' | 'upcoming';
  icon: string;
  reward: number;
  title: string;
}

@Injectable({
  providedIn: 'root'
})
export class MotionsService {
  // Mission data
  private readonly missions = signal<Mission[]>([]);
  private readonly loading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  private readonly completedMissionRecords = signal<CompletedMission[]>([]);
  private readonly loadingCompletedMissions = signal<boolean>(false);

  // Daily reward states (mutable)
  private readonly dailyRewardStates = signal<('claimed' | 'available' | 'upcoming')[]>([
    'claimed', 'claimed', 'available', 'upcoming', 'upcoming', 'upcoming', 'upcoming',
  ]);

  // Daily reward amount from backend (Category 4)
  private readonly dailyRewardAmount = signal<number>(0);
  private readonly dailyRewardTitle = signal<string>('Premio diario');

  // Daily rewards — combines mutable states with backend reward data
  private readonly dailyRewards = computed<DailyReward[]>(() => {
    const states = this.dailyRewardStates();
    const reward = this.dailyRewardAmount();
    const title = this.dailyRewardTitle();
    return states.map((state, i) => ({
      day: i + 1,
      state,
      icon: state === 'claimed' ? 'motions/daily/reclamed.webp'
        : state === 'available' ? 'motions/daily/current.webp'
        : 'motions/daily/comingsoon.webp',
      reward,
      title,
    }));
  });

  // UI state (matching API categories: 0-whatsapp, 1-facebook, 2-tiktok, 3-youtube, 4-daily, 5-referral)
  private readonly missionTabKeys = ['Whatsapp', 'Facebook', 'TikTok', 'Youtube', 'Daily', 'Referral', 'History'];
   private readonly activeTab = signal<string>('Daily');
   private readonly selectedMission = signal<Mission | null>(null);
   private readonly showHistoryModal = signal<boolean>(false);
   // Session-persistent tab state for mission history modal (resets on app restart)
   private readonly activeHistoryTab = signal<string>('completadas');
  readonly activeHistoryTab$ = this.activeHistoryTab.asReadonly();
  readonly historyTabs: GlassTab[] = [
    { id: 'completadas', label: 'Completadas' },
    { id: 'fallidas', label: 'Fallidas' }
  ];

  // Events for UI effects (component listens via effect)
  private readonly _lastEvent = signal<MotionEvent | null>(null);
  readonly lastEvent = this._lastEvent.asReadonly();

  private emitEvent(e: MotionEvent) {
    this._lastEvent.set(e);
  }

  // Computed signals
  readonly activeIndex = computed(() => this.missionTabKeys.indexOf(this.activeTab()));
  readonly missions$ = this.missions.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();
  readonly whatsappMissions$ = computed(() => this.missions().filter(m => m.category === 'whatsapp'));
  
  // Statistics from completedMissionRecords (GetCompletedMisions endpoint)
  readonly completedMissions$ = computed(() => 
    this.completedMissionRecords().filter(r => r.state === MisionState.Completed)
  );
  readonly failedMissions$ = computed(() => 
    this.completedMissionRecords().filter(r => r.state === MisionState.Failed)
  );
  readonly totalMissions$ = computed(() => {
    const records = this.completedMissionRecords();
    return records.filter(r => r.state === MisionState.Completed || r.state === MisionState.Failed).length;
  });
  readonly totalLost$ = computed(() => {
    const failed = this.failedMissions$();
    return failed.reduce((sum, r) => sum + (Number(r.misionReward) || 0), 0);
  });
  readonly missionHistory$ = computed(() => [...this.completedMissions$(), ...this.failedMissions$()]);
  readonly filteredHistory$ = computed<MissionHistoryItem[]>(() => {
    const tab = this.activeHistoryTab();
    const records = this.completedMissionRecords();
    const missions = this.missions();

    // Build a Map for O(1) lookups instead of O(N*M)
    const missionMap = new Map<string, Mission>();
    for (const m of missions) {
      missionMap.set(m.id, m);
    }

    // Filter by explicit tab values; fallback to all visible states for unknown tabs
    const stateFilter: MisionState | null = tab === 'completadas'
      ? MisionState.Completed
      : tab === 'fallidas'
        ? MisionState.Failed
        : null;

    // When tab is unknown, show all visible mission states instead of silently returning []
    const visibleStates = stateFilter !== null
      ? [stateFilter]
      : VISIBLE_MISSION_STATES;

    return records
      .filter(r => r.state !== null && visibleStates.includes(r.state))
      .map(r => {
        const details = missionMap.get(toMissionId(r.misionsId));
        return {
          id: r.id,
          title: details?.title ?? r.misionName ?? `Misión #${r.misionsId}`,
          description: details?.description ?? r.misionDescription ?? '',
          reward: details?.reward ?? r.misionReward ?? 0,
          icon: details?.icon ?? r.misionIcon ?? DEFAULT_MISSION_ICON,
          completed: r.state === MisionState.Completed,
          category: normalizeCategory(details?.category ?? r.misionCategory),
          created: r.created
        };
      });
  });

  // Side-effect: log data integrity issues (effect is the correct place, not computed)
  private readonly _integrityCheck = effect(() => {
    const records = this.completedMissionRecords();
    const missions = this.missions();
    const missionMap = new Map<string, Mission>();
    for (const m of missions) {
      missionMap.set(m.id, m);
    }

    for (const r of records) {
      if (r.state === null) {
        console.warn(`[MotionsService] Mission record #${r.id} has null state — skipping from history`);
      }
      if (!missionMap.has(toMissionId(r.misionsId))) {
        console.warn(`[MotionsService] No mission details found for misionsId=${r.misionsId} (record #${r.id})`);
      }
    }
  });
   readonly dailyRewards$ = this.dailyRewards;
   readonly activeTab$ = this.activeTab.asReadonly();
   readonly selectedMission$ = this.selectedMission.asReadonly();
   readonly showHistoryModal$ = this.showHistoryModal.asReadonly();
   readonly completedMissionRecords$ = this.completedMissionRecords.asReadonly();
   readonly loadingCompletedMissions$ = this.loadingCompletedMissions.asReadonly();

   // Backend integration & services
   private readonly httpClient = inject(HttpClient);
   private readonly errorHandler = inject(ErrorHandlerService);

  async fetchMissions(categoryId?: number | null): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      let params = new HttpParams();
      if (categoryId !== null && categoryId !== undefined && categoryId !== 6) {
        params = params.set('Category', categoryId.toString());
      }
      const response = await firstValueFrom(
        this.httpClient.get<BackendMission[]>(
          `${environment.apiBaseUrl}Misions/GetMisionsInfo`,
          { params }
        )
      );
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format');
      }
      const missions = response.map(b => this.mapBackendMissionToMission(b));
      this.missions.set(missions);

      // If fetching daily missions (category 4), update daily reward config
      if (categoryId === 4 && missions.length > 0) {
        this.dailyRewardAmount.set(missions[0].reward);
        this.dailyRewardTitle.set(missions[0].title);
      }
    } catch (err) {
      console.error('Failed to fetch missions:', err);
      if (err instanceof HttpErrorResponse) {
        if (err.status >= 500) {
          this.error.set('Servidor no disponible. Intenta más tarde.');
        } else {
          this.error.set('Error al cargar misiones. Intenta de nuevo.');
        }
      } else {
        this.error.set('Error al cargar misiones. Intenta de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async fetchCompletedMissions(): Promise<void> {
    this.loadingCompletedMissions.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.httpClient.get<MisionReport[]>(
          `${environment.apiBaseUrl}Misions/GetCompletedMisions`
        )
      );
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format');
      }
      const completedMissions = response.map(b => this.mapCompletedMissionRecord(b));
      this.completedMissionRecords.set(completedMissions);
    } catch (err) {
      console.error('Failed to fetch completed missions:', err);
      if (err instanceof HttpErrorResponse) {
        if (err.status === 400) {
          this.error.set('Solicitud incorrecta. Verifica los datos.');
          this.errorHandler.showToast('Error: Solicitud incorrecta.', 'error');
        } else if (err.status === 401) {
          this.error.set('No autorizado. Inicia sesión nuevamente.');
          this.errorHandler.showToast('Error: No autorizado.', 'error');
        } else if (err.status >= 500) {
          this.error.set('Servidor no disponible. Intenta más tarde.');
          this.errorHandler.showToast('Error del servidor. Intenta más tarde.', 'error');
        } else {
          this.error.set('Error al cargar misiones completadas. Intenta de nuevo.');
          this.errorHandler.showToast('Error al cargar misiones completadas.', 'error');
        }
      } else {
        this.error.set('Error al cargar misiones completadas. Intenta de nuevo.');
        this.errorHandler.showToast('Error al cargar misiones completadas.', 'error');
      }
    } finally {
      this.loadingCompletedMissions.set(false);
    }
  }

  private mapBackendMissionToMission(b: BackendMission): Mission {
    const categoryStr = this.mapCategoryToString(b.category);
    return {
      id: String(b.id),
      title: b.misionInfo,
      description: b.misionInfo,
      reward: b.misionReward,
      currency: 'COP',
      icon: this.getIconForCategory(b.category),
      completed: false,
      category: categoryStr
    };
  }

  private mapCompletedMissionRecord(b: MisionReport): CompletedMission {
    const m = b.mision;
    return {
      id: toMissionId(b.id),
      userId: b.userId,
      misionsId: b.misionsId,
      state: b.state,
      misionName: m?.name ?? null,
      misionDescription: m?.description ?? null,
      misionReward: m?.reward ?? null,
      misionIcon: m?.icon ?? null,
      misionCategory: m?.category ?? null,
      created: new Date(b.created)
    };
  }

  private getIconForCategory(category: string | number | null): string {
    const icons: Record<string, string> = {
      whatsapp: 'social/icons/Whatsapp_37229.png',
      facebook: 'social/icons/facebook_icon-icons.com_53612.png',
      tiktok: 'social/icons/tiktok_logo_icon_189233.png',
      youtube: 'social/icons/YouTube_23392.png',
      daily: 'social/icons/daily.png',
      referral: 'social/icons/referral.png'
    };
    // Map numeric categories to social icons (0-whatsapp, 1-facebook, 2-tiktok, 3-youtube, 4-daily, 5-referral)
    const numericIcons: Record<number, string> = {
      0: 'social/icons/Whatsapp_37229.png',
      1: 'social/icons/facebook_icon-icons.com_53612.png',
      2: 'social/icons/tiktok_logo_icon_189233.png',
      3: 'social/icons/YouTube_23392.png',
      4: 'social/icons/daily.png',
      5: 'social/icons/referral.png'
    };
    
    if (category === null) return 'social/icons/Whatsapp_37229.png';
    if (typeof category === 'number') {
      return numericIcons[category] || 'social/icons/Whatsapp_37229.png';
    }
    const catLower = category.toLowerCase();
    return icons[catLower] || 'social/icons/Whatsapp_37229.png';
  }

  private mapCategoryToString(category: string | number | null): string {
    if (category === null) return '';
    if (typeof category === 'number') {
      const mapping: Record<number, string> = {
        0: 'whatsapp',
        1: 'facebook',
        2: 'tiktok',
        3: 'youtube',
        4: 'daily',
        5: 'referral'
      };
      return mapping[category] || `category_${category}`;
    }
    // If already a string, return as is (lowercase)
    return category.toLowerCase();
  }

  // Getters for non-signal data
  getMissionTabKeys() {
    return this.missionTabKeys;
  }

  // Methods to update state
  setActiveTab(tab: string): number {
    this.activeTab.set(tab);
    return this.missionTabKeys.indexOf(tab);
  }

  setSelectedMission(mission: Mission | null) {
    this.selectedMission.set(mission);
  }

  setShowHistoryModal(show: boolean) {
    this.showHistoryModal.set(show);
  }

  setActiveHistoryTab(tab: string) {
    this.activeHistoryTab.set(tab);
  }

  openMission(mission: Mission) {
    this.selectedMission.set(mission);
  }

  closeModal() {
    this.selectedMission.set(null);
  }

  async goToMission() {
    const m = this.selectedMission();
    if (m) {
      this.closeModal();
      await this.claimMission(Number(m.id));
    }
  }

  openHistoryModal() {
    this.showHistoryModal.set(true);
  }

  closeHistoryModal() {
    this.showHistoryModal.set(false);
  }

  getTabIcon(tab: string): string {
    const icons: Record<string, string> = {
      Whatsapp: 'Whatsapp_37229.png',
      Facebook: 'facebook_icon-icons.com_53612.png',
      TikTok: 'tiktok_logo_icon_189233.png',
      Youtube: 'YouTube_23392.png',
      Daily: 'daily.png',
      Referral: 'referral.png'
    };
    return icons[tab] || '';
  }

  async claimDailyReward(reward: DailyReward): Promise<void> {
    if (reward.state === 'upcoming') {
      this.emitEvent({ type: 'missionFailed', error: 'Reward not available yet' });
      this.errorHandler.showToast('¡Aún no! Esta recompensa estará disponible pronto.', 'error');
      return;
    }
    if (reward.state === 'claimed') {
      this.emitEvent({ type: 'missionFailed', error: 'Reward already claimed' });
      this.errorHandler.showToast('¡Ya reclamaste este premio! Vuelve mañana.', 'error');
      return;
    }

    // Call backend to claim daily reward
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.errorHandler.showToast('No autorizado. Inicia sesión nuevamente.', 'error');
      return;
    }

    try {
      await firstValueFrom(
        this.httpClient.post(
          `${environment.apiBaseUrl}Misions/DailyMisionClaim`,
          {
            timestamp: Date.now(),
            token,
          }
        )
      );

      // Update local state on success
      this.emitEvent({ type: 'dailyRewardCollected', amount: reward.reward });
      this.dailyRewardStates.update(states =>
        states.map((s, i) => i === reward.day - 1 ? 'claimed' : s)
      );
      this.errorHandler.showToast(`¡Genial! Has reclamado tu recompensa del Día ${reward.day}: +${reward.reward} COP`, 'success');
    } catch (err) {
      console.error('Failed to claim daily reward:', err);
      this.errorHandler.showToast('Error al reclamar la recompensa diaria. Intenta de nuevo.', 'error');
    }
  }

  // Claim a mission via backend
  async claimMission(missionId: number): Promise<void> {
    const missions = this.missions();
    const mission = missions.find(m => m.id === String(missionId));
    if (!mission) {
      this.emitEvent({ type: 'missionFailed', missionId, error: 'Mission not found' });
      this.errorHandler.showToast('Misión no encontrada.', 'error');
      return;
    }
    if (mission.completed) {
      this.emitEvent({ type: 'missionFailed', missionId, error: 'Mission already completed' });
      this.errorHandler.showToast('Esta misión ya fue completada.', 'error');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.errorHandler.showToast('No autorizado. Inicia sesión nuevamente.', 'error');
      return;
    }

    try {
      await firstValueFrom(
        this.httpClient.post(
          `${environment.apiBaseUrl}Misions/ActivateMision`,
          {
            misionId: missionId,
            timestamp: Date.now(),
            token,
          }
        )
      );

      // Mark mission as completed on success
      this.missions.update(list => list.map(m =>
        m.id === String(missionId) ? { ...m, completed: true } : m
      ));
      this.emitEvent({ type: 'missionClaimed', missionId, amount: Number(mission.reward) });
      this.errorHandler.showToast(`¡Misión completada! Recompensa: +${mission.reward} COP`, 'success');
    } catch (err) {
      console.error('Failed to activate mission:', err);
      this.errorHandler.showToast('Error al activar la misión. Intenta de nuevo.', 'error');
    }
  }

  // Fail a mission (simulate error)
  failMission(missionId: number, error: string) {
    this.emitEvent({ type: 'missionFailed', missionId, error });
    this.errorHandler.showToast(`Error en misión: ${error}`, 'error');
  }





}