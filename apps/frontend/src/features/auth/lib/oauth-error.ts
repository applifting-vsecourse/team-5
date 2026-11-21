export const OAUTH_CANCELLED_MESSAGE = "Přihlášení přes Google bylo zrušeno."
export const OAUTH_FAILED_MESSAGE = "Přihlášení přes Google se nezdařilo. Zkuste to prosím znovu."

export function oauthErrorMessage(code?: string): string {
  switch (code?.trim().toLowerCase()) {
    case "access_denied":
      return OAUTH_CANCELLED_MESSAGE
    case "account_not_linked":
      return "Účet s tímto e-mailem už existuje. Přihlaste se prosím e-mailem a heslem."
    case "email_not_found":
      return "Z účtu Google se nepodařilo získat e-mailovou adresu."
    case "provider_not_found":
    case "oauth_provider_not_found":
      return "Přihlášení přes Google momentálně není dostupné."
    case "state_mismatch":
    case "state_not_found":
    case "please_restart_the_process":
      return "Platnost přihlášení vypršela. Zkuste to prosím znovu."
    default:
      return OAUTH_FAILED_MESSAGE
  }
}

export function buildAuthCallbackUrl(
  path: string,
  params: Record<string, string | undefined> = {},
): string {
  const url = new URL(path, window.location.origin)
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
  }
  return url.toString()
}
