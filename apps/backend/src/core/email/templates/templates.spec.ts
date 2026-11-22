import { EMAIL_THEME, EmailLayout } from './components/email-layout';
import { InviteClient } from './invite-client';
import { ResetPassword } from './reset-password';
import {
  getTrainingNotificationSubject,
  TrainingNotification,
} from './training-notification';
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
    expect(tree).toContain(EMAIL_THEME.colors.primary); // #8b5a2b
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
    expect(tree).toContain('#8b5a2b'); // Primary brand/button color
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
    expect(tree).toContain('#8b5a2b');
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
    expect(tree).toContain('#8b5a2b');
    expect(tree).toContain('#1c2628');
    expect(tree).toContain('#e6dfd3');
  });

  it('instantiates TrainingNotification template for a single trainer reply', () => {
    const items = [
      {
        kind: 'TRAINER_REPLY' as const,
        actorName: 'Veronika Trenérka',
        text: 'Skvělý posun v přivolání!',
      },
    ];
    const element = TrainingNotification({
      recipientName: 'Jan Novák',
      dogName: 'Rex',
      trainingTitle: 'Přivolání v parku',
      recordUrl: 'https://trainloop.app/dogs/dog-1/activities/log-1',
      accountUrl: 'https://trainloop.app/account',
      items,
    });

    const tree = JSON.stringify(element);
    expect(tree).toContain('Nová odpověď od trenéra');
    expect(tree).toContain('Veronika Trenérka');
    expect(tree).toContain('Přivolání v parku');
    expect(tree).toContain('Rex');
    expect(tree).toContain('Skvělý posun v přivolání!');
    expect(tree).toContain('https://trainloop.app/dogs/dog-1/activities/log-1');
    expect(tree).toContain('https://trainloop.app/account');
    expect(tree).toContain('Otevřít záznam tréninku');
    expect(tree).toContain('#8b5a2b');
    expect(tree).toContain('#f2eee5');
    expect(tree).toContain('#e6dfd3');
    expect(
      getTrainingNotificationSubject('Rex', 'Přivolání v parku', items),
    ).toBe('Nová odpověď od trenéra – Rex: Přivolání v parku');
  });

  it('instantiates TrainingNotification template as a summary digest for multiple items', () => {
    const items = [
      {
        kind: 'CLIENT_MESSAGE' as const,
        actorName: 'Jan Novák',
        text: 'První dotaz k videu',
      },
      {
        kind: 'CLIENT_MESSAGE' as const,
        actorName: 'Jan Novák',
        text: 'Ještě doplňuji kontext',
      },
    ];
    const element = TrainingNotification({
      recipientName: 'Veronika Trenérka',
      dogName: 'Rex',
      trainingTitle: 'Přivolání v parku',
      recordUrl: 'https://trainloop.app/dogs/dog-1/activities/log-1',
      accountUrl: 'https://trainloop.app/account',
      items,
    });

    const tree = JSON.stringify(element);
    expect(tree).toContain('Shrnutí nových zpráv k tréninku');
    expect(tree).toContain('2 nové zprávy');
    expect(tree).toContain('První dotaz k videu');
    expect(tree).toContain('Ještě doplňuji kontext');
    expect(
      getTrainingNotificationSubject('Rex', 'Přivolání v parku', items),
    ).toBe('Shrnutí zpráv k tréninku (2) – Rex: Přivolání v parku');
  });
});
