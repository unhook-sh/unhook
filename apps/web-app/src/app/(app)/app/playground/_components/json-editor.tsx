'use client';

import { Badge } from '@unhook/ui/badge';
import { Icons } from '@unhook/ui/custom/icons';
import { Label } from '@unhook/ui/label';
import { Textarea } from '@unhook/ui/textarea';
import { useState } from 'react';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');

  const validateJson = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      setIsValid(true);
      setError('');
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    validateJson(newValue);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setIsValid(true);
      setError('');
    } catch (_err) {
      // Don't format if invalid
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="json-payload">JSON Payload</Label>
        <div className="flex items-center gap-2">
          {isValid ? (
            <Badge className="text-xs" variant="secondary">
              <Icons.Check className="mr-1" size="xs" />
              Valid JSON
            </Badge>
          ) : (
            <Badge className="text-xs" variant="destructive">
              <Icons.AlertTriangle className="mr-1" size="xs" />
              Invalid JSON
            </Badge>
          )}
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={formatJson}
            type="button"
          >
            Format
          </button>
        </div>
      </div>

      <Textarea
        className={`font-mono text-sm min-h-[200px] ${
          !isValid ? 'border-destructive' : ''
        }`}
        id="json-payload"
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Enter JSON payload..."
        value={value}
      />

      {!isValid && error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
