import { EMAIL_THEME, EmailLayout } from './components/email-layout';
import { InviteClient } from './invite-client';
import { ResetPassword } from './reset-password';
import { TrainingReminder } from './training-reminder';
import { VerifyEmail } from './verify-email';

describe('Email templates', () => {
  it('instantiates EmailLayout with brand header and footer', () => {
    const element = EmailLayout({
      preview: 'Náhledový text',
      children: 'Obsah',
    });

    expect(element).toBeDefined();
    const tree = JSON.stringify(element);
    expect(tree).toContain('Náhledový text');
    expect(tree).toContain('Train');
    expect(tree).toContain('Loop');
    expect(tree).toContain(EMAIL_THEME.colors.background); // #faf8f5
    expect(tree).toContain(EMAIL_THEME.colors.primary); // #c2410c
    expect(tree).toContain(EMAIL_THEME.colors.border); // #e6dfd3
    expect(tree).toContain('TrainLoop · Tréninkový deník psa');
  });

  it('instantiates InviteClient template with Czech text and props', () => {
    const element = InviteClient({
      trainerName: 'Veronika Trenérka',
      code: 'K7M2PQ',
      url: 'https://trainloop.app/invite?code=K7M2PQ',
    });

    expect(element).toBeDefined();
    expect(element.props).toBeDefined();
    const tree = JSON.stringify(element);
    expect(tree).toContain('Pozvánka do TrainLoopu');
    expect(tree).toContain('Veronika Trenérka');
    expect(tree).toContain('K7M2PQ');
    expect(tree).toContain('https://trainloop.app/invite?code=K7M2PQ');
    expect(tree).toContain('Přijmout pozvánku');
    // Design tokens & styling
    expect(tree).toContain('#c2410c'); // Primary brand/button color
    expect(tree).toContain('#f2eee5'); // Muted code box
    expect(tree).toContain('#e6dfd3'); // Border
    expect(tree).toContain('TrainLoop');
  });

  it('instantiates InviteClient template for existing user', () => {
    const element = InviteClient({
      trainerName: 'Veronika Trenérka',
      code: 'K7M2PQ',
      url: 'https://trainloop.app/invite?code=K7M2PQ',
      isExistingUser: true,
    });

    const tree = JSON.stringify(element);
    expect(tree).toContain('Přihlásit se a přijmout pozvánku');
    expect(tree).toContain('již máte vytvořený účet');
  });

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
    // Design tokens & styling
    expect(tree).toContain('#c2410c');
    expect(tree).toContain('#1c2628');
    expect(tree).toContain('#e6dfd3');
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
    // Design tokens & styling
    expect(tree).toContain('#c2410c');
    expect(tree).toContain('#1c2628');
    expect(tree).toContain('#e6dfd3');
  });

  it('instantiates TrainingReminder template with Czech text and training list', () => {
    const element = TrainingReminder({
      recipientName: 'Jana Nováková',
      dateLabel: '20. 11. 2026',
      trainings: [
        {
          dogName: 'Rex',
          goalTitle: 'Přivolání u rušivek',
          trainingTitle: 'Trénink 1 — Park',
          discipline: 'Poslušnost',
          stepCount: 3,
          durationMinutes: 15,
        },
        {
          dogName: 'Bela',
          goalTitle: 'Chůze u nohy',
          trainingTitle: 'Chůze u nohy',
          discipline: null,
          stepCount: 1,
          durationMinutes: 10,
        },
      ],
      todayUrl: 'https://trainloop.app/',
      accountSettingsUrl: 'https://trainloop.app/account',
    });

    expect(element).toBeDefined();
    const tree = JSON.stringify(element);
    expect(tree).toContain('Dnešní tréninky (20. 11. 2026)');
    expect(tree).toContain('Jana Nováková');
    expect(tree).toContain('2 naplánované tréninky');
    expect(tree).toContain('Rex');
    expect(tree).toContain('Poslušnost');
    expect(tree).toContain('Trénink 1 — Park');
    expect(tree).toContain('Přivolání u rušivek');
    expect(tree).toContain('3 kroky · cca 15 min');
    expect(tree).toContain('Bela');
    expect(tree).toContain('Chůze u nohy');
    expect(tree).toContain('1 krok · cca 10 min');
    expect(tree).toContain('Otevřít dnešní plán');
    expect(tree).toContain('https://trainloop.app/account');
  });
});
