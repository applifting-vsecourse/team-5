import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  isHapticSupported,
  playClickerSound,
  resetClickerAudioContextForTests,
  triggerHaptic,
} from "./clickerAudio"

function createMockAudioContext(state: AudioContextState = "running") {
  const start = vi.fn()
  const stop = vi.fn()
  const connect = vi.fn()
  const resume = vi.fn().mockResolvedValue(undefined)

  const createOscillator = vi.fn(() => ({
    type: "sine",
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect,
    start,
    stop,
  }))

  const createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect,
  }))

  const createBuffer = vi.fn((_channels: number, length: number) => ({
    getChannelData: vi.fn(() => new Float32Array(length)),
  }))

  const createBufferSource = vi.fn(() => ({
    buffer: null as AudioBuffer | null,
    connect,
    start,
    stop,
  }))

  const createBiquadFilter = vi.fn(() => ({
    type: "lowpass",
    frequency: { setValueAtTime: vi.fn() },
    Q: { setValueAtTime: vi.fn() },
    connect,
  }))

  const ctx = {
    state,
    currentTime: 1.5,
    sampleRate: 44100,
    destination: {},
    resume,
    createOscillator,
    createGain,
    createBuffer,
    createBufferSource,
    createBiquadFilter,
  }

  return {
    ctx,
    start,
    stop,
    resume,
    createOscillator,
    createGain,
    createBufferSource,
  }
}

describe("clickerAudio", () => {
  const originalAudioContextDescriptor = Object.getOwnPropertyDescriptor(window, "AudioContext")
  const originalVibrateDescriptor = Object.getOwnPropertyDescriptor(navigator, "vibrate")

  beforeEach(() => {
    resetClickerAudioContextForTests()
  })

  afterEach(() => {
    resetClickerAudioContextForTests()
    if (originalAudioContextDescriptor) {
      Object.defineProperty(window, "AudioContext", originalAudioContextDescriptor)
    } else {
      Reflect.deleteProperty(window, "AudioContext")
    }
    if (originalVibrateDescriptor) {
      Object.defineProperty(navigator, "vibrate", originalVibrateDescriptor)
    } else {
      Reflect.deleteProperty(navigator, "vibrate")
    }
  })

  it("synthesizes a two-part click sound using Web Audio API without network requests", () => {
    const mock = createMockAudioContext("suspended")
    const AudioContextCtor = vi.fn(function AudioContextMock() {
      return mock.ctx
    })
    Object.defineProperty(window, "AudioContext", {
      value: AudioContextCtor,
      writable: true,
      configurable: true,
    })

    const didPlay = playClickerSound()

    expect(didPlay).toBe(true)
    expect(AudioContextCtor).toHaveBeenCalledTimes(1)
    expect(mock.resume).toHaveBeenCalledTimes(1)
    expect(mock.createOscillator).toHaveBeenCalledTimes(2)
    expect(mock.createBufferSource).toHaveBeenCalledTimes(2)
    expect(mock.start).toHaveBeenCalledTimes(4)
    expect(mock.stop).toHaveBeenCalledTimes(4)

    // Reuses the same AudioContext on subsequent clicks
    playClickerSound()
    expect(AudioContextCtor).toHaveBeenCalledTimes(1)
  })

  it("returns false safely when AudioContext is not available", () => {
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      writable: true,
      configurable: true,
    })

    expect(playClickerSound()).toBe(false)
  })

  it("detects and triggers navigator.vibrate when supported", () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      writable: true,
      configurable: true,
    })

    expect(isHapticSupported()).toBe(true)
    expect(triggerHaptic(30)).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(30)
  })

  it("returns false when navigator.vibrate is unavailable", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      writable: true,
      configurable: true,
    })

    expect(isHapticSupported()).toBe(false)
    expect(triggerHaptic()).toBe(false)
  })
})
