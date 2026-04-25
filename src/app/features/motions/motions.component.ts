import { ChangeDetectionStrategy, Component, Signal, signal, effect, ElementRef, QueryList, AfterViewInit, OnDestroy, Renderer2, inject, viewChild, viewChildren } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgOptimizedImage, DecimalPipe, DatePipe } from '@angular/common';
import { GlassModalComponent, GlassTabBarComponent, GlassTab } from '../../shared/ui';
import { MotionsService, MissionHistoryItem, CompletedMission, BonoDiario } from './motions.service';
import { AudioService } from '../../services/audio.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { Mission } from '../../models/mision.model';

@Component({
  selector: 'app-motions',
  imports: [NgOptimizedImage, DecimalPipe, DatePipe, GlassModalComponent, GlassTabBarComponent],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">
      
      <div class="flex-1 w-full relative z-0 flex flex-col overflow-y-auto no-scrollbar pt-safe-top pb-32 px-5 gap-2 animate-slide-up">
        
        <!-- Hero Section -->
        <div class="flex flex-col items-center md:items-end relative py-0 -mb-1.5">
          <div class="relative w-24 h-32 z-10 group mt-4 mx-auto md:mr-4">
             <!-- Deep Aura Glow -->
            <div class="absolute inset-0 z-0 bg-indigo-500/20 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
             @if (!imageError()) {
                <img ngSrc="motions/main/mociones.webp" alt="Misiones" width="128" height="128" 
                  (error)="imageError.set(true)"
                  (load)="imageError.set(false)"
                  class="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] lg-float">
             } @else {
               <svg class="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] lg-float text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                 <circle cx="12" cy="12" r="9" stroke-opacity="0.3" />
               </svg>
             }
          </div>

        </div>

        <nav #tabsNav class="relative bg-white/5 backdrop-blur-3xl rounded-full p-1.5 flex items-center border border-cyan-500/30 shadow-2xl accent-cyan-bg-alt">
          @if (missionTabKeys.length > 0) {
            <!-- Glass Sliding Indicator Container (only render when tabs exist) -->
            <!-- Pixel-based indicator positioning using offsetLeft/offsetWidth (see design.md) -->
            <div class="absolute inset-1.5 z-0 pointer-events-none">
              <div class="h-full bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-500 cubic-bezier(0.2, 1, 0.3, 1)"
                [style.width.px]="indicatorWidth()"
                [style.transform]="'translateX(' + indicatorX() + 'px)'">
                <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 rounded-full"></div>
              </div>
            </div>
          }

          @for (tab of missionTabKeys; track tab) {
            <!-- Tab button: equal width across all viewports -->
            <button #tabBtn (click)="setActiveTab(tab)"
              class="flex-1 h-11 rounded-full flex items-center justify-center group active:scale-95 transition-all duration-300 relative z-10 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
              [class.brightness-110]="activeTab() === tab"
              [class.drop-shadow-lg]="activeTab() === tab">
              <img [ngSrc]="'social/icons/' + (tab === 'History' ? 'complete.png' : tab === 'Daily' ? 'daily.png' : getTabIcon(tab))" 
                [alt]="tab" width="22" height="22" 
                class="transition-all duration-300 pointer-events-none"
                [class.opacity-30]="activeTab() !== tab"
                [class.opacity-100]="activeTab() === tab"
                [class.scale-110]="activeTab() === tab"
                [class.brightness-125]="activeTab() === tab"
                [class.drop-shadow-lg]="activeTab() === tab">
            </button>
          }
        </nav>

        <main class="flex-1">
          @if (loading()) {
            <div class="flex items-center justify-center h-32">
              <span class="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Cargando misiones...</span>
            </div>
          } @else {
          <div class="bg-white/5 border border-white/5 rounded-[32px] p-1 overflow-hidden backdrop-blur-sm">
            @switch (activeTab()) {
              @case ('Daily') {
                <div class="flex flex-col p-3">
                  @if (dailyRewards(); as bono) {
                    <!-- Bono Diario Card -->
                    <div (click)="claimDailyReward(bono)" 
                      class="group relative overflow-hidden p-4 rounded-[28px] border transition-all duration-500 cursor-pointer active:scale-[0.98]"
                      [class]="bono.state === 'available' 
                        ? 'bg-gradient-to-b from-white/10 to-white/5 border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:-translate-y-1' 
                        : 'bg-white/5 border-white/10 opacity-80'">
                      
                      @if (bono.state === 'available') {
                        <!-- Glow Effect -->
                        <div class="absolute -inset-2 bg-emerald-500/20 blur-xl opacity-40 pointer-events-none"></div>
                        <!-- Sparkles -->
                        <div class="absolute top-1 right-6 w-3 h-3 bg-emerald-400 rounded-full blur-md opacity-60 animate-bounce" style="animation-duration: 2s;"></div>
                        <div class="absolute bottom-2 left-1 w-2 h-2 bg-yellow-400 rounded-full blur-md opacity-60 animate-bounce" style="animation-duration: 3s; animation-delay: 0.5s;"></div>
                      }

                      <!-- Icon -->
                      <div class="relative w-24 h-24 mx-auto mb-2 flex items-center justify-center">
                        <img [ngSrc]="bono.icon" [alt]="bono.title" width="96" height="96" 
                          class="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-500"
                          [class.animate-float]="bono.state === 'available'"
                          [class.group-hover:scale-105]="bono.state === 'available'">
                      </div>

                      <!-- Title -->
                      <div class="text-center mb-1">
                        <span class="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest">Premio Diario</span>
                        <h3 class="text-sm font-black text-white tracking-tight">{{ bono.title }}</h3>
                      </div>

                      <!-- Reward Amount -->
                      <div class="text-center mb-2">
                        <span class="text-xl font-black text-emerald-400 tracking-tight text-glow-emerald">
                          +{{ bono.reward | number }} <span class="text-[10px] text-emerald-500/60">COP</span>
                        </span>
                      </div>

                      <!-- Status Badge / Button -->
                      <div>
                        <button class="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300"
                          [class]="bono.state === 'available' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30' 
                            : 'bg-white/5 text-white/40 border border-white/10'">
                          @if (bono.state === 'available') {
                            <span class="flex items-center justify-center gap-1.5">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ¡Reclamar!
                            </span>
                          } @else {
                            <span class="flex items-center justify-center gap-1.5">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Reclamado
                            </span>
                          }
                        </button>
                      </div>

                      <!-- Claimed Timestamp -->
                      @if (bono.state === 'claimed' && bono.claimedAt) {
                        <div class="text-center mt-1.5">
                          <span class="text-[9px] text-white/30">
                            {{ bono.claimedAt | date:'short' }}
                          </span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
@case ('Whatsapp') {
                <div class="flex flex-col gap-2 p-2">
                  @for (mission of whatsappMissions(); track mission.id) {
                    <article (click)="openMission(mission)"
                      class="lg-module-card group cursor-pointer !p-3 !border-white/10 hover:!border-green-500/30 active:scale-[0.98] transition-all duration-300">
                      <div class="flex items-center gap-3">
                        <!-- Icon -->
                        <div class="relative flex-shrink-0 w-10 h-10">
                          <div class="absolute inset-0 bg-green-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            [class.bg-emerald-500/10]="mission.status === 'completed'"
                            [class.bg-white/5]="mission.status === 'inactive'"></div>
                          <div class="relative z-10 w-full h-full lg-bubble flex items-center justify-center p-2 backdrop-blur-2xl bg-white/[0.05] border border-white/10 group-hover:border-green-500/30 transition-colors"
                            [class.border-emerald-500/30]="mission.status === 'completed'"
                            [class.border-white/5]="mission.status === 'inactive'">
                            <img [ngSrc]="mission.icon" [alt]="mission.title" width="20" height="20" class="object-contain">
                          </div>
                        </div>
                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                          <h3 class="text-xs font-bold text-white tracking-tight truncate">{{ mission.title }}</h3>
                          <div class="flex items-center gap-1 mt-0.5">
                            <span class="text-xs font-black tracking-tight"
                              [class.text-green-400]="mission.status === 'active'"
                              [class.text-emerald-400]="mission.status === 'completed'"
                              [class.text-white/40]="mission.status === 'inactive'"
                              [class.text-glow-emerald]="mission.status === 'completed'">
                              +{{ mission.reward | number }}</span>
                            <span class="text-[8px] font-bold uppercase tracking-wider"
                              [class.text-green-500/40]="mission.status === 'active'"
                              [class.text-emerald-500/40]="mission.status === 'completed'"
                              [class.text-white/30]="mission.status === 'inactive'">COP</span>
                          </div>
                        </div>
                        <!-- Status Indicator -->
                        <div class="flex-shrink-0">
                          @switch (mission.status) {
                            @case ('active') {
                              <div class="text-[9px] font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                                <span class="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>
                                Activa
                              </div>
                            }
                            @case ('completed') {
                              <div class="text-[9px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                Completada
                              </div>
                            }
                            @case ('inactive') {
                              <div class="text-[9px] font-bold px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/10 flex items-center gap-1">
                                <span class="w-1 h-1 rounded-full bg-white/20"></span>
                                Pendiente
                              </div>
                            }
                          }
                        </div>
                      </div>
                    </article>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-12 text-center">
                      <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <svg class="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p class="text-sm font-medium text-white/40">No hay misiones disponibles</p>
                    </div>
                  }
                </div>
              }
              @case ('History') {
                <div class="lg-card-panel p-5 flex flex-col gap-4 mx-4 mt-2">
                  <!-- Section Header -->
                  <div class="flex flex-col gap-2 px-1">
                    <div class="lg-status-badge !py-1 !px-3 !text-[8px] w-fit">
                      <span class="lg-dot-active"></span>
                      PANEL
                    </div>
                    <h2 class="text-xl font-black text-white tracking-tight text-glow uppercase">Historial de Misiones</h2>
                    <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">Resumen de tu actividad y resultados.</p>
                  </div>

                  <!-- Statistics Grid -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="lg-module-card p-3">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Completadas</span>
                      <span class="block text-lg font-black text-white tracking-tighter text-glow mt-1">{{ completedMissions().length }}</span>
                    </div>
                    <div class="lg-module-card p-3 border-emerald-500/30 accent-emerald">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Totales</span>
                      <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ totalMissions() }}</span>
                    </div>
                    <div class="lg-module-card p-3">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Fallidas</span>
                      <span class="block text-lg font-black text-white tracking-tighter text-glow mt-1">{{ failedMissions().length }}</span>
                    </div>
                    <div class="lg-module-card p-3 border-rose-500/30 accent-rose">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Dinero Perdido</span>
                      <span class="block text-lg font-black text-rose-400 tracking-tighter text-glow-rose mt-1">{{ totalLost() | number }} COP</span>
                    </div>
                  </div>

                  <!-- Main Action Area -->
                  <button (click)="openHistoryModal()" class="lg-btn-primary w-full h-12 flex items-center justify-center gap-3 px-4 active:scale-[0.98] transition-all">
                    
                    <span class="text-[12px] font-semibold tracking-wide">Ver historial completo</span>
                  </button>
                </div>
              }
@default {
                <div class="flex flex-col gap-2 p-2">
                  @for (mission of missions(); track mission.id) {
                    <article (click)="openMission(mission)"
                      class="lg-module-card group cursor-pointer !p-3 !border-white/10 hover:!border-cyan-500/30 active:scale-[0.98] transition-all duration-300">
                      <div class="flex items-center gap-3">
                        <!-- Icon -->
                        <div class="relative flex-shrink-0 w-10 h-10">
                          <div class="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            [class.bg-emerald-500/10]="mission.status === 'completed'"
                            [class.bg-white/5]="mission.status === 'inactive'"></div>
                          <div class="relative z-10 w-full h-full lg-bubble flex items-center justify-center p-2 backdrop-blur-2xl bg-white/[0.05] border border-white/10 group-hover:border-cyan-500/30 transition-colors"
                            [class.border-emerald-500/30]="mission.status === 'completed'"
                            [class.border-white/5]="mission.status === 'inactive'">
                            <img [ngSrc]="mission.icon" [alt]="mission.title" width="20" height="20" class="object-contain">
                          </div>
                        </div>
                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                          <h3 class="text-xs font-bold text-white tracking-tight truncate">{{ mission.title }}</h3>
                          <div class="flex items-center gap-1 mt-0.5">
                            <span class="text-xs font-black tracking-tight"
                              [class.text-cyan-400]="mission.status === 'active'"
                              [class.text-emerald-400]="mission.status === 'completed'"
                              [class.text-white/40]="mission.status === 'inactive'"
                              [class.text-glow-emerald]="mission.status === 'completed'">
                              +{{ mission.reward | number }}</span>
                            <span class="text-[8px] font-bold uppercase tracking-wider"
                              [class.text-cyan-500/40]="mission.status === 'active'"
                              [class.text-emerald-500/40]="mission.status === 'completed'"
                              [class.text-white/30]="mission.status === 'inactive'">COP</span>
                          </div>
                        </div>
                        <!-- Status Indicator -->
                        <div class="flex-shrink-0">
                          @switch (mission.status) {
                            @case ('active') {
                              <div class="text-[9px] font-bold px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                                <span class="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></span>
                                Activa
                              </div>
                            }
                            @case ('completed') {
                              <div class="text-[9px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                Completada
                              </div>
                            }
                            @case ('inactive') {
                              <div class="text-[9px] font-bold px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/10 flex items-center gap-1">
                                <span class="w-1 h-1 rounded-full bg-white/20"></span>
                                Pendiente
                              </div>
                            }
                          }
                        </div>
                      </div>
                    </article>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-12 text-center">
                      <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <svg class="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p class="text-sm font-medium text-white/40">No hay misiones disponibles</p>
                    </div>
                  }
                </div>
              }
            }
          </div>
          }
        </main>
      </div>

      <app-glass-modal
        [isOpen]="!!selectedMission()"
        (closed)="closeModal()"
      >
        @if (selectedMission(); as mission) {
          <div class="relative w-full max-w-[320px] flex flex-col p-2 group">
            <!-- Tempered Glass Reflection Layer -->
            <div class="absolute inset-0 pointer-events-none glass-glare opacity-20 z-0 rounded-[2rem]"></div>
            
            <!-- Horizontal Content Row -->
            <div class="flex items-center gap-4 mb-4 z-10">
              <!-- Icon: Official lg-bubble -->
              <div class="relative flex-shrink-0 w-12 h-12">
                 <div class="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"
                   [class.bg-emerald-500/10]="mission.status === 'completed'"
                   [class.bg-white/5]="mission.status === 'inactive'"></div>
                 <div class="relative z-10 w-full h-full lg-bubble flex items-center justify-center p-2 backdrop-blur-3xl bg-white/[0.03]"
                   [class.border-emerald-500/30]="mission.status === 'completed'">
                   <img [ngSrc]="mission.icon" [alt]="mission.title" width="24" height="24" class="object-contain drop-shadow-lg">
                 </div>
              </div>

              <!-- Title Column -->
              <div class="flex flex-col flex-1">
                <div class="flex items-center gap-2 mb-1">
                  @switch (mission.status) {
                    @case ('active') {
                      <span class="text-[8px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">ACTIVA</span>
                    }
                    @case ('completed') {
                      <span class="text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">COMPLETADA</span>
                    }
                    @case ('inactive') {
                      <span class="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/40 border border-white/10">PENDIENTE</span>
                    }
                  }
                </div>
                <h3 class="text-sm font-bold text-white tracking-tight leading-tight">{{ mission.title }}</h3>
                <p class="text-[9px] text-white/40 leading-snug line-clamp-2 mt-0.5">{{ mission.description }}</p>
              </div>

              <!-- Close Button -->
              <button (click)="closeModal()" aria-label="Cerrar misión"
                class="lg-icon-btn w-6 h-6 text-white/40 hover:text-white transition-all active:scale-90 flex-shrink-0 border-white/10">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            
            <!-- Bottom Action Row (Stacked) -->
            <div class="flex flex-col gap-2 z-10 w-full mt-1">
              <!-- Reward Tag (Full Width) -->
              <div class="lg-card-card py-2 px-3 flex items-center justify-center gap-2 border-emerald-500/10 bg-emerald-500/5 backdrop-blur-2xl w-full">
                 <span class="text-[8px] font-bold text-emerald-400/40 uppercase tracking-widest">RECOMPENSA</span>
                 <span class="text-base font-black tracking-tight"
                   [class.text-emerald-400]="mission.status !== 'inactive'"
                   [class.text-white/40]="mission.status === 'inactive'">+{{ mission.reward | number }}</span>
                 <span class="text-[9px] font-bold text-emerald-500/30">COP</span>
              </div>

              <!-- Action Button (Full Width) -->
              @switch (mission.status) {
                @case ('active') {
                  <button disabled class="w-full py-2.5 lg-btn-disabled text-[11px] font-bold tracking-[0.2em] active:scale-[0.97] transition-all flex items-center justify-center gap-2 border-white/10 uppercase opacity-60 cursor-not-allowed">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span>En Progreso</span>
                  </button>
                }
                @case ('completed') {
                  <button disabled class="w-full py-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-[0.2em] active:scale-[0.97] transition-all flex items-center justify-center gap-2 uppercase opacity-80 cursor-not-allowed">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span>Completada</span>
                  </button>
                }
                @case ('inactive') {
                  <button (click)="goToMission()" class="w-full py-2.5 lg-btn-primary text-[11px] font-bold tracking-[0.2em] active:scale-[0.97] transition-all flex items-center justify-center gap-2 border-white/10 uppercase">
                    <span>Ir Ahora</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5"><path d="M14 5l7 7-7 7" /></svg>
                  </button>
                }
              }
            </div>
          </div>
        }
      </app-glass-modal>

      <!-- History Modal -->
      <app-glass-modal
        [isOpen]="showHistoryModal()"
        (closed)="closeHistoryModal()"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        <div class="relative w-full max-w-[320px] flex flex-col p-2 group">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4 z-10">
            <h3 id="history-modal-title" class="text-sm font-bold text-white tracking-tight">Historial Completo de Misiones</h3>
            <button (click)="closeHistoryModal()" aria-label="Cerrar historial de misiones"
              class="lg-icon-btn w-7 h-7 text-white/40 hover:text-white transition-all active:scale-90 flex-shrink-0 border-white/10">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          
          <!-- Tabs -->
          <div class="mb-4">
            <app-glass-tab-bar
              [tabs]="historyTabs"
              [activeTab]="activeHistoryTab()"
              (activeTabChange)="setSelectedHistoryTab($event)"
            />
          </div>

          <!-- Scrollable list -->
          <div class="overflow-y-auto no-scrollbar max-h-[60vh] flex flex-col gap-2">
            @if (filteredHistory().length === 0) {
              <div class="flex flex-col items-center justify-center py-8 text-center">
                <p class="text-sm font-medium text-white/50">
                  @if (activeHistoryTab() === 'completadas') {
                    No hay misiones completadas
                  } @else {
                    No hay misiones fallidas
                  }
                </p>
              </div>
            } @else {
              @for (mission of filteredHistory(); track mission.id) {
                <div class="lg-card-card p-3 flex gap-3 items-start" tabindex="0" role="listitem" [attr.aria-label]="mission.title + (mission.completed ? ' - Completada' : ' - Fallida')">
                  <!-- Icon -->
                  <div class="relative flex-shrink-0 w-10 h-10">
                    <div class="relative z-10 w-full h-full lg-bubble flex items-center justify-center p-2 backdrop-blur-3xl bg-white/[0.03]">
                      <img [ngSrc]="mission.icon" [alt]="mission.title" width="20" height="20" class="object-contain drop-shadow-lg">
                    </div>
                  </div>
                  <!-- Content -->
                  <div class="flex flex-col flex-1 min-w-0">
                    <h4 class="text-xs font-bold text-white tracking-tight truncate">{{ mission.title }}</h4>
                    <p class="text-[10px] text-white/40 leading-snug line-clamp-2 mt-0.5">{{ mission.description }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs font-bold" [class]="mission.completed ? 'text-emerald-400 text-glow-emerald' : 'text-rose-400 text-glow-rose'">
                        {{ mission.completed ? '+' : '-' }}{{ mission.reward | number }} COP
                      </span>
                      <span class="lg-status-badge !py-0.5 !px-2 !text-[8px]" [class]="mission.completed ? 'border-emerald-500/30 accent-emerald' : 'border-rose-500/30 accent-rose'">
                        <span class="lg-dot" [class]="mission.completed ? 'lg-dot-active' : 'lg-dot-error'"></span>
                        {{ mission.completed ? 'Completada' : 'Fallida' }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
       </app-glass-modal>
     </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1.5rem); }
    .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    .animate-slide-down-toast { animation: slideDownToast 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-pulse-subtle { animation: pulseSubtle 3s ease-in-out infinite; }
    .animate-pop-in { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-pulse-fast { animation: pulseFast 1.5s ease-in-out infinite; }

    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideDownToast { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulseSubtle { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.02); opacity: 0.9; } }
    @keyframes popIn { from { transform: scale(0.8) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes pulseFast { 0%, 100% { opacity: 0.3; transform: scale(0.95); } 50% { opacity: 0.7; transform: scale(1.05); } }

    .text-glow-emerald { text-shadow: 0 0 20px rgba(52, 211, 153, 0.3); }
    .text-glow { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .glass-glare { background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%); }
    .glass-glow { box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MotionsComponent implements AfterViewInit, OnDestroy {
  readonly missionTabKeys: string[];
  
  // Signals from service (assigned in constructor)
  readonly activeTab!: Signal<string>;
  readonly activeIndex!: Signal<number>;
  readonly selectedMission!: Signal<Mission | null>;
  readonly showHistoryModal!: Signal<boolean>;
  readonly missions!: Signal<Mission[]>;
  readonly whatsappMissions!: Signal<Mission[]>;
  readonly completedMissions!: Signal<CompletedMission[]>;
  readonly failedMissions!: Signal<CompletedMission[]>;
  readonly totalMissions!: Signal<number>;
  readonly totalLost!: Signal<number>;
  readonly missionHistory!: Signal<CompletedMission[]>;
  // Service-managed tab state (persists while app is open)
  readonly activeHistoryTab!: Signal<string>;
  readonly historyTabs!: GlassTab[];
   readonly filteredHistory!: Signal<MissionHistoryItem[]>;
   readonly dailyRewards!: Signal<BonoDiario>;
   readonly loading!: Signal<boolean>;
  readonly error!: Signal<string | null>;
  readonly imageError = signal(false);
  readonly indicatorWidth = signal(0);
  readonly indicatorX = signal(0);

  private readonly navEl = viewChild.required<ElementRef<HTMLElement>>('tabsNav');
  private readonly buttonRefs = viewChildren<ElementRef<HTMLElement>>('tabBtn');

  private resizeObserver?: ResizeObserver;
  private scrollListener?: () => void;
  private buttonChangesEffect?: import('@angular/core').EffectRef;

   private readonly motionsService = inject(MotionsService);
   private readonly audioService = inject(AudioService);
   
   private readonly errorHandler = inject(ErrorHandlerService);

  constructor() {
    this.missionTabKeys = this.motionsService.getMissionTabKeys();
    this.activeTab = this.motionsService.activeTab$;
    this.activeIndex = this.motionsService.activeIndex;
    this.selectedMission = this.motionsService.selectedMission$;
    this.showHistoryModal = this.motionsService.showHistoryModal$;
    this.missions = this.motionsService.missions$;
    this.whatsappMissions = this.motionsService.whatsappMissions$;
    this.completedMissions = this.motionsService.completedMissions$;
    this.failedMissions = this.motionsService.failedMissions$;
    this.totalMissions = this.motionsService.totalMissions$;
    this.totalLost = this.motionsService.totalLost$;
    this.missionHistory = this.motionsService.missionHistory$;
    this.activeHistoryTab = this.motionsService.activeHistoryTab$;
    this.historyTabs = this.motionsService.historyTabs;
     this.filteredHistory = this.motionsService.filteredHistory$;
     this.dailyRewards = this.motionsService.dailyRewards$;
     this.loading = this.motionsService.loading$;
     this.error = this.motionsService.error$;

      // Effect must be in constructor for valid injection context (NG0203 fix)
      effect(() => {
        const errorMsg = this.error();
        if (errorMsg) {
          this.errorHandler.showToast(errorMsg, 'error');
        }
      });

    // Update indicator position when activeIndex changes
    effect(() => {
      const idx = this.activeIndex();
      // Wait for view init before updating indicator
      if (this.navEl()) {
        this.updateIndicatorPosition();
        this.scrollToActiveTab();
      }
    });

    effect(() => {
      const event = this.motionsService.lastEvent();
      if (!event) return;
      
      switch (event.type) {
        case 'missionClaimed':
          this.audioService.playSuccess();
          break;
        case 'missionFailed':
          this.audioService.playError();
          break;
        case 'dailyRewardCollected':
          this.audioService.playSuccess();
                    break;
      }
    });

    // Observe button changes via signal - must be in constructor for injection context (NG0203)
    this.buttonChangesEffect = effect(() => {
      const buttons = this.buttonRefs();
      const nav = this.navEl();
      if (!nav || !this.resizeObserver) return;
      // Re-observe nav after any disconnect
      this.resizeObserver?.observe(nav.nativeElement);
      // Observe each button for width changes
      buttons.forEach(ref => this.resizeObserver?.observe(ref.nativeElement));
    });
  }

  ngOnInit() {
    const activeTab = this.activeTab();
    const categoryId = this.motionsService.getCategoryId(activeTab);
    this.motionsService.fetchMissions(categoryId);
  }

  ngAfterViewInit() {
    this.setupIndicator();
  }

  ngOnDestroy() {
    this.destroyIndicator();
  }

  private setupIndicator() {
    const nav = this.navEl()?.nativeElement;
    if (!nav) return;

    // Initial position update
    this.updateIndicatorPosition();

    // Listen to scroll events
    this.scrollListener = () => this.updateIndicatorPosition();
    nav.addEventListener('scroll', this.scrollListener, { passive: true });

    // Observe size changes of nav and buttons
    this.resizeObserver = new ResizeObserver(() => this.updateIndicatorPosition());
    this.resizeObserver.observe(nav);

    // Button changes are observed via effect in constructor (injection context)
  }

  private destroyIndicator() {
    const nav = this.navEl()?.nativeElement;
    if (nav && this.scrollListener) {
      nav.removeEventListener('scroll', this.scrollListener);
    }
    this.resizeObserver?.disconnect();
    this.buttonChangesEffect?.destroy();
  }

  // Equal column width calculation for indicator (no offset measurements needed)
  private updateIndicatorPosition() {
    const nav = this.navEl()?.nativeElement;
    const buttons = this.buttonRefs()?.map(ref => ref.nativeElement);
    if (!nav || !buttons || buttons.length === 0) return;

    const activeIdx = this.activeIndex();
    // Equal column width: subtract padding (inset-1.5 * 2 = 12px) from nav width
    const columnWidth = (nav.clientWidth - 12) / buttons.length;
    const width = columnWidth;
    const x = columnWidth * activeIdx;

    this.indicatorWidth.set(width);
    this.indicatorX.set(x);
  }

  // Guarded scroll: no-op when nav has no overflow (tabs fit without scrolling)
  private scrollToActiveTab() {
    const nav = this.navEl()?.nativeElement;
    const buttons = this.buttonRefs()?.map(ref => ref.nativeElement);
    if (!nav || !buttons || buttons.length === 0) return;

    // No-op when no overflow
    if (nav.scrollWidth <= nav.clientWidth) return;

    const activeIdx = this.activeIndex();
    const activeButton = buttons[activeIdx];
    if (!activeButton) return;

    // Center the active tab in the scroll viewport
    const targetScrollLeft = activeButton.offsetLeft - (nav.clientWidth - activeButton.offsetWidth) / 2;
    nav.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
  }

  // Delegated methods to service
  openMission(m: Mission) { this.motionsService.openMission(m); }
  closeModal() { this.motionsService.closeModal(); }
  async goToMission() { await this.motionsService.goToMission(); }
  openHistoryModal() {
    this.motionsService.openHistoryModal();
    this.motionsService.fetchCompletedMissions();
  }
  closeHistoryModal() { this.motionsService.closeHistoryModal(); }
  setActiveTab(tab: string) {
    this.motionsService.setActiveTab(tab);
    const categoryId = this.motionsService.getCategoryId(tab);
    this.motionsService.fetchMissions(categoryId);
    // Load completed missions for History tab statistics
    if (tab === 'History') {
      this.motionsService.fetchCompletedMissions();
    }
  }
  setSelectedHistoryTab(tab: string) {
    this.motionsService.setActiveHistoryTab(tab);
    if (tab === 'completadas') {
      this.motionsService.fetchCompletedMissions();
    }
  }

  getTabIcon(tab: string): string {
    return this.motionsService.getTabIcon(tab);
  }

  async claimDailyReward(bono: BonoDiario) {
    await this.motionsService.claimDailyReward(bono);
  }

  trackByMissionId(index: number, mission: Mission): string {
    return mission.id;
  }


}
