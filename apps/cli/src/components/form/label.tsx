import { Box, Text } from 'ink';
import { type FC, type ReactNode, useContext } from 'react';
import { FormContext } from './form';

interface FormLabelProps {
  id: string;
  children: ReactNode;
}

export const FormLabel: FC<FormLabelProps> = ({ id, children }) => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('FormLabel must be used within a FormProvider');
  }

  const { isInputActive, isInputComplete } = context;
  const shouldShow = isInputActive(id) || isInputComplete(id);

  if (!shouldShow) {
    return null;
  }

  return (
    <Box marginRight={1}>
      <Text>{children}</Text>
    </Box>
  );
};
