import type { VariantProps } from 'class-variance-authority';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Button, type buttonVariants } from '../components/button';
import { Input } from '../components/input';

interface TextInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
  onChange?: (value: string) => void;
  quickFillValues?: string[];
  variant?: VariantProps<typeof buttonVariants>['variant'];
}

export const TextInput: React.FC<TextInputProps> = ({
  onChange,
  quickFillValues,
  variant,
  ...props
}) => {
  const [value, setValue] = useState<string>('');

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (props.value !== undefined) {
      handleChange(props.value.toString());
    }
  }, [props.value, handleChange]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(event.target.value);
  };

  const handleQuickFill = (fillValue: string) => {
    setValue(fillValue);
    if (onChange) {
      onChange(fillValue);
    }
  };

  return (
    <div className="w-full">
      <Input
        {...props}
        onChange={handleInputChange}
        onFocus={(event) => event.target.select()}
        type="text"
        value={value}
      />
      {quickFillValues && quickFillValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {quickFillValues.map((value) => (
            <Button
              key={`quick-fill-${value.toString()}`}
              onClick={() => handleQuickFill(value)}
              size="sm"
              type="button"
              variant={variant ?? 'outline'}
            >
              {value}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
