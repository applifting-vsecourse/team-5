import { ResetPassword } from './reset-password';
import { VerifyEmail } from './verify-email';

describe('Email templates', () => {
  it('instantiates ResetPassword template with Czech text and props', () => {
    const element = ResetPassword({
      username: 'Jan Novák',
      url: 'https://trainloop.app/reset-password?token=abc-123',
    });

    expect(element).toBeDefined();
    expect(element.props).toBeDefined();
    // Stringify JSON representation of React element tree to verify template content
    const tree = JSON.stringify(element);
    expect(tree).toContain('Obnova hesla');
    expect(tree).toContain('Jan Novák');
    expect(tree).toContain(
      'https://trainloop.app/reset-password?token=abc-123',
    );
    expect(tree).toContain('Obnovit heslo');
    expect(tree).toContain('Pokud jste o obnovu hesla nežádali');
  });

  it('instantiates VerifyEmail template with Czech text and props', () => {
    const element = VerifyEmail({
      url: 'https://trainloop.app/verify-email?token=xyz-789',
    });

    expect(element).toBeDefined();
    expect(element.props).toBeDefined();
    const tree = JSON.stringify(element);
    expect(tree).toContain('Vítejte v TrainLoop');
    expect(tree).toContain('https://trainloop.app/verify-email?token=xyz-789');
    expect(tree).toContain('Ověřit e-mail');
    expect(tree).toContain('Pokud jste si účet v TrainLoop nevytvořili');
  });
});
