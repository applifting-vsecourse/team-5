import * as React from 'react';
import { Button, Heading, Hr, Link, Section, Text } from 'react-email';
import { EMAIL_THEME, EmailLayout } from './components/email-layout';

export interface TrainingReminderItem {
  dogName: string;
  goalTitle: string;
  trainingTitle: string;
  discipline?: string | null;
  stepCount: number;
  durationMinutes: number;
}

export interface TrainingReminderProps {
  recipientName: string;
  dateLabel: string;
  trainings: TrainingReminderItem[];
  todayUrl: string;
  accountSettingsUrl: string;
}

export const formatTrainingCount = (count: number): string => {
  if (count === 1) return '1 naplánovaný trénink';
  if (count >= 2 && count <= 4) return `${count} naplánované tréninky`;
  return `${count} naplánovaných tréninků`;
};

const formatStepCount = (count: number): string => {
  if (count === 1) return '1 krok';
  if (count >= 2 && count <= 4) return `${count} kroky`;
  return `${count} kroků`;
};

export const TrainingReminder = ({
  recipientName = 'Jana Nováková',
  dateLabel = '20. 11. 2026',
  trainings = [
    {
      dogName: 'Rex',
      goalTitle: 'Přivolání u rušivek',
      trainingTitle: 'Trénink 1 — Klidné prostředí',
      discipline: 'Poslušnost',
      stepCount: 3,
      durationMinutes: 15,
    },
  ],
  todayUrl = 'https://trainloop.app/',
  accountSettingsUrl = 'https://trainloop.app/account',
}: TrainingReminderProps): React.JSX.Element => {
  const countLabel = formatTrainingCount(trainings.length);

  return (
    <EmailLayout preview={`Dnes tě čeká ${countLabel} (${dateLabel}).`}>
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
        {`Dnešní tréninky (${dateLabel})`}
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
        Dobré ráno, <strong>{recipientName}</strong>,
      </Text>
      <Text
        className="text-[#1c2628] text-base leading-6 mt-3"
        style={{
          color: EMAIL_THEME.colors.foreground,
          fontSize: '16px',
          lineHeight: '24px',
          marginTop: '12px',
          marginBottom: 0,
        }}
      >
        na dnešní den máš v TrainLoopu <strong>{countLabel}</strong>. Přehled
        dnešního plánu:
      </Text>

      <Section className="my-5" style={{ margin: '20px 0' }}>
        {trainings.map((item, index) => {
          const metaParts: string[] = [];
          if (item.stepCount > 0) {
            metaParts.push(formatStepCount(item.stepCount));
          }
          if (item.durationMinutes > 0) {
            metaParts.push(`cca ${item.durationMinutes} min`);
          }
          const showGoal =
            item.goalTitle.trim().toLowerCase() !==
            item.trainingTitle.trim().toLowerCase();

          return (
            <Section
              key={`${item.dogName}-${item.trainingTitle}-${index}`}
              className="bg-[#f2eee5] border border-[#e6dfd3] rounded-md p-4 mb-3"
              style={{
                backgroundColor: EMAIL_THEME.colors.muted,
                border: `1px solid ${EMAIL_THEME.colors.border}`,
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: index < trainings.length - 1 ? '12px' : 0,
              }}
            >
              <Text
                className="text-xs uppercase tracking-wider text-[#616e74] font-semibold m-0"
                style={{
                  color: EMAIL_THEME.colors.mutedForeground,
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                {item.dogName}
                {item.discipline ? ` · ${item.discipline}` : ''}
              </Text>
              <Text
                className="text-base font-bold text-[#1c2628] m-0 mt-1"
                style={{
                  color: EMAIL_THEME.colors.foreground,
                  fontSize: '16px',
                  fontWeight: 700,
                  margin: '4px 0 0 0',
                }}
              >
                {item.trainingTitle}
              </Text>
              {showGoal ? (
                <Text
                  className="text-sm text-[#616e74] m-0 mt-1"
                  style={{
                    color: EMAIL_THEME.colors.mutedForeground,
                    fontSize: '14px',
                    margin: '4px 0 0 0',
                  }}
                >
                  Cíl: {item.goalTitle}
                </Text>
              ) : null}
              {metaParts.length > 0 ? (
                <Text
                  className="text-xs text-[#616e74] m-0 mt-2"
                  style={{
                    color: EMAIL_THEME.colors.mutedForeground,
                    fontSize: '12px',
                    margin: '8px 0 0 0',
                  }}
                >
                  {metaParts.join(' · ')}
                </Text>
              ) : null}
            </Section>
          );
        })}
      </Section>

      <Section
        className="text-center my-6"
        style={{ textAlign: 'center', margin: '24px 0' }}
      >
        <Button
          href={todayUrl}
          className="bg-[#c2410c] text-white font-semibold rounded-md px-6 py-3.5 text-center inline-block"
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
          Otevřít dnešní plán
        </Button>
      </Section>

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
        Ranní připomínky tréninků si můžeš kdykoli vypnout v{' '}
        <Link
          href={accountSettingsUrl}
          className="text-[#c2410c] underline"
          style={{
            color: EMAIL_THEME.colors.primary,
            textDecoration: 'underline',
          }}
        >
          nastavení účtu
        </Link>
        .
      </Text>
    </EmailLayout>
  );
};

export default TrainingReminder;
