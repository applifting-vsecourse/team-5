/** Google button is shown only when frontend opts in; backend still needs secrets. */
export function isGoogleOAuthEnabled(): boolean {
  return import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === "true"
}
