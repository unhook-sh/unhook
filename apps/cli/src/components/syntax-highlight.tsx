import { highlight, type Theme } from 'cli-highlight';
import { Text } from 'ink';
import * as React from 'react';

export interface Props {
  readonly code: string;
  readonly language?: string;
  readonly theme?: Theme;
}

export const SyntaxHighlight: React.FC<Props> = ({ code, language, theme }) => {
  const highlightedCode = React.useMemo(() => {
    return highlight(code, { language, theme });
  }, [code, language, theme]);

  return <Text>{highlightedCode}</Text>;
};
