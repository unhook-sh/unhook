import { Box, Text } from 'ink';
import { type FC, type ReactNode, useContext } from 'react';
import { FormContext } from './form';

interface FormDescriptionProps {
  id: string;
  children: ReactNode;
}

export const FormDescription: FC<FormDescriptionProps> = ({ id, children }) => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('FormDescription must be used within a FormProvider');
  }

  const { isInputActive, isInputComplete } = context;
  const shouldShow = isInputActive(id) || isInputComplete(id);

  if (!shouldShow) {
    return null;
  }

  return (
    <Box>
      <Text dimColor>{children}</Text>
    </Box>
  );
};
