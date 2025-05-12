import { Button } from '@unhook/ui/components/button';
import { Card } from '@unhook/ui/components/card';
import { Label } from '@unhook/ui/components/label';
import { Switch } from '@unhook/ui/components/switch';
import { Icons } from '@unhook/ui/custom/icons';

interface PrivateStepProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function PrivateStep({ value, onChange }: PrivateStepProps) {
  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Private Webhook</Label>
          <p className="text-sm text-muted-foreground">
            Private webhooks require an API key for authentication
          </p>
        </div>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>

      {value && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <Icons.Key className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Upgrade Required</p>
              <p className="text-sm text-muted-foreground">
                Private webhooks are available on our paid plans. Upgrade to
                enable this feature.
              </p>
              <Button
                variant="default"
                size="sm"
                className="mt-2"
                onClick={handleUpgrade}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
