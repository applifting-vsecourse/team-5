export const INVALID_CREDENTIALS_MESSAGE = "Nesprávný e-mail nebo heslo."
export const SIGN_IN_FAILED_MESSAGE = "Přihlášení se nezdařilo. Zkuste to prosím znovu."

export class SignInError extends Error {}

export function signInError(code?: string) {
  // Never display the API's raw message: neither response may reveal an account.
  return new SignInError(
    code === "INVALID_EMAIL_OR_PASSWORD" || code === "USER_NOT_FOUND" || code === "INVALID_PASSWORD"
      ? INVALID_CREDENTIALS_MESSAGE
      : SIGN_IN_FAILED_MESSAGE,
  )
}
