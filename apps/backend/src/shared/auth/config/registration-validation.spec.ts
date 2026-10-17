import {
  RegistrationValidationError,
  validateRegistration,
} from './registration-validation';

describe('registration validation', () => {
  it.each([undefined, false, 'true', 'false', 1, null])(
    'rejects consent that is not the boolean true: %p',
    (privacyConsent) => {
      expect(() =>
        validateRegistration({ name: 'Jana', privacyConsent }),
      ).toThrow(expect.objectContaining({ code: 'PRIVACY_CONSENT_REQUIRED' }));
    },
  );

  it.each([undefined, '', '   ', null, 42])(
    'rejects a missing name: %p',
    (name) => {
      expect(() =>
        validateRegistration({ name, privacyConsent: true }),
      ).toThrow(expect.objectContaining({ code: 'NAME_REQUIRED' }));
    },
  );

  it('accepts consent and normalizes the name without modifying the password', () => {
    const body = {
      name: '  Jana Nováková  ',
      privacyConsent: true,
      password: ' space password ',
    };
    expect(validateRegistration(body)).toBe('Jana Nováková');
    expect(body.password).toBe(' space password ');
  });

  it('reports a typed validation failure', () => {
    expect(() => validateRegistration({})).toThrow(RegistrationValidationError);
  });
});
