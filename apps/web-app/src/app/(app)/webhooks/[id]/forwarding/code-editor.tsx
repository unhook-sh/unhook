'use client';

import { Textarea } from '@unhook/ui/textarea';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  disabled?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  placeholder,
  height = '200px',
  disabled,
}: CodeEditorProps) {
  return (
    <Textarea
      className="font-mono text-sm"
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ height, minHeight: height }}
      value={value}
    />
  );
}
