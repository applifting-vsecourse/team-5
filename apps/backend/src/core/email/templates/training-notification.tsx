import * as React from 'react';
import { Button, Heading, Hr, Link, Section, Text } from 'react-email';
import { EMAIL_THEME, EmailLayout } from './components/email-layout';

export type TrainingNotificationEventKind =
  | 'NEW_RECORD'
  | 'CLIENT_MESSAGE'
  | 'TRAINER_REPLY';

export interface TrainingNotificationItem {
  kind: TrainingNotificationEventKind;
  actorName: string;
  text?: string | null;
}

export interface TrainingNotificationProps {
  recipientName: string;
  dogName: string;
  trainingTitle: string;
  recordUrl: string;
  accountUrl: string;
  items: TrainingNotificationItem[];
}

const MAX_EXCERPT_LENGTH = 500;

const truncate = (value: string): string => {
  const normalized = value.trim();
  if (normalized.length <= MAX_EXCERPT_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_EXCERPT_LENGTH - 1).trimEnd()}…`;
};

const formatCountLabel = (count: number): string => {
  if (count === 1) return '1 nová zpráva';
  if (count >= 2 && count <= 4) return `${count} nové zprávy`;
  return `${count} nových zpráv`;
};

const itemActionLabel = (kind: TrainingNotificationEventKind): string => {
  switch (kind) {
    case 'NEW_RECORD':
      return 'uložil nový záznam tréninku';
    case 'TRAINER_REPLY':
      return 'odpověděl v konverzaci';
    case 'CLIENT_MESSAGE':
      return 'přidal zprávu';
  }
};

export const getTrainingNotificationSubject = (
  dogName: string,
  trainingTitle: string,
  items: TrainingNotificationItem[],
): string => {
  if (items.length > 1) {
    return `Shrnutí zpráv k tréninku (${items.length}) – ${dogName}: ${trainingTitle}`;
  }
  const kind = items[0]?.kind ?? 'CLIENT_MESSAGE';
  switch (kind) {
    case 'TRAINER_REPLY':
      return `Nová odpověď od trenéra – ${dogName}: ${trainingTitle}`;
    case 'NEW_RECORD':
      return `Nový záznam tréninku – ${dogName}: ${trainingTitle}`;
    case 'CLIENT_MESSAGE':
      return `Nová zpráva k tréninku – ${dogName}: ${trainingTitle}`;
  }
};

export const TrainingNotification = ({
  recipientName = 'Jan Novák',
  dogName = 'Rex',
  trainingTitle = 'Přivolání v parku',
  recordUrl = 'https://trainloop.app/dogs/dog-1/activities/log-1',
  accountUrl = 'https://trainloop.app/account',
  items = [
    {
      kind: 'TRAINER_REPLY',
      actorName: 'Veronika Trenérka',
      text: 'Skvělá práce, příště zkuste zkrátit odměnu o sekundu.',
    },
  ],
}: TrainingNotificationProps): React.JSX.Element => {
  const isDigest = items.length > 1;
  const single = items[0];

  const heading = isDigest
    ? 'Shrnutí nových zpráv k tréninku'
    : single?.kind === 'TRAINER_REPLY'
      ? 'Nová odpověď od trenéra'
      : single?.kind === 'NEW_RECORD'
        ? 'Nový záznam tréninku'
        : 'Nová zpráva od klienta';

  const preview = isDigest
    ? `${formatCountLabel(items.length)} k tréninku ${trainingTitle} (${dogName})`
    : single?.kind === 'TRAINER_REPLY'
      ? `Trenér ${single.actorName} odpověděl k tréninku psa ${dogName}`
      : single?.kind === 'NEW_RECORD'
        ? `${single.actorName} uložil nový záznam tréninku psa ${dogName}`
        : `${single?.actorName ?? 'Klient'} přidal zprávu k tréninku psa ${dogName}`;

  return (
    <EmailLayout preview={preview}>
      <Heading
        className="text-2xl font-bold tracking-tight text-[#1c2628] m-0"
        style={{
          color: EMAIL_THEME.colors.foreground,
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          margin: 0,
        }}
      >
        {heading}
      </Heading>
      <Text
        className="text-[#1c2628] text-base leading-6 mt-4"
        style={{
          color: EMAIL_THEME.colors.foreground,
          fontSize: '16px',
          lineHeight: '24px',
          marginTop: '16px',
          marginBottom: 0,
        }}
      >
        {isDigest ? (
          <>
            Dobrý den {recipientName}, v záznamu tréninku{' '}
            <strong>{trainingTitle}</strong> ({dogName}) přibylo od posledního
            upozornění {formatCountLabel(items.length)}:
          </>
        ) : single?.kind === 'TRAINER_REPLY' ? (
          <>
            Dobrý den {recipientName}, trenér{' '}
            <strong>{single.actorName}</strong> přidal odpověď k záznamu
            tréninku <strong>{trainingTitle}</strong> ({dogName}).
          </>
        ) : single?.kind === 'NEW_RECORD' ? (
          <>
            Dobrý den {recipientName}, <strong>{single.actorName}</strong>{' '}
            uložil nový záznam tréninku <strong>{trainingTitle}</strong> (
            {dogName}).
          </>
        ) : (
          <>
            Dobrý den {recipientName},{' '}
            <strong>{single?.actorName ?? 'Klient'}</strong> přidal novou zprávu
            k záznamu tréninku <strong>{trainingTitle}</strong> ({dogName}).
          </>
        )}
      </Text>

      {isDigest ? (
        <Section
          className="bg-[#f2eee5] border border-[#e6dfd3] rounded-md p-4 my-6"
          style={{
            backgroundColor: EMAIL_THEME.colors.muted,
            border: `1px solid ${EMAIL_THEME.colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            margin: '24px 0',
          }}
        >
          {items.map((item, index) => (
            <Section
              key={index}
              style={{
                borderTop:
                  index === 0
                    ? 'none'
                    : `1px solid ${EMAIL_THEME.colors.border}`,
                paddingTop: index === 0 ? '0px' : '12px',
                marginTop: index === 0 ? '0px' : '12px',
              }}
            >
              <Text
                className="text-xs font-semibold text-[#616e74] m-0"
                style={{
                  color: EMAIL_THEME.colors.mutedForeground,
                  fontSize: '12px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {item.actorName} · {itemActionLabel(item.kind)}
              </Text>
              {item.text?.trim() ? (
                <Text
                  className="text-[#1c2628] text-sm leading-5 m-0 mt-1"
                  style={{
                    color: EMAIL_THEME.colors.foreground,
                    fontSize: '14px',
                    lineHeight: '20px',
                    margin: '4px 0 0 0',
                  }}
                >
                  {truncate(item.text)}
                </Text>
              ) : null}
            </Section>
          ))}
        </Section>
      ) : single?.text?.trim() ? (
        <Section
          className="bg-[#f2eee5] border border-[#e6dfd3] rounded-md p-4 my-6"
          style={{
            backgroundColor: EMAIL_THEME.colors.muted,
            border: `1px solid ${EMAIL_THEME.colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            margin: '24px 0',
          }}
        >
          <Text
            className="text-[#1c2628] text-sm leading-5 m-0"
            style={{
              color: EMAIL_THEME.colors.foreground,
              fontSize: '14px',
              lineHeight: '20px',
              margin: 0,
            }}
          >
            {truncate(single.text)}
          </Text>
        </Section>
      ) : null}

      <Section
        className="text-center my-8"
        style={{ textAlign: 'center', margin: '32px 0' }}
      >
        <Button
          href={recordUrl}
          className="bg-[#8b5a2b] text-white font-semibold rounded-md px-6 py-3.5 text-center inline-block"
          style={{
            backgroundColor: EMAIL_THEME.colors.primary,
            color: EMAIL_THEME.colors.primaryForeground,
            borderRadius: '8px',
            padding: '14px 24px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
          }}
        >
          Otevřít záznam tréninku
        </Button>
      </Section>

      <Text
        className="text-[#616e74] text-sm leading-5 mt-6 mb-2"
        style={{
          color: EMAIL_THEME.colors.mutedForeground,
          fontSize: '14px',
          lineHeight: '20px',
          marginTop: '24px',
          marginBottom: '8px',
        }}
      >
        Pokud tlačítko nefunguje, zkopírujte a vložte následující odkaz do svého
        prohlížeče:
      </Text>
      <Text
        className="text-[#8b5a2b] text-sm break-all m-0"
        style={{
          color: EMAIL_THEME.colors.primary,
          fontSize: '14px',
          wordBreak: 'break-all',
          margin: 0,
        }}
      >
        <Link
          href={recordUrl}
          className="text-[#8b5a2b] underline"
          style={{
            color: EMAIL_THEME.colors.primary,
            textDecoration: 'underline',
          }}
        >
          {recordUrl}
        </Link>
      </Text>
      <Hr
        className="border-[#e6dfd3] my-6"
        style={{ borderColor: EMAIL_THEME.colors.border, margin: '24px 0' }}
      />
      <Text
        className="text-[#616e74] text-xs leading-5 m-0"
        style={{
          color: EMAIL_THEME.colors.mutedForeground,
          fontSize: '12px',
          lineHeight: '20px',
          margin: 0,
        }}
      >
        E-mailová upozornění můžete kdykoli vypnout v nastavení{' '}
        <Link
          href={accountUrl}
          className="text-[#8b5a2b] underline"
          style={{
            color: EMAIL_THEME.colors.primary,
            textDecoration: 'underline',
          }}
        >
          Účtu
        </Link>
        .
      </Text>
    </EmailLayout>
  );
};

export default TrainingNotification;
