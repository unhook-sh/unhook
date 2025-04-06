import type { ForegroundColorName } from 'chalk';
import figlet from 'figlet';
import { Text } from 'ink';
import type { LiteralUnion } from 'type-fest';

type AsciiProps = {
  font?: figlet.Fonts;
  horizontalLayout?: figlet.KerningMethods;
  verticalLayout?: figlet.KerningMethods;
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
    width,
    horizontalLayout,
    verticalLayout,
  });

  return <Text color={color}>{ascii}</Text>;
};
