import * as React from 'react';
import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';

export interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const EMAIL_THEME = {
  colors: {
    background: '#faf8f5',
    foreground: '#1c2628',
    card: '#ffffff',
    primary: '#c2410c',
    primaryForeground: '#ffffff',
    muted: '#f2eee5',
    mutedForeground: '#616e74',
    border: '#e6dfd3',
  },
  fontFamily:
    '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export const EmailLayout = ({
  preview,
  children,
}: EmailLayoutProps): React.JSX.Element => (
  <Html lang="cs">
    <Tailwind>
      <Head>
        <Font
          fontFamily="Plus Jakarta Sans"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsDxUx3063F-5UOU8.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        className="bg-[#faf8f5] font-sans py-10 px-4 m-0"
        style={{
          backgroundColor: EMAIL_THEME.colors.background,
          fontFamily: EMAIL_THEME.fontFamily,
        }}
      >
        <Container
          className="mx-auto max-w-xl w-full"
          style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}
        >
          {/* Header with TrainLoop brand mark */}
          <Section
            className="text-center pt-2 pb-6"
            style={{ textAlign: 'center', paddingTop: '8px', paddingBottom: '24px' }}
          >
            <Text
              className="text-2xl font-bold tracking-tight text-[#1c2628] m-0"
              style={{
                color: EMAIL_THEME.colors.foreground,
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                margin: 0,
              }}
            >
              Train<span style={{ color: EMAIL_THEME.colors.primary }}>Loop</span>
            </Text>
          </Section>

          {/* Main Card */}
          <Section
            className="bg-white rounded-lg border border-[#e6dfd3] p-6 sm:p-8"
            style={{
              backgroundColor: EMAIL_THEME.colors.card,
              borderRadius: '10px',
              border: `1px solid ${EMAIL_THEME.colors.border}`,
              padding: '32px',
            }}
          >
            {children}
          </Section>

          {/* Footer outside the card */}
          <Section
            className="text-center mt-6"
            style={{ textAlign: 'center', marginTop: '24px' }}
          >
            <Text
              className="text-[#616e74] text-xs m-0"
              style={{ color: EMAIL_THEME.colors.mutedForeground, fontSize: '12px', margin: 0 }}
            >
              TrainLoop · Tréninkový deník psa
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default EmailLayout;

