import { useCallback, useState } from "react"

import { isHapticSupported, playClickerSound, triggerHaptic } from "@/lib/clickerAudio"

const HAPTICS_STORAGE_KEY = "trainloop.clicker.haptics"

function readStoredHapticsPreference(): boolean {
  if (typeof window === "undefined") return true
  try {
    const raw = window.localStorage.getItem(HAPTICS_STORAGE_KEY)
    if (raw === "false") return false
    if (raw === "true") return true
    return true
  } catch {
    return true
  }
}

function writeStoredHapticsPreference(isEnabled: boolean): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(HAPTICS_STORAGE_KEY, String(isEnabled))
  } catch {
    // Ignore storage quota or private-browsing errors.
  }
}

export function useClicker() {
  const [count, setCount] = useState(0)
  const [isHapticsSupported] = useState(() => isHapticSupported())
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(() => readStoredHapticsPreference())

  const click = useCallback(() => {
    playClickerSound()
    if (isHapticsSupported && isHapticsEnabled) {
      triggerHaptic(25)
    }
    setCount((prev) => prev + 1)
  }, [isHapticsEnabled, isHapticsSupported])

  const reset = useCallback(() => {
    setCount(0)
  }, [])

  const toggleHaptics = useCallback(() => {
    setIsHapticsEnabled((prev) => {
      const isNextEnabled = !prev
      writeStoredHapticsPreference(isNextEnabled)
      return isNextEnabled
    })
  }, [])

  return {
    count,
    isHapticsSupported,
    isHapticsEnabled,
    click,
    reset,
    toggleHaptics,
  }
}
