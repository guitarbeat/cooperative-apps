/**
 * Sound utility functions for audio feedback
 * Consolidated from sound.js + sound.d.ts
 */

interface AudioContextConstructor {
  new (): AudioContext;
}

declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}

/**
 * Play a beep sound with configurable frequency, duration, and volume
 */
export function playBeep(
  frequency = 880,
  durationMs = 150,
  volume = 0.05
): void {
  try {
    const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextImpl) return;

    const audioCtx = new AudioContextImpl();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, durationMs);
  } catch {
    // Fail silently if audio is not available
  }
}

/** Play a notification sound (higher pitch) */
export function playNotificationSound(): void {
  playBeep(880, 150, 0.05);
}

/** Play a success sound (pleasant chord) */
export function playSuccessSound(): void {
  playBeep(660, 100, 0.04);
  setTimeout(() => playBeep(880, 100, 0.04), 100);
}

/** Play an error sound (lower pitch) */
export function playErrorSound(): void {
  playBeep(220, 200, 0.05);
}
