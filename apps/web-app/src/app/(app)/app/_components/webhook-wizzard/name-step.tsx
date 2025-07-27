import { Input } from '@unhook/ui/input';

interface NameStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function NameStep({ value, onChange }: NameStepProps) {
  return (
    <Input
      id="name"
      onChange={(e) => onChange(e.target.value)}
      placeholder="e.g. Prod, Staging, etc."
      value={value}
    />
  );
}
