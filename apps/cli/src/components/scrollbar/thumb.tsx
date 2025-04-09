import { Text } from 'ink';

interface ThumbProps {
  thumbCharacter?: string;
  show?: boolean;
}

export function Thumb({ thumbCharacter = '┃', show = false }: ThumbProps) {
  if (!show) {
    return <Text> </Text>;
  }

  return <Text>{thumbCharacter}</Text>;
}
