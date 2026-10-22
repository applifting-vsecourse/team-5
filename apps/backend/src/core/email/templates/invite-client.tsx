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

export interface InviteClientProps {
  trainerName: string;
  code: string;
  url: string;
  isExistingUser?: boolean;
}

export const InviteClient = ({
  trainerName,
  code,
  url,
  isExistingUser = false,
}: InviteClientProps): React.JSX.Element => (
  <Html>
    <Tailwind>
      <Head />
      <Preview>Pozvánka do TrainLoopu od trenéra {trainerName}</Preview>
      <Body className="bg-gray-50 font-sans py-10 px-4">
        <Container className="bg-white rounded-lg mx-auto p-6 sm:p-8 max-w-xl w-full">
          <Heading className="text-2xl font-bold text-gray-900 m-0">
            Pozvánka do TrainLoopu
          </Heading>
          <Text className="text-gray-700 text-base leading-6 mt-4">
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
          <Text className="text-gray-700 text-base leading-6">
            Díky TrainLoopu budete mít tréninkový plán a deník svého psa na jednom místě přímo propojený s vaším trenérem.
          </Text>
          <Section className="text-center my-6">
            <Button
              href={url}
              className="bg-yellow-400 text-gray-900 font-semibold rounded-md px-6 py-3 text-center inline-block"
            >
              {isExistingUser ? 'Přihlásit se a přijmout pozvánku' : 'Přijmout pozvánku'}
            </Button>
          </Section>
          <Section className="bg-gray-100 rounded-md p-4 text-center my-6">
            <Text className="text-xs uppercase tracking-wider text-gray-500 m-0">
              Váš kód pozvánky
            </Text>
            <Text className="text-2xl font-mono font-bold tracking-widest text-gray-900 m-0 mt-1">
              {code}
            </Text>
          </Section>
          <Text className="text-gray-600 text-sm leading-5">
            Pokud tlačítko nefunguje, zkopírujte a vložte následující odkaz do svého prohlížeče:
          </Text>
          <Text className="text-blue-600 text-sm break-all">{url}</Text>
          <Hr className="border-gray-200 my-6" />
          <Text className="text-gray-400 text-xs">
            Pozvánka je platná po dobu 14 dní. Pokud jste tuto pozvánku nečekali, můžete tento e-mail bez obav ignorovat.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default InviteClient;

