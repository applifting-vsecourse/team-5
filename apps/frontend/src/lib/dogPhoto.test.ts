import { describe, expect, it } from "vitest"

import { resolvePhotoUrl, validateDogPhoto } from "./dogPhoto"

describe("dogPhoto", () => {
  describe("validateDogPhoto", () => {
    it("accepts valid JPG, PNG and HEIC files under 10 MB", () => {
      const jpgFile = new File(["dummy"], "rex.jpg", { type: "image/jpeg" })
      const pngFile = new File(["dummy"], "rex.png", { type: "image/png" })
      const heicFile = new File(["dummy"], "rex.heic", { type: "image/heic" })

      expect(validateDogPhoto(jpgFile)).toBeNull()
      expect(validateDogPhoto(pngFile)).toBeNull()
      expect(validateDogPhoto(heicFile)).toBeNull()
    })

    it("rejects files exceeding 10 MB", () => {
      const hugeFile = new File([new ArrayBuffer(10 * 1024 * 1024 + 1)], "big.jpg", {
        type: "image/jpeg",
      })
      expect(validateDogPhoto(hugeFile)).toBe("Fotka může mít maximálně 10 MB.")
    })

    it("rejects unsupported file formats", () => {
      const txtFile = new File(["dummy"], "notes.txt", { type: "text/plain" })
      expect(validateDogPhoto(txtFile)).toBe(
        "Podporovány jsou pouze obrázky ve formátu JPG, PNG nebo HEIC.",
      )
    })
  })

  describe("resolvePhotoUrl", () => {
    it("returns null for empty or null photoUrl", () => {
      expect(resolvePhotoUrl(null)).toBeNull()
      expect(resolvePhotoUrl(undefined)).toBeNull()
      expect(resolvePhotoUrl("")).toBeNull()
    })

    it("keeps absolute http/https/blob/data URLs as-is", () => {
      expect(resolvePhotoUrl("https://example.com/rex.webp")).toBe("https://example.com/rex.webp")
      expect(resolvePhotoUrl("http://example.com/rex.webp")).toBe("http://example.com/rex.webp")
      expect(resolvePhotoUrl("blob:http://localhost:3050/123")).toBe(
        "blob:http://localhost:3050/123",
      )
      expect(resolvePhotoUrl("data:image/webp;base64,...")).toBe("data:image/webp;base64,...")
    })

    it("resolves relative backend uploads path against API base", () => {
      const resolved = resolvePhotoUrl("/uploads/dogs/rex-123.webp")
      expect(resolved).toMatch(/\/uploads\/dogs\/rex-123\.webp$/)
    })
  })
})
