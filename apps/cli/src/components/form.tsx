import { Box, Text, useFocusManager } from 'ink';
import {
  type FC,
  type ReactNode,
  createContext,
  useContext,
  useState,
} from 'react';
import { z } from 'zod';
import { TextInput } from './text-input';

type ZodSchema = z.ZodObject<{
  [key: string]: z.ZodTypeAny;
}>;

interface FormContextType<T extends ZodSchema> {
  registerInput: (id: string) => void;
  unregisterInput: (id: string) => void;
  getNextInput: (currentId: string) => string | undefined;
  setValue: (id: string, value: string) => void;
  getValue: (id: string) => string;
  onSubmit: (values: z.infer<T>) => void;
  getAllValues: () => Record<string, string>;
  validate: () => { success: boolean; error?: z.ZodError };
  validateInput: (id: string) => boolean;
  activeInput: string | null;
  setActiveInput: (id: string | null) => void;
  isInputActive: (id: string) => boolean;
  isInputComplete: (id: string) => boolean;
  markInputComplete: (id: string) => void;
  getError: (id: string) => string | undefined;
  setError: (id: string, error: string | undefined) => void;
}

const FormContext = createContext<FormContextType<ZodSchema> | null>(null);

interface FormProviderProps<T extends ZodSchema> {
  children: ReactNode;
  onSubmit: (values: z.infer<T>) => void;
  schema: T;
  initialValues?: Partial<z.infer<T>>;
}

export function FormProvider<T extends ZodSchema>({
  children,
  onSubmit,
  schema,
  initialValues = {},
}: FormProviderProps<T>) {
  const [inputs, setInputs] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    // Convert initialValues to string values
    const stringValues: Record<string, string> = {};
    for (const [key, value] of Object.entries(initialValues)) {
      if (value !== undefined && value !== null) {
        stringValues[key] = String(value);
      }
    }
    return stringValues;
  });
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [completedInputs, setCompletedInputs] = useState<Set<string>>(
    new Set(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { focus } = useFocusManager();

  const registerInput = (id: string) => {
    setInputs((prev) => {
      const newInputs = [...prev, id];
      if (newInputs.length === 1) {
        setActiveInput(id);
        focus(id);
      }
      return newInputs;
    });
  };

  const unregisterInput = (id: string) => {
    setInputs((prev) => prev.filter((inputId) => inputId !== id));
  };

  const getNextInput = (currentId: string) => {
    const currentIndex = inputs.indexOf(currentId);
    return inputs[currentIndex + 1];
  };

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    // Clear error when value changes
    setError(id, undefined);
  };

  const getValue = (id: string) => values[id] || '';

  const getAllValues = () => values;

  const validate = () => {
    try {
      schema.parse(values);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Map Zod errors to input IDs
        const newErrors: Record<string, string> = {};
        for (const err of error.errors) {
          const path = err.path[0];
          if (typeof path === 'string') {
            newErrors[path] = err.message;
          }
        }
        setErrors(newErrors);
        return { success: false, error };
      }
      throw error;
    }
  };

  const validateInput = (id: string) => {
    try {
      // Create a partial schema that only includes the current input
      const fieldSchema = schema.shape[id];
      if (!fieldSchema) {
        return true; // Skip validation if field not in schema
      }
      const partialSchema = z.object({ [id]: fieldSchema });
      const partialValues = { [id]: values[id] };
      partialSchema.parse(partialValues);
      setError(id, undefined);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message;
        if (message) {
          setError(id, message);
        }
        return false;
      }
      throw error;
    }
  };

  const isInputActive = (id: string) => activeInput === id;
  const isInputComplete = (id: string) => completedInputs.has(id);
  const markInputComplete = (id: string) => {
    setCompletedInputs((prev) => new Set([...prev, id]));
  };

  const getError = (id: string) => errors[id];
  const setError = (id: string, error: string | undefined) => {
    setErrors((prev) => {
      if (error === undefined) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: error };
    });
  };

  return (
    <FormContext.Provider
      value={{
        registerInput,
        unregisterInput,
        getNextInput,
        setValue,
        getValue,
        onSubmit,
        getAllValues,
        validate,
        validateInput,
        activeInput,
        setActiveInput,
        isInputActive,
        isInputComplete,
        markInputComplete,
        getError,
        setError,
      }}
    >
      <Box flexDirection="column">{children}</Box>
    </FormContext.Provider>
  );
}

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
  } = context;

  const { focus } = useFocusManager();

  useState(() => {
    registerInput(id);
    // Set default value if provided and no value exists yet
    if (defaultValue && !getValue(id)) {
      setValue(id, defaultValue);
    }
    return () => unregisterInput(id);
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

  if (!shouldShow) {
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
