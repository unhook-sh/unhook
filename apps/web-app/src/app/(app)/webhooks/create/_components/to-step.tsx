import { Input } from '@unhook/ui/components/input';
import { Label } from '@unhook/ui/components/label';
import { H4, P } from '@unhook/ui/custom/typography';

interface ToStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function ToStep({ value, onChange }: ToStepProps) {
  return (
    <div className="space-y-2">
      <H4>Webhook Destination</H4>
      <P>
        Where should we deliver your webhooks? This is typically your local
        development server.
      </P>
      <div className="space-y-1">
        <Label htmlFor="to">Local Server URL</Label>
        <Input
          id="to"
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., http://localhost:3000/api/webhooks"
          value={value}
        />
      </div>
    </div>
  );
}
