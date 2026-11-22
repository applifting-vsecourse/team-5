type AudioWindow = Window & {
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
}

let sharedAudioContext: AudioContext | null = null

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null
  const win = window as AudioWindow
  return win.AudioContext ?? win.webkitAudioContext ?? null
}

function getOrCreateAudioContext(): AudioContext | null {
  if (sharedAudioContext && sharedAudioContext.state !== "closed") {
    return sharedAudioContext
  }
  const AudioCtx = getAudioContextConstructor()
  if (!AudioCtx) return null
  try {
    sharedAudioContext = new AudioCtx()
    return sharedAudioContext
  } catch {
    return null
  }
}

function scheduleMetallicSnap(
  ctx: AudioContext,
  startTime: number,
  startFreq: number,
  endFreq: number,
  peakGain: number,
  durationSec: number,
) {
  const osc = ctx.createOscillator()
  const oscGain = ctx.createGain()
  osc.type = "triangle"
  osc.frequency.setValueAtTime(startFreq, startTime)
  osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + durationSec)

  oscGain.gain.setValueAtTime(0.0001, startTime)
  oscGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.001)
  oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec)

  osc.connect(oscGain)
  oscGain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + durationSec + 0.005)

  // Short high-frequency noise burst adds the crisp metallic transient of a box clicker.
  if (typeof ctx.createBuffer === "function" && typeof ctx.createBufferSource === "function") {
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * durationSec))
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < sampleCount; i += 1) {
      const envelope = 1 - i / sampleCount
      channel[i] = (Math.random() * 2 - 1) * envelope * envelope
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.setValueAtTime(startFreq, startTime)
    filter.Q.setValueAtTime(2.5, startTime)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(peakGain * 0.7, startTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(startTime)
    noise.stop(startTime + durationSec + 0.005)
  }
}

/**
 * Synthesizes a crisp two-part mechanical dog clicker sound ("click-clack")
 * purely via Web Audio API without external audio files or network requests.
 */
export function playClickerSound(): boolean {
  const ctx = getOrCreateAudioContext()
  if (!ctx) return false

  if (ctx.state === "suspended" && typeof ctx.resume === "function") {
    void ctx.resume().catch(() => undefined)
  }

  const now = ctx.currentTime
  // Primary press snap
  scheduleMetallicSnap(ctx, now, 3200, 1100, 0.9, 0.014)
  // Secondary spring-return snap
  scheduleMetallicSnap(ctx, now + 0.022, 2400, 900, 0.55, 0.011)
  return true
}

export function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
}

export function triggerHaptic(durationMs = 25): boolean {
  if (!isHapticSupported()) return false
  try {
    return Boolean(navigator.vibrate(durationMs))
  } catch {
    return false
  }
}

export function resetClickerAudioContextForTests(): void {
  sharedAudioContext = null
}
