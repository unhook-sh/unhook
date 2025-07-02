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
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="font-mono text-sm"
      style={{ height, minHeight: height }}
    />
  );
}
