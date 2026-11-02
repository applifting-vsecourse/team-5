export const ALLOWED_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".heif"]

export const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"]

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

export function resolvePhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null
  if (
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://") ||
    photoUrl.startsWith("blob:") ||
    photoUrl.startsWith("data:")
  ) {
    return photoUrl
  }
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4050/api"
  // Uploaded files are served under the API too. Keeping that prefix works
  // with both a separate backend origin and a same-origin /api reverse proxy.
  // Old stored /uploads URLs continue to work without a database migration.
  const uploadPath = photoUrl.replace(/^\/?(?:api\/)?uploads\//, "uploads/")
  return `${apiUrl.replace(/\/$/, "")}/${uploadPath.replace(/^\//, "")}`
}
