import { Box, Text, useFocusManager } from 'ink';
import { useContext, useState } from 'react';
import { type MenuItem, SelectInput } from '../select-input';
import { FormContext } from './form';

interface FormSelectProps<T extends string = string> {
  id: string;
  items: MenuItem<T>[];
  defaultValue?: T;
  showHotkeys?: boolean;
  onSelect?: (item: MenuItem<T>) => void;
}

export function FormSelect<T extends string = string>({
  id,
  items,
  onSelect,
  showHotkeys,
  defaultValue,
}: FormSelectProps<T>) {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('FormSelect must be used within a FormProvider');
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

  const handleSelect = (item: MenuItem<T>) => {
    setValue(id, item.value);
    if (validateInput(id)) {
      if (onSelect) onSelect(item);
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
    const selected = items.find((item) => item.value === getValue(id));
    return (
      <Box>
        {typeof selected?.label === 'string' ? (
          <Text>{selected.label}</Text>
        ) : (
          selected?.label
        )}
      </Box>
    );
  }

  const error = getError(id);

  return (
    <Box flexDirection="column">
      <SelectInput<T>
        items={items}
        onSelect={handleSelect}
        showHotkeys={showHotkeys}
        initialIndex={
          getValue(id)
            ? items.findIndex((item) => item.value === getValue(id))
            : defaultValue
              ? items.findIndex((item) => item.value === defaultValue)
              : 0
        }
      />
      {error && (
        <Box>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
}
