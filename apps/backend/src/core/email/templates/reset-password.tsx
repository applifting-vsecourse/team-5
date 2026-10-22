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

export interface ResetPasswordProps {
  username: string;
  url: string;
}

export const ResetPassword = ({
  username,
  url,
}: ResetPasswordProps): React.JSX.Element => (
  <Html>
    <Tailwind>
      <Head />
      <Preview>Obnovte si heslo pro TrainLoop</Preview>
      <Body className="bg-gray-50 font-sans py-10 px-4">
        <Container className="bg-white rounded-lg mx-auto p-6 sm:p-8 max-w-xl w-full">
          <Heading className="text-2xl font-bold text-gray-900 m-0">
            Obnova hesla
          </Heading>
          <Text className="text-gray-700 text-base leading-6 mt-4">
            Dobrý den {username}, obdrželi jsme žádost o obnovení hesla k vašemu účtu TrainLoop. Kliknutím na tlačítko níže si zvolte nové heslo.
          </Text>
          <Section className="text-center my-8">
            <Button
              href={url}
              className="bg-yellow-400 text-gray-900 font-semibold rounded-md px-6 py-3 text-center inline-block"
            >
              Obnovit heslo
            </Button>
          </Section>
          <Text className="text-gray-600 text-sm leading-5">
            Pokud tlačítko nefunguje, zkopírujte a vložte následující odkaz do svého prohlížeče:
          </Text>
          <Text className="text-blue-600 text-sm break-all">{url}</Text>
          <Hr className="border-gray-200 my-6" />
          <Text className="text-gray-400 text-xs">
            Pokud jste o obnovu hesla nežádali, můžete tento e-mail bez obav ignorovat – vaše heslo zůstane beze změny.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default ResetPassword;
