export const ALLOWED_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic"]

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024 // 10 MB

export function validateDogPhoto(file: File): string | null {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "")
  const hasValidExt = ALLOWED_PHOTO_EXTENSIONS.includes(ext)
  const hasValidMime = ALLOWED_PHOTO_MIME_TYPES.includes(file.type.toLowerCase())

  if (!hasValidMime && !hasValidExt) {
    return "Podporovány jsou pouze obrázky ve formátu JPG, PNG nebo HEIC."
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return "Fotka může mít maximálně 10 MB."
  }

  return null
}
