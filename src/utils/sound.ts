import { Platform } from 'react-native';

class BuzzerService {
  private isSoundEnabled: boolean = true;
  private isCurrentlyPlaying: boolean = false;
  private audioCtx: any = null;
  private activeOscillator: any = null;

  constructor() {
    // Initialize Web Audio API if running on Web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      } catch (e) {
        console.warn('Web Audio Context not available:', e);
      }
    }
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  /**
   * Triggers an alert buzzer sound (two distinct urgent beeps)
   */
  public playAlarm(): void {
    if (!this.isSoundEnabled || this.isCurrentlyPlaying) return;

    this.isCurrentlyPlaying = true;

    if (Platform.OS === 'web' && this.audioCtx) {
      try {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        
        // Beep 1
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, now); // A5 note
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // Beep 2
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1046.5, now + 0.3); // C6 note
        gain2.gain.setValueAtTime(0.35, now + 0.3);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now + 0.3);
        osc2.stop(now + 0.6);

        setTimeout(() => {
          this.isCurrentlyPlaying = false;
        }, 700);
      } catch (err) {
        console.warn('Audio playback error:', err);
        this.isCurrentlyPlaying = false;
      }
    } else {
      // Fallback for native or when AudioContext is uninitialized
      setTimeout(() => {
        this.isCurrentlyPlaying = false;
      }, 700);
    }
  }

  /**
   * Stop any active buzzer
   */
  public stop(): void {
    if (this.activeOscillator) {
      try {
        this.activeOscillator.stop();
        this.activeOscillator.disconnect();
      } catch (e) {
        // ignore
      }
      this.activeOscillator = null;
    }
    this.isCurrentlyPlaying = false;
  }
}

export const buzzerService = new BuzzerService();
