import type { ForegroundColorName } from 'chalk';
import figlet from 'figlet';
import { Text } from 'ink';
import type { LiteralUnion } from 'type-fest';

type KerningMethods =
  | 'default'
  | 'full'
  | 'fitted'
  | 'controlled smushing'
  | 'universal smushing';

type AsciiProps = {
  font?: string;
  horizontalLayout?: KerningMethods;
  verticalLayout?: KerningMethods;
  text?: string;
  width?: number;
  color?: LiteralUnion<ForegroundColorName, string>;
};

export const Ascii = ({
  font = 'Slant Relief',
  horizontalLayout = 'default',
  verticalLayout = 'default',
  text = '',
  width = 80,
  color,
}: AsciiProps) => {
  const ascii = figlet.textSync(text, {
    font,
    horizontalLayout,
    verticalLayout,
    width,
  });

  return <Text color={color}>{ascii}</Text>;
};
