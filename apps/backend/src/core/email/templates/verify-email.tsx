import * as React from 'react';
import { Button, Heading, Hr, Link, Section, Text } from 'react-email';
import {
  EMAIL_THEME,
  EmailLayout,
} from './components/email-layout';

export interface VerifyEmailProps {
  url: string;
}

export const VerifyEmail = ({
  url = 'https://trainloop.app/verify-email?token=xyz-789',
}: VerifyEmailProps): React.JSX.Element => (
  <EmailLayout preview="Ověřte svou e-mailovou adresu pro TrainLoop">
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
      Vítejte v TrainLoop
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
      Klepnutím na tlačítko níže ověřte svou e-mailovou adresu a dokončete nastavení svého účtu.
    </Text>
    <Section
      className="text-center my-8"
      style={{ textAlign: 'center', margin: '32px 0' }}
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
        Ověřit e-mail
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
      Pokud jste si účet v TrainLoop nevytvořili, můžete tento e-mail bez obav ignorovat.
    </Text>
  </EmailLayout>
);

export default VerifyEmail;
