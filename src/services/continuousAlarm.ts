import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { triggerLocalBuzzerNotification } from './notifications';

export interface AlarmStatePayload {
  isRinging: boolean;
  alertId: string | null;
  title: string | null;
  loss: number;
  inlet: number;
  outlet: number;
  timestamp: number;
}

type AlarmStateListener = (state: AlarmStatePayload) => void;

class ContinuousAlarmEngine {
  private isRinging: boolean = false;
  private currentAlertId: string | null = null;
  private currentTitle: string | null = null;
  private currentLoss: number = 0;
  private currentInlet: number = 0;
  private currentOutlet: number = 0;
  private currentTimestamp: number = 0;

  private soundInstance: Audio.Sound | null = null;
  private webAudioTimer: any = null;
  private webAudioCtx: any = null;
  private listeners: Set<AlarmStateListener> = new Set();

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) this.webAudioCtx = new AudioCtx();
      } catch (e) {
        console.warn('Web Audio not available:', e);
      }
    }
  }

  public getState(): AlarmStatePayload {
    return {
      isRinging: this.isRinging,
      alertId: this.currentAlertId,
      title: this.currentTitle,
      loss: this.currentLoss,
      inlet: this.currentInlet,
      outlet: this.currentOutlet,
      timestamp: this.currentTimestamp,
    };
  }

  public subscribe(listener: AlarmStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(s);
      } catch (e) {
        // ignore listener errors
      }
    });
  }

  /**
   * Starts non-stop continuous repeating emergency alarm.
   * Prevents duplicate players if already ringing for this alert.
   */
  public async startAlarm(params: {
    alertId: string;
    title?: string;
    loss?: number;
    inlet?: number;
    outlet?: number;
  }): Promise<void> {
    const { alertId, title = 'EMERGENCY LEAKAGE DETECTED', loss = 0, inlet = 0, outlet = 0 } = params;

    if (this.isRinging && this.currentAlertId === alertId) {
      // Already actively ringing for this incident; avoid duplicate audio instances
      return;
    }

    this.isRinging = true;
    this.currentAlertId = alertId;
    this.currentTitle = title;
    this.currentLoss = loss;
    this.currentInlet = inlet;
    this.currentOutlet = outlet;
    this.currentTimestamp = Date.now();
    this.notify();

    // Trigger local push notification banner
    triggerLocalBuzzerNotification(
      `🚨 ${title}`,
      `Critical pipe deficit (+${loss.toFixed(1)} L/min). Continuous alarm active. Tap to open and acknowledge.`,
      { alertId, continuous: true }
    ).catch(console.warn);

    // Start repeating audio
    await this.startAudioLoop();
  }

  private async startAudioLoop(): Promise<void> {
    if (Platform.OS === 'web') {
      this.startWebLoop();
      return;
    }

    // Native Android / iOS continuous playback via expo-av
    try {
      if (this.soundInstance) {
        await this.soundInstance.stopAsync();
        await this.soundInstance.unloadAsync();
        this.soundInstance = null;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/alarm.wav'),
        {
          shouldPlay: true,
          isLooping: true, // NON-STOP CONTINUOUS LOOP
          volume: 1.0,
        }
      );

      this.soundInstance = sound;
      await sound.playAsync();
    } catch (err) {
      console.warn('[AlarmEngine] Error starting native audio loop:', err);
    }
  }

  private startWebLoop(): void {
    if (this.webAudioTimer) clearInterval(this.webAudioTimer);

    const playWebBeepPulse = () => {
      if (!this.webAudioCtx) return;
      try {
        if (this.webAudioCtx.state === 'suspended') {
          this.webAudioCtx.resume();
        }

        const now = this.webAudioCtx.currentTime;
        // Two urgent tones
        const osc1 = this.webAudioCtx.createOscillator();
        const gain1 = this.webAudioCtx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(950, now);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(this.webAudioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.18);

        const osc2 = this.webAudioCtx.createOscillator();
        const gain2 = this.webAudioCtx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1300, now + 0.2);
        gain2.gain.setValueAtTime(0.45, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(this.webAudioCtx.destination);
        osc2.start(now + 0.2);
        osc2.stop(now + 0.45);
      } catch (e) {
        // audio context suspended or blocked until interaction
      }
    };

    // Play immediately, then repeat every 750ms continuously
    playWebBeepPulse();
    this.webAudioTimer = setInterval(playWebBeepPulse, 750);
  }

  /**
   * STOP ALARM: Stops local audio playback on this device immediately.
   * Does NOT alter other users' alarm states.
   */
  public async stopAlarm(): Promise<void> {
    this.isRinging = false;
    this.notify();

    // Clear Web interval
    if (this.webAudioTimer) {
      clearInterval(this.webAudioTimer);
      this.webAudioTimer = null;
    }

    // Stop Native audio
    if (this.soundInstance) {
      try {
        await this.soundInstance.stopAsync();
        await this.soundInstance.unloadAsync();
      } catch (e) {
        // ignore
      }
      this.soundInstance = null;
    }
  }

  /**
   * ACKNOWLEDGE: Stops local audio and saves acknowledgement record.
   */
  public async acknowledgeAlarm(alertId: string, onServerAck?: () => Promise<void>): Promise<void> {
    await this.stopAlarm();
    if (onServerAck) {
      try {
        await onServerAck();
      } catch (err) {
        console.warn('[AlarmEngine] Server ack error:', err);
      }
    }
  }
}

export const continuousAlarmEngine = new ContinuousAlarmEngine();
