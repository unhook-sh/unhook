import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';

export interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-card border-destructive">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="rounded-full bg-destructive/10 p-3">
            <Icons.AlertCircle className="text-destructive" size="lg" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error</h3>
            <p className="text-sm text-destructive mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
