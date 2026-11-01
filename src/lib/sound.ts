'use client';

/**
 * High-fidelity Interactive Audio Synthesizer
 * Provides acoustic piano key notes for menu navigation and tactile mechanical keypress sounds for buttons.
 * Pure Web Audio API synthesis — 0 external audio assets required.
 */

// Pentatonic scale frequencies in Hz (C5, D5, E5, G5, A5, C6, D6, E6, G6, A6)
export const PENTATONIC_SCALE = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.00, // A6
];

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const MASTER_VOLUME = 0.3;

function getAudioContext(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      audioCtx = new AudioContextClass();

      // Master lowpass filter to produce warm, natural tones
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3200;

      // Dynamics compressor to prevent distortion & level the output
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      masterGain = audioCtx.createGain();
      masterGain.gain.value = MASTER_VOLUME;

      masterGain.connect(filter);
      filter.connect(compressor);
      compressor.connect(audioCtx.destination);
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    return { ctx: audioCtx, out: masterGain! };
  } catch {
    return null;
  }
}

/** Check if sound effects are enabled (defaults to true) */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('folioframe_sound') !== 'off';
  } catch {
    return true;
  }
}

/** Set sound enabled/disabled and broadcast change */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('folioframe_sound', enabled ? 'on' : 'off');
    window.dispatchEvent(new CustomEvent('folioframe-sound-change', { detail: { enabled } }));
  } catch {}
}

/** Toggle sound on/off with audible confirmation */
export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  if (next) {
    playToggleSound(true);
  }
  return next;
}

/**
 * Play a rich piano tone with physical acoustic harmonics
 * @param frequency Frequency in Hz
 * @param delayOffset Delay in seconds
 * @param volumeMultiplier Volume factor (0 to 1)
 */
export function playTone(frequency: number, delayOffset = 0, volumeMultiplier = 1): void {
  if (!isSoundEnabled()) return;
  const audio = getAudioContext();
  if (!audio) return;

  const { ctx, out } = audio;
  const startTime = ctx.currentTime + delayOffset;

  // 4 harmonic partials mimicking real wooden piano string acoustics
  const harmonics = [
    { ratio: 1.0, gain: 0.22, decay: 1.4 },
    { ratio: 2.0, gain: 0.09, decay: 0.8 },
    { ratio: 3.0, gain: 0.04, decay: 0.5 },
    { ratio: 4.01, gain: 0.02, decay: 0.3 }, // slight detune creates warmth
  ];

  harmonics.forEach(({ ratio, gain, decay }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency * ratio, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(gain * volumeMultiplier, startTime + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

    osc.connect(gainNode);
    gainNode.connect(out);

    osc.start(startTime);
    osc.stop(startTime + decay + 0.05);
  });
}

/**
 * Play a piano note from the pentatonic scale by index (e.g. 0 for Profile, 1 for Projects, 2 for People, etc.)
 */
export function playPianoNote(index: number): void {
  if (!isSoundEnabled()) return;
  const normalizedIndex = ((index % PENTATONIC_SCALE.length) + PENTATONIC_SCALE.length) % PENTATONIC_SCALE.length;
  playTone(PENTATONIC_SCALE[normalizedIndex]);
}

/**
 * Frequency-ramped oscillator tone
 */
function playFrequencyRamp(
  type: OscillatorType,
  startFreq: number,
  endFreq: number,
  delayOffset: number,
  duration: number,
  peakGain: number
): void {
  const audio = getAudioContext();
  if (!audio) return;

  const { ctx, out } = audio;
  const startTime = ctx.currentTime + delayOffset;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration * 0.5);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.004);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gainNode);
  gainNode.connect(out);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/**
 * Tactile mechanical keypress / pop switch click sound
 * The popular snappy tactile click heard on modern polished interfaces.
 */
export function playKeyPressSound(): void {
  if (!isSoundEnabled()) return;
  try {
    playFrequencyRamp('sine', 380, 980, 0, 0.12, 0.25);
    playFrequencyRamp('sine', 1400, 1900, 0.02, 0.05, 0.04);
  } catch {}
}

/**
 * Toggle on/off sound
 */
export function playToggleSound(isOn: boolean): void {
  if (!isSoundEnabled() && !isOn) return;
  try {
    const [note1, note2] = isOn ? [PENTATONIC_SCALE[4], PENTATONIC_SCALE[7]] : [PENTATONIC_SCALE[7], PENTATONIC_SCALE[4]];
    playTone(note1, 0, 0.6);
    playTone(note2, 0.09, 0.6);
  } catch {}
}

/**
 * Success action chord (two pleasant ascending notes)
 */
export function playSuccessSound(): void {
  if (!isSoundEnabled()) return;
  try {
    playTone(987.77, 0, 0.6);
    playTone(1318.51, 0.08, 0.65);
  } catch {}
}

/**
 * Sparkle celebratory arpeggio
 */
export function playSparkleSound(): void {
  if (!isSoundEnabled()) return;
  try {
    [783.99, 1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
      playFrequencyRamp('triangle', freq, freq * 1.01, idx * 0.045, 0.16, 0.08);
    });
  } catch {}
}

/**
 * Play a named sound effect
 */
export function playSoundEffect(name: 'pop' | 'success' | 'sparkle' | 'love' | 'message'): void {
  if (!isSoundEnabled()) return;
  switch (name) {
    case 'pop':
      playKeyPressSound();
      break;
    case 'success':
      playSuccessSound();
      break;
    case 'sparkle':
      playSparkleSound();
      break;
    case 'love':
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        playTone(freq, idx * 0.08, 0.7);
      });
      break;
    case 'message':
      playFrequencyRamp('sine', 620, 880, 0, 0.12, 0.16);
      playFrequencyRamp('sine', 940, 1320, 0.1, 0.14, 0.13);
      break;
  }
}

/**
 * Global click event listener attaching sound effects to interactive elements:
 * - Elements with `data-note="X"` trigger the piano scale.
 * - Elements with `data-sfx="X"` trigger named SFX.
 * - Buttons and action controls trigger the tactile keypress click.
 */
export function initGlobalSoundListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 1. Explicit piano note element (e.g. sidebar menu option)
    const noteEl = target.closest('[data-note]') as HTMLElement | null;
    if (noteEl && noteEl.dataset.note !== undefined) {
      playPianoNote(Number(noteEl.dataset.note));
      return;
    }

    // 2. Explicit SFX attribute
    const sfxEl = target.closest('[data-sfx]') as HTMLElement | null;
    if (sfxEl && sfxEl.dataset.sfx) {
      playSoundEffect(sfxEl.dataset.sfx as 'pop' | 'success' | 'sparkle' | 'love' | 'message');
      return;
    }

    // 3. Skip sound if explicitly disabled on element
    if (target.closest('[data-no-sound]')) return;

    // 4. Default interactive click on buttons, tabs, links with .btn or role="button"
    const buttonEl = target.closest('button, [role="button"], .btn') as HTMLElement | null;
    if (buttonEl) {
      playKeyPressSound();
    }
  };

  document.addEventListener('click', handleClick, { capture: true });
  return () => {
    document.removeEventListener('click', handleClick, { capture: true });
  };
}
