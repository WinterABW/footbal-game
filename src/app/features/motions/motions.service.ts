import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BackendMission, Mission } from '../../models/mision.model';

interface DailyReward {
  day: number;
  state: 'claimed' | 'available' | 'upcoming';
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class MotionsService {
  // Mission data
  private readonly missions = signal<Mission[]>([]);
  private readonly loading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  private readonly completedMissions = signal<Mission[]>([]);
  private readonly failedMissions = signal<Mission[]>([]);

  // Daily rewards
  private readonly dailyRewards = signal<DailyReward[]>([
    { day: 1, state: 'claimed', icon: 'motions/daily/reclamed.webp' },
    { day: 2, state: 'claimed', icon: 'motions/daily/reclamed.webp' },
    { day: 3, state: 'available', icon: 'motions/daily/current.webp' },
    { day: 4, state: 'upcoming', icon: 'motions/daily/comingsoon.webp' },
    { day: 5, state: 'upcoming', icon: 'motions/daily/comingsoon.webp' },
    { day: 6, state: 'upcoming', icon: 'motions/daily/comingsoon.webp' },
    { day: 7, state: 'upcoming', icon: 'motions/daily/comingsoon.webp' },
  ]);

  // UI state
  private readonly missionTabKeys = ['Daily', 'Whatsapp', 'Facebook', 'Tiktok', 'Telegram', 'Youtube', 'History'];
  private readonly activeTab = signal<string>('Daily');
  private readonly selectedMission = signal<Mission | null>(null);
  private readonly showHistoryModal = signal<boolean>(false);
  private readonly toastData = signal<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Computed signals
  readonly activeIndex = computed(() => this.missionTabKeys.indexOf(this.activeTab()));
  readonly missions$ = this.missions.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();
  readonly whatsappMissions$ = computed(() => this.missions().filter(m => m.category === 'whatsapp'));
  readonly completedMissions$ = computed(() => this.missions().filter(m => m.completed));
  readonly failedMissions$ = computed(() => this.missions().filter(m => !m.completed));
  readonly dailyRewards$ = this.dailyRewards.asReadonly();
  readonly activeTab$ = this.activeTab.asReadonly();
  readonly selectedMission$ = this.selectedMission.asReadonly();
  readonly showHistoryModal$ = this.showHistoryModal.asReadonly();
  readonly toastData$ = this.toastData.asReadonly();

  // Backend integration
  private readonly httpClient = inject(HttpClient);

  async fetchMissions(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.httpClient.get<BackendMission[]>(
          'https://webdevelopment.neti.es/Misions/GetMisionsInfo'
        )
      );
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format');
      }
      const missions = response.map(b => this.mapBackendMissionToMission(b));
      this.missions.set(missions);
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

  private getIconForCategory(category: string | number | null): string {
    const icons: Record<string, string> = {
      whatsapp: 'social/icons/Whatsapp_37229.png',
      facebook: 'social/icons/facebook_icon-icons.com_53612.png',
      tiktok: 'social/icons/tiktok_logo_icon_189233.png',
      telegram: 'social/icons/telegram_icon-icons.com_72055.png',
      youtube: 'social/icons/YouTube_23392.png',
      daily: 'social/icons/Whatsapp_37229.png',
      referral: 'social/icons/Whatsapp_37229.png'
    };
    // Map numeric categories to social icons
    const numericIcons: Record<number, string> = {
      1: 'social/icons/Whatsapp_37229.png',
      2: 'social/icons/facebook_icon-icons.com_53612.png',
      3: 'social/icons/tiktok_logo_icon_189233.png',
      4: 'social/icons/Whatsapp_37229.png',
      5: 'social/icons/Whatsapp_37229.png',
      6: 'social/icons/telegram_icon-icons.com_72055.png',
      7: 'social/icons/YouTube_23392.png'
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
        1: 'whatsapp',
        2: 'facebook',
        3: 'tiktok',
        4: 'daily',
        5: 'referral',
        6: 'telegram',
        7: 'youtube'
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
  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  setSelectedMission(mission: Mission | null) {
    this.selectedMission.set(mission);
  }

  setShowHistoryModal(show: boolean) {
    this.showHistoryModal.set(show);
  }

  openMission(mission: Mission) {
    this.selectedMission.set(mission);
  }

  closeModal() {
    this.selectedMission.set(null);
  }

  goToMission() {
    const m = this.selectedMission();
    if (m) {
      this.closeModal();
      // TODO: Implement actual navigation to mission
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
      Tiktok: 'tiktok_logo_icon_189233.png',
      Telegram: 'telegram_icon-icons.com_72055.png',
      Youtube: 'YouTube_23392.png'
    };
    return icons[tab] || '';
  }

  claimDailyReward(reward: DailyReward) {
    if (reward.state === 'upcoming') {
      this.playErrorSound();
      this.showToast('¡Aún no! Esta recompensa estará disponible pronto.', 'error');
    } else if (reward.state === 'claimed') {
      this.playErrorSound();
      this.showToast('¡Ya reclamaste este premio! Vuelve mañana.', 'error');
    } else if (reward.state === 'available') {
      this.triggerConfetti();
      this.playClaimSound();
      this.dailyRewards.update(rewards => rewards.map(r =>
        r.day === reward.day ? { ...r, state: 'claimed', icon: 'motions/daily/reclamed.webp' } : r
      ));
      this.showToast(`¡Genial! Has reclamado tu recompensa del Día ${reward.day}.`, 'success');
    }
  }

  // Sound effects (these might be better kept in component, but including for completeness)
  private playClaimSound() {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const playNote = (freq: number, startTime: number, type: OscillatorType = 'sine', duration: number = 0.5) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Magical chime chord (C Maj 7 Arpeggio)
    playNote(523.25, now, 'sine', 0.6);       // C5
    playNote(659.25, now + 0.1, 'sine', 0.6); // E5
    playNote(783.99, now + 0.2, 'sine', 0.6); // G5
    playNote(987.77, now + 0.3, 'sine', 0.6); // B5
    playNote(1046.50, now + 0.4, 'triangle', 0.8); // C6 Sparkle
  }

  private playErrorSound() {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastData.set({ message, type });
    setTimeout(() => this.toastData.set(null), 3000);
  }

  triggerConfetti() {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      // Note: In a real service, we might not want to directly call confetti here
      // This is kept for parity with the original component
      (<any>window).confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981', '#3B82F6']
      });
      (<any>window).confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981', '#3B82F6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
}