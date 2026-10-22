import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';
import * as React from 'react';

export interface VerifyEmailProps {
  url: string;
}

export const VerifyEmail = ({ url }: VerifyEmailProps): React.JSX.Element => (
  <Html>
    <Tailwind>
      <Head />
      <Preview>Ověřte svou e-mailovou adresu pro TrainLoop</Preview>
      <Body className="bg-gray-50 font-sans py-10 px-4">
        <Container className="bg-white rounded-lg mx-auto p-6 sm:p-8 max-w-xl w-full">
          <Heading className="text-2xl font-bold text-gray-900 m-0">
            Vítejte v TrainLoop
          </Heading>
          <Text className="text-gray-700 text-base leading-6 mt-4">
            Klepnutím na tlačítko níže ověřte svou e-mailovou adresu a dokončete nastavení svého účtu.
          </Text>
          <Section className="text-center my-8">
            <Button
              href={url}
              className="bg-yellow-400 text-gray-900 font-semibold rounded-md px-6 py-3 text-center inline-block"
            >
              Ověřit e-mail
            </Button>
          </Section>
          <Text className="text-gray-600 text-sm leading-5">
            Pokud tlačítko nefunguje, zkopírujte a vložte následující odkaz do svého prohlížeče:
          </Text>
          <Text className="text-blue-600 text-sm break-all">{url}</Text>
          <Hr className="border-gray-200 my-6" />
          <Text className="text-gray-400 text-xs">
            Pokud jste si účet v TrainLoop nevytvořili, můžete tento e-mail bez obav ignorovat.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default VerifyEmail;
