import type { ParsedLocation } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"

export const encodeRedirectUri = (location: ParsedLocation) => encodeURIComponent(location.href)

export const decodeRedirectUri = (encoded?: string) => {
  if (!encoded) return undefined
  try {
    const destination = decodeURIComponent(encoded)
    if (!destination.startsWith("/") || destination.startsWith("//")) return undefined
    if (destination.includes("\\")) return undefined
    if (
      Array.from(destination).some(
        (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      )
    ) {
      return undefined
    }
    const url = new URL(destination, "https://trainloop.invalid")
    const path = decodeURIComponent(url.pathname)
    const protectedPaths = [ROUTES.dogs, ROUTES.clients, ROUTES.week, ROUTES.account, ROUTES.quacks]
    if (!protectedPaths.some((route) => path === route || path.startsWith(`${route}/`))) {
      return undefined
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}
