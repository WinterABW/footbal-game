import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private readonly _isMuted = signal(false);
  readonly isMuted = this._isMuted.asReadonly();

  private initializeAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }
      this.audioContext = new AudioContextClass();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  playSuccess(): void {
    if (this._isMuted()) return;
    try {
      const ctx = this.initializeAudioContext();
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
    } catch (e) {
      console.warn('Failed to play success sound:', e);
    }
  }

  playError(): void {
    if (this._isMuted()) return;
    try {
      const ctx = this.initializeAudioContext();
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
    } catch (e) {
      console.warn('Failed to play error sound:', e);
    }
  }

  toggleMute(): void {
    this._isMuted.update(muted => !muted);
  }
}