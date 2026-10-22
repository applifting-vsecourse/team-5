export class RegistrationValidationError extends Error {
  constructor(
    public readonly code: 'NAME_REQUIRED' | 'PRIVACY_CONSENT_REQUIRED',
    message: string,
  ) {
    super(message);
  }
}

// Validate at the API boundary as well as in the form. Never trim passwords.
export function validateRegistration(body: Record<string, unknown>): string {
  if (typeof body.name !== 'string' || !body.name.trim()) {
    throw new RegistrationValidationError('NAME_REQUIRED', 'Vyplňte jméno.');
  }
  if (body.privacyConsent !== true) {
    throw new RegistrationValidationError(
      'PRIVACY_CONSENT_REQUIRED',
      'Pro registraci je nutný souhlas se zpracováním osobních údajů.',
    );
  }
  return body.name.trim();
}
