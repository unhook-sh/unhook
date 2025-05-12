import { Input } from '@unhook/ui/components/input';
import { Label } from '@unhook/ui/components/label';
import { H4, P } from '@unhook/ui/custom/typography';

interface FromStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function FromStep({ value, onChange }: FromStepProps) {
  return (
    <div className="space-y-2">
      <H4>Webhook Source</H4>
      <P>
        Where will your webhooks be coming from? This could be a service like
        Stripe, GitHub, or your own custom endpoint.
      </P>
      <div className="space-y-1">
        <Label htmlFor="from">Source URL or Service</Label>
        <Input
          id="from"
          placeholder="e.g., https://api.stripe.com/webhooks or Stripe"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
