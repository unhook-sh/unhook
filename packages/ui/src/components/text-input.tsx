import type React from 'react'
import { useCallback, useEffect, useState } from 'react'

import type { ButtonProps } from './button'
import { Button } from './button'
import type { InputProps } from './input'
import { Input } from './input'

interface TextInputProps extends Omit<InputProps, 'onChange'> {
  onChange?: (value: string) => void
  quickFillValues?: string[]
  variant?: ButtonProps['variant']
}

export const TextInput: React.FC<TextInputProps> = ({
  onChange,
  quickFillValues,
  variant,
  ...props
}) => {
  const [value, setValue] = useState<string>('')

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue)
      if (onChange) {
        onChange(newValue)
      }
    },
    [onChange],
  )

  useEffect(() => {
    if (props.value !== undefined) {
      handleChange(props.value.toString())
    }
  }, [props.value, handleChange])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(event.target.value)
  }

  const handleQuickFill = (fillValue: string) => {
    setValue(fillValue)
    if (onChange) {
      onChange(fillValue)
    }
  }

  return (
    <div className="w-full">
      <Input
        {...props}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={(event) => event.target.select()}
      />
      {quickFillValues && quickFillValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {quickFillValues.map((value) => (
            <Button
              key={`quick-fill-${value.toString()}`}
              size="sm"
              variant={variant ?? 'outline'}
              onClick={() => handleQuickFill(value)}
              type="button"
            >
              {value}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
