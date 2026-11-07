import * as React from 'react';
import { Button, Heading, Hr, Link, Section, Text } from 'react-email';
import {
  EMAIL_THEME,
  EmailLayout,
} from './components/email-layout';

export interface InviteClientProps {
  trainerName: string;
  code: string;
  url: string;
  isExistingUser?: boolean;
}

export const InviteClient = ({
  trainerName = 'Veronika Trenérka',
  code = 'K7M2PQ',
  url = 'https://trainloop.app/invite?code=K7M2PQ',
  isExistingUser = false,
}: InviteClientProps): React.JSX.Element => (
  <EmailLayout preview={`Pozvánka do TrainLoopu od trenéra ${trainerName}`}>
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
      Pozvánka do TrainLoopu
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
      {isExistingUser ? (
        <>
          Dobrý den, trenér <strong>{trainerName}</strong> vás zve ke spolupráci v aplikaci TrainLoop. Protože již máte vytvořený účet, stačí se přihlásit a pozvánku potvrdit.
        </>
      ) : (
        <>
          Dobrý den, trenér <strong>{trainerName}</strong> vás zve ke spolupráci v aplikaci TrainLoop.
        </>
      )}
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
      Díky TrainLoopu budete mít tréninkový plán a deník svého psa na jednom místě přímo propojený s vaším trenérem.
    </Text>
    <Section
      className="text-center my-6"
      style={{ textAlign: 'center', margin: '24px 0' }}
    >
      <Button
        href={url}
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
        {isExistingUser ? 'Přihlásit se a přijmout pozvánku' : 'Přijmout pozvánku'}
      </Button>
    </Section>
    <Section
      className="bg-[#f2eee5] border border-[#e6dfd3] rounded-md p-4 text-center my-6"
      style={{
        backgroundColor: EMAIL_THEME.colors.muted,
        border: `1px solid ${EMAIL_THEME.colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center',
        margin: '24px 0',
      }}
    >
      <Text
        className="text-xs uppercase tracking-wider text-[#616e74] font-medium m-0"
        style={{
          color: EMAIL_THEME.colors.mutedForeground,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: 0,
        }}
      >
        Váš kód pozvánky
      </Text>
      <Text
        className="text-2xl font-mono font-bold tracking-widest text-[#1c2628] m-0 mt-1"
        style={{
          color: EMAIL_THEME.colors.foreground,
          fontSize: '24px',
          fontFamily: 'monospace',
          fontWeight: 700,
          letterSpacing: '0.1em',
          margin: '4px 0 0 0',
        }}
      >
        {code}
      </Text>
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
      Pokud tlačítko nefunguje, zkopírujte a vložte následující odkaz do svého prohlížeče:
    </Text>
    <Text
      className="text-[#c2410c] text-sm break-all m-0"
      style={{
        color: EMAIL_THEME.colors.primary,
        fontSize: '14px',
        wordBreak: 'break-all',
        margin: 0,
      }}
    >
      <Link
        href={url}
        className="text-[#c2410c] underline"
        style={{ color: EMAIL_THEME.colors.primary, textDecoration: 'underline' }}
      >
        {url}
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
      Pozvánka je platná po dobu 7 dní. Pokud jste tuto pozvánku nečekali, můžete tento e-mail bez obav ignorovat.
    </Text>
  </EmailLayout>
);

export default InviteClient;
