export class RegistrationValidationError extends Error {
  constructor(
    public readonly code:
      | 'NAME_REQUIRED'
      | 'PRIVACY_CONSENT_REQUIRED'
      | 'INVALID_TRAINER_SELECTION',
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
  if (body.isTrainer !== undefined && typeof body.isTrainer !== 'boolean') {
    throw new RegistrationValidationError(
      'INVALID_TRAINER_SELECTION',
      'Vyberte, zda se registrujete jako trenér.',
    );
  }
  return body.name.trim();
}
