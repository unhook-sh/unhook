import { Input } from '@unhook/ui/components/input';
import { Label } from '@unhook/ui/components/label';

interface NameStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function NameStep({ value, onChange }: NameStepProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="name">Webhook Name</Label>
      <Input
        id="name"
        placeholder="Enter a name for your webhook"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
