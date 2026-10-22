export type RegistrationField = "name" | "email" | "password" | "privacyConsent" | "isTrainer"

export class RegistrationError extends Error {
  constructor(
    message: string,
    public readonly field?: RegistrationField,
    public readonly isDuplicateEmail = false,
  ) {
    super(message)
  }
}

export function registrationError(code?: string): RegistrationError {
  switch (code) {
    case "INVALID_TRAINER_SELECTION":
      return new RegistrationError("Vyberte, zda se registrujete jako trenér.", "isTrainer")
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return new RegistrationError("Účet s tímto e-mailem už existuje.", "email", true)
    case "INVALID_EMAIL":
      return new RegistrationError("Zadejte platný e-mail.", "email")
    case "NAME_REQUIRED":
      return new RegistrationError("Vyplňte jméno.", "name")
    case "PASSWORD_TOO_SHORT":
      return new RegistrationError("Heslo musí mít alespoň 8 znaků.", "password")
    case "PASSWORD_TOO_LONG":
      return new RegistrationError("Heslo může mít nejvýše 128 znaků.", "password")
    case "PRIVACY_CONSENT_REQUIRED":
      return new RegistrationError(
        "Pro registraci je nutný souhlas se zpracováním osobních údajů.",
        "privacyConsent",
      )
    default:
      return new RegistrationError("Registrace se nezdařila. Zkuste to prosím znovu.")
  }
}
