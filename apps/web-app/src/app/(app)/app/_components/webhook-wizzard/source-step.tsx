import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';

interface FromStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function SourceStep({ value, onChange }: FromStepProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="from">Source Service (Optional)</Label>
      <Input
        id="from"
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Stripe, GitHub, Clerk, etc."
        value={value}
      />
    </div>
  );
}
