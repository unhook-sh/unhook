import { Box, Text, useFocusManager } from 'ink';
import { type FC, useContext, useState } from 'react';
import { TextInput } from '../text-input';
import { FormContext } from './form';

interface FormInputProps {
  id: string;
  placeholder?: string;
  mask?: string;
  showCursor?: boolean;
  highlightPastedText?: boolean;
  defaultValue?: string;
}

export const FormInput: FC<FormInputProps> = ({
  id,
  placeholder,
  mask,
  showCursor = true,
  highlightPastedText = false,
  defaultValue,
}) => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('FormInput must be used within a FormProvider');
  }

  const {
    registerInput,
    unregisterInput,
    setInputAvailable,
    getNextInput,
    setValue,
    getValue,
    onSubmit,
    getAllValues,
    validate,
    validateInput,
    setActiveInput,
    isInputActive,
    isInputComplete,
    markInputComplete,
    getError,
    isInputAvailable,
  } = context;

  const { focus } = useFocusManager();

  useState(() => {
    registerInput(id);
    // Set default value if provided and no value exists yet
    if (defaultValue && !getValue(id)) {
      setValue(id, defaultValue);
    }
    setInputAvailable(id, true);
    return () => {
      setInputAvailable(id, false);
      unregisterInput(id);
    };
  });

  const handleSubmit = (value: string) => {
    setValue(id, value);

    if (validateInput(id)) {
      markInputComplete(id);
      const nextInput = getNextInput(id);
      if (nextInput) {
        setActiveInput(nextInput);
        focus(nextInput);
      } else {
        // On last input, validate the entire form
        const validation = validate();
        if (validation.success) {
          onSubmit(getAllValues());
        }
      }
    }
  };

  const shouldShow = isInputActive(id) || isInputComplete(id);

  if (!shouldShow || !isInputAvailable(id)) {
    return null;
  }

  if (isInputComplete(id)) {
    return (
      <Box>
        <Text>{mask ? mask.repeat(getValue(id).length) : getValue(id)}</Text>
      </Box>
    );
  }

  const error = getError(id);

  return (
    <Box flexDirection="column">
      <TextInput
        value={getValue(id)}
        onChange={(value) => setValue(id, value)}
        onSubmit={handleSubmit}
        placeholder={placeholder}
        mask={mask}
        showCursor={showCursor}
        highlightPastedText={highlightPastedText}
        focus={isInputActive(id)}
      />
      {error && (
        <Box>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
};
