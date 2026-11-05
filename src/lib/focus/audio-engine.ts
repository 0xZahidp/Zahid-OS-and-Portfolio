'use client';

import { FOCUS_SOUNDS, FOCUS_PRESETS } from '@/data/focus-data';

interface SoundVoice {
  slug: string;
  gainNode: GainNode;
  audioElements?: [HTMLAudioElement, HTMLAudioElement];
  activeAudioIdx?: number;
  stopSynth?: () => void;
  isLoading?: boolean;
}

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private voices: Map<string, SoundVoice> = new Map();
  private volumes: Map<string, number> = new Map();
  private noiseBuffers: Map<string, AudioBuffer> = new Map();

  private isMasterPlaying: boolean = false;
  private masterVolume: number = 0.8;
  private listeners: Set<() => void> = new Set();

  private sleepTimerId: ReturnType<typeof setTimeout> | null = null;
  private sleepTimerEndsAt: number | null = null;

  constructor() {
    // Load initial volumes from default or localStorage if in browser
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('focus_sound_volumes');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([slug, vol]) => {
            if (typeof vol === 'number') {
              this.volumes.set(slug, Math.max(0, Math.min(1, vol)));
            }
          });
        }
      } catch {
        // ignore
      }
    }
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'playback' });
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMasterPlaying ? this.masterVolume : 0, this.ctx.currentTime);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -10;
      this.compressor.ratio.value = 3;

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getIsPlaying(): boolean {
    return this.isMasterPlaying;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public getVolume(slug: string): number {
    return this.volumes.get(slug) || 0;
  }

  public getAllVolumes(): Record<string, number> {
    const res: Record<string, number> = {};
    this.volumes.forEach((vol, slug) => {
      if (vol > 0) res[slug] = vol;
    });
    return res;
  }

  public getActiveSoundsCount(): number {
    let count = 0;
    this.volumes.forEach((vol) => {
      if (vol > 0) count++;
    });
    return count;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && this.isMasterPlaying) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, now + 0.05);
    }
    this.notify();
  }

  public togglePlayPause() {
    if (this.isMasterPlaying) {
      this.pause();
    } else {
      // If no sounds are active, activate default preset (Forest walk)
      if (this.getActiveSoundsCount() === 0) {
        this.applyPreset('forest-walk');
      }
      this.play();
    }
  }

  public play() {
    const ctx = this.initContext();
    this.isMasterPlaying = true;
    
    // Ramp up master volume
    const now = ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, now + 0.1);
    }

    // Ensure all active voices are playing
    this.volumes.forEach((vol, slug) => {
      if (vol > 0) {
        this.ensureVoice(slug, vol);
      }
    });

    this.notify();
  }

  public pause() {
    if (!this.ctx || !this.masterGain) {
      this.isMasterPlaying = false;
      this.notify();
      return;
    }

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.15);

    setTimeout(() => {
      // Pause all media elements to save CPU & battery
      this.voices.forEach((v) => {
        if (v.audioElements) {
          v.audioElements.forEach((el) => el.pause());
        }
      });
      this.isMasterPlaying = false;
      this.notify();
    }, 160);
  }

  public setVolume(slug: string, vol: number) {
    const cleanVol = Math.max(0, Math.min(1, vol));
    this.volumes.set(slug, cleanVol);
    this.saveVolumes();

    if (cleanVol > 0) {
      if (!this.isMasterPlaying) {
        this.isMasterPlaying = true;
        const ctx = this.initContext();
        if (this.masterGain) {
          this.masterGain.gain.setValueAtTime(this.masterVolume, ctx.currentTime);
        }
      }
      this.ensureVoice(slug, cleanVol);
    } else {
      const voice = this.voices.get(slug);
      if (voice && this.ctx) {
        const now = this.ctx.currentTime;
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        setTimeout(() => {
          if ((this.volumes.get(slug) || 0) === 0) {
            this.teardownVoice(slug);
          }
        }, 120);
      }
    }

    this.notify();
  }

  public applyPreset(slug: string) {
    const preset = FOCUS_PRESETS.find((p) => p.slug === slug);
    if (!preset) return;

    const ctx = this.initContext();
    const now = ctx.currentTime;

    // Fade out sounds that are not in the preset
    this.volumes.forEach((vol, soundSlug) => {
      if (!preset.layers[soundSlug] && vol > 0) {
        this.volumes.set(soundSlug, 0);
        const voice = this.voices.get(soundSlug);
        if (voice) {
          voice.gainNode.gain.cancelScheduledValues(now);
          voice.gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
          setTimeout(() => {
            if ((this.volumes.get(soundSlug) || 0) === 0) {
              this.teardownVoice(soundSlug);
            }
          }, 450);
        }
      }
    });

    // Fade in or adjust layers in the preset
    Object.entries(preset.layers).forEach(([soundSlug, targetVol]) => {
      this.volumes.set(soundSlug, targetVol);
      this.ensureVoice(soundSlug, targetVol, 0.4);
    });

    this.saveVolumes();

    if (!this.isMasterPlaying) {
      this.isMasterPlaying = true;
      if (this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, now + 0.2);
      }
    }

    this.notify();
  }

  public resetAll() {
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.voices.forEach((v) => {
        v.gainNode.gain.cancelScheduledValues(now);
        v.gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
      });
      setTimeout(() => {
        this.voices.forEach((_, slug) => this.teardownVoice(slug));
      }, 150);
    }
    this.volumes.clear();
    this.saveVolumes();
    this.isMasterPlaying = false;
    this.notify();
  }

  private saveVolumes() {
    if (typeof window !== 'undefined') {
      try {
        const obj: Record<string, number> = {};
        this.volumes.forEach((v, k) => {
          if (v > 0) obj[k] = v;
        });
        localStorage.setItem('focus_sound_volumes', JSON.stringify(obj));
      } catch {
        // ignore
      }
    }
  }

  private ensureVoice(slug: string, targetVol: number, rampDuration = 0.15) {
    const ctx = this.initContext();
    let voice = this.voices.get(slug);

    if (!voice) {
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.connect(this.masterGain!);

      const soundDef = FOCUS_SOUNDS.find((s) => s.slug === slug);
      if (!soundDef) return;

      if (soundDef.kind === 'file') {
        voice = this.setupFileVoice(slug, soundDef.audioUrl || '', gainNode);
      } else if (soundDef.kind === 'noise') {
        voice = this.setupNoiseVoice(slug, gainNode);
      } else if (soundDef.kind === 'binaural') {
        voice = this.setupBinauralVoice(slug, gainNode);
      } else if (soundDef.kind === 'scifi') {
        voice = this.setupScifiVoice(slug, gainNode);
      }

      if (voice) {
        this.voices.set(slug, voice);
      }
    }

    if (voice) {
      const now = ctx.currentTime;
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.linearRampToValueAtTime(targetVol, now + rampDuration);

      if (voice.audioElements) {
        const currentEl = voice.audioElements[voice.activeAudioIdx || 0];
        if (currentEl && currentEl.paused && this.isMasterPlaying) {
          currentEl.play().catch(() => {});
        }
      }
    }
  }

  private teardownVoice(slug: string) {
    const voice = this.voices.get(slug);
    if (!voice) return;

    if (voice.audioElements) {
      voice.audioElements.forEach((el) => {
        el.pause();
        el.src = '';
      });
    }

    if (voice.stopSynth) {
      voice.stopSynth();
    }

    voice.gainNode.disconnect();
    this.voices.delete(slug);
  }

  /**
   * Dual-player crossfade seamless looping for ambient audio files
   */
  private setupFileVoice(slug: string, url: string, gainNode: GainNode): SoundVoice {
    const ctx = this.ctx!;
    const el1 = new Audio(url);
    const el2 = new Audio(url);
    el1.preload = 'auto';
    el2.preload = 'auto';
    el1.crossOrigin = 'anonymous';
    el2.crossOrigin = 'anonymous';

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g1.gain.value = 1;
    g2.gain.value = 0;

    let source1: MediaElementAudioSourceNode;
    let source2: MediaElementAudioSourceNode;

    try {
      source1 = ctx.createMediaElementSource(el1);
      source2 = ctx.createMediaElementSource(el2);
      source1.connect(g1).connect(gainNode);
      source2.connect(g2).connect(gainNode);
    } catch {
      // Fallback if media element source fails (e.g. CORS): standard audio output
      el1.volume = 1;
    }

    const voice: SoundVoice = {
      slug,
      gainNode,
      audioElements: [el1, el2],
      activeAudioIdx: 0,
    };

    // Crossfade loop monitor
    const checkInterval = setInterval(() => {
      const activeIdx = voice.activeAudioIdx || 0;
      const activeEl = voice.audioElements![activeIdx];
      const nextEl = voice.audioElements![1 - activeIdx];

      if (!activeEl || activeEl.paused) return;

      const timeLeft = activeEl.duration - activeEl.currentTime;
      // Start crossfade when 2.5 seconds remaining
      if (timeLeft > 0 && timeLeft < 2.5 && nextEl.paused) {
        nextEl.currentTime = 0;
        nextEl.play().catch(() => {});

        const now = ctx.currentTime;
        const activeGain = activeIdx === 0 ? g1 : g2;
        const nextGain = activeIdx === 0 ? g2 : g1;

        activeGain.gain.cancelScheduledValues(now);
        activeGain.gain.linearRampToValueAtTime(0, now + 2);

        nextGain.gain.cancelScheduledValues(now);
        nextGain.gain.linearRampToValueAtTime(1, now + 2);

        voice.activeAudioIdx = 1 - activeIdx;
      }
    }, 400);

    el1.addEventListener('ended', () => {
      el1.currentTime = 0;
      if (voice.activeAudioIdx === 0) el1.play().catch(() => {});
    });
    el2.addEventListener('ended', () => {
      el2.currentTime = 0;
      if (voice.activeAudioIdx === 1) el2.play().catch(() => {});
    });

    voice.stopSynth = () => {
      clearInterval(checkInterval);
    };

    if (this.isMasterPlaying) {
      el1.play().catch(() => {});
    }

    return voice;
  }

  /**
   * Procedural noise buffers (white, pink, brown)
   */
  private setupNoiseVoice(slug: string, gainNode: GainNode): SoundVoice {
    const ctx = this.ctx!;
    const buffer = this.getOrCreateNoiseBuffer(slug);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start();

    return {
      slug,
      gainNode,
      stopSynth: () => {
        try {
          source.stop();
          source.disconnect();
        } catch {
          // ignore
        }
      },
    };
  }

  private getOrCreateNoiseBuffer(type: string): AudioBuffer {
    if (this.noiseBuffers.has(type)) {
      return this.noiseBuffers.get(type)!;
    }

    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 5; // 5-second seamless loop buffer
    const frameCount = sampleRate * duration;
    const crossfadeFrames = Math.floor(sampleRate * 0.1);
    const buffer = ctx.createBuffer(2, frameCount, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = new Float32Array(frameCount + crossfadeFrames);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let brownVal = 0;

      for (let i = 0; i < channelData.length; i++) {
        const white = Math.random() * 2 - 1;

        if (type === 'white') {
          channelData[i] = white * 0.35;
        } else if (type === 'brown') {
          brownVal = (brownVal + 0.02 * white) / 1.02;
          channelData[i] = brownVal * 3.5;
        } else {
          // Pink noise (Paul Kellet's filtered algorithm)
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          channelData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
      }

      // Loop crossfade
      const output = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        let val = channelData[i];
        if (i < crossfadeFrames) {
          const t = (i / crossfadeFrames) * (Math.PI / 2);
          val = channelData[i] * Math.sin(t) + channelData[frameCount + i] * Math.cos(t);
        }
        output[i] = Math.max(-1, Math.min(1, val));
      }
    }

    this.noiseBuffers.set(type, buffer);
    return buffer;
  }

  /**
   * Binaural beats using left-right oscillator stereo panning
   */
  private setupBinauralVoice(slug: string, gainNode: GainNode): SoundVoice {
    const ctx = this.ctx!;
    const merger = ctx.createChannelMerger(2);

    let baseFreq = 210;
    let beatFreq = 10; // Alpha default

    if (slug === 'beta') {
      baseFreq = 250;
      beatFreq = 18;
    } else if (slug === 'gamma') {
      baseFreq = 200;
      beatFreq = 40;
    }

    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();

    oscLeft.type = 'sine';
    oscRight.type = 'sine';
    oscLeft.frequency.value = baseFreq - beatFreq / 2;
    oscRight.frequency.value = baseFreq + beatFreq / 2;

    oscLeft.connect(merger, 0, 0); // Left channel
    oscRight.connect(merger, 0, 1); // Right channel

    merger.connect(gainNode);

    oscLeft.start();
    oscRight.start();

    return {
      slug,
      gainNode,
      stopSynth: () => {
        try {
          oscLeft.stop();
          oscRight.stop();
          oscLeft.disconnect();
          oscRight.disconnect();
          merger.disconnect();
        } catch {
          // ignore
        }
      },
    };
  }

  /**
   * Procedural Sci-Fi Starship Warp Core Hum
   */
  private setupScifiVoice(slug: string, gainNode: GainNode): SoundVoice {
    const ctx = this.ctx!;
    const oscillators: OscillatorNode[] = [];

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 360;
    lowpass.Q.value = 1.2;
    lowpass.connect(gainNode);

    // Deep detuned drone cluster
    const harmonics = [
      { freq: 55, type: 'sawtooth' as OscillatorType, vol: 0.12 },
      { freq: 55.4, type: 'sawtooth' as OscillatorType, vol: 0.12 },
      { freq: 82.4, type: 'triangle' as OscillatorType, vol: 0.1 },
      { freq: 110.2, type: 'sine' as OscillatorType, vol: 0.08 },
    ];

    harmonics.forEach(({ freq, type, vol }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = vol;
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(g).connect(lowpass);
      osc.start();
      oscillators.push(osc);
    });

    // Sub LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.04;
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain).connect(lowpass.frequency);
    lfo.start();
    oscillators.push(lfo);

    // Warm plasma hiss
    const noiseBuffer = this.getOrCreateNoiseBuffer('pink');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 520;
    bandpass.Q.value = 0.6;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.35;
    noiseSource.connect(bandpass).connect(noiseGain).connect(gainNode);
    noiseSource.start();

    return {
      slug,
      gainNode,
      stopSynth: () => {
        try {
          oscillators.forEach((o) => {
            o.stop();
            o.disconnect();
          });
          noiseSource.stop();
          noiseSource.disconnect();
          bandpass.disconnect();
          lowpass.disconnect();
        } catch {
          // ignore
        }
      },
    };
  }

  /**
   * Sleep Timer (15m, 30m, 45m, 60m)
   */
  public setSleepTimer(minutes: number | null) {
    if (this.sleepTimerId) {
      clearTimeout(this.sleepTimerId);
      this.sleepTimerId = null;
      this.sleepTimerEndsAt = null;
    }

    if (!minutes) {
      this.notify();
      return;
    }

    this.sleepTimerEndsAt = Date.now() + minutes * 60 * 1000;
    this.sleepTimerId = setTimeout(() => {
      this.pause();
      this.sleepTimerEndsAt = null;
      this.sleepTimerId = null;
      this.notify();
    }, minutes * 60 * 1000);

    this.notify();
  }

  public getSleepTimerRemaining(): number | null {
    if (!this.sleepTimerEndsAt) return null;
    return Math.max(0, Math.floor((this.sleepTimerEndsAt - Date.now()) / 1000));
  }
}

// Global Singleton
let engineInstance: FocusAudioEngine | null = null;

export function getFocusAudioEngine(): FocusAudioEngine {
  if (!engineInstance) {
    engineInstance = new FocusAudioEngine();
  }
  return engineInstance;
}
