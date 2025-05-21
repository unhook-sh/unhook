import { Input } from '@unhook/ui/components/input';

interface NameStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function NameStep({ value, onChange }: NameStepProps) {
  return (
    <Input
      id="name"
      placeholder="e.g. Prod, Staging, etc."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
