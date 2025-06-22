import { Box, useFocusManager } from 'ink';
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { z } from 'zod';

type ZodSchema = z.ZodObject<{
  [key: string]: z.ZodTypeAny;
}>;

export interface FormContextType<T extends ZodSchema> {
  registerInput: (id: string) => void;
  unregisterInput: (id: string) => void;
  setInputAvailable: (id: string, available: boolean) => void;
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
  isInputAvailable: (id: string) => boolean;
}

export const FormContext = createContext<FormContextType<ZodSchema> | null>(
  null,
);

export interface FormProviderProps<T extends ZodSchema> {
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
  const [availableInputs, setAvailableInputs] = useState<Set<string>>(
    new Set(),
  );
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
      if (!prev.includes(id)) {
        const newInputs = [...prev, id];
        if (newInputs.length === 1) {
          setActiveInput(id);
          focus(id);
        }
        return newInputs;
      }
      return prev;
    });
    setAvailableInputs((prev) => new Set([...prev, id]));
  };

  const unregisterInput = (id: string) => {
    setInputs((prev) => prev.filter((inputId) => inputId !== id));
    setAvailableInputs((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const setInputAvailable = (id: string, available: boolean) => {
    setAvailableInputs((prev) => {
      const next = new Set(prev);
      if (available) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const isInputAvailable = (id: string) => availableInputs.has(id);

  const getNextInput = (currentId: string) => {
    const currentIndex = inputs.indexOf(currentId);
    // Find the next available input
    for (let i = currentIndex + 1; i < inputs.length; i++) {
      const input = inputs[i];
      if (input && availableInputs.has(input)) {
        return input;
      }
    }
    return undefined;
  };

  const setValue = (id: string, value: string) => {
    setValues((prev) => {
      // Always update, even if value is the same, to force re-render and validation
      return { ...prev, [id]: value };
    });
    // Always clear error
    setError(id, undefined);
  };

  const getValue = (id: string) => values[id] || '';

  const getAllValues = useCallback(() => values, [values]);

  const validate = useCallback(() => {
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
  }, [values, schema]);

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

  useEffect(() => {
    // Only run if all registered inputs are complete and valid
    if (
      inputs.length > 0 &&
      inputs.every((id) => completedInputs.has(id)) &&
      Object.keys(errors).length === 0
    ) {
      const validation = validate();
      if (validation.success) {
        onSubmit(getAllValues());
      }
    }
    // Only run when completedInputs, errors, or inputs change
  }, [completedInputs, errors, inputs, onSubmit, getAllValues, validate]);

  return (
    <FormContext.Provider
      value={{
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
        activeInput,
        setActiveInput,
        isInputActive,
        isInputComplete,
        markInputComplete,
        getError,
        setError,
        isInputAvailable,
      }}
    >
      <Box flexDirection="column">{children}</Box>
    </FormContext.Provider>
  );
}
