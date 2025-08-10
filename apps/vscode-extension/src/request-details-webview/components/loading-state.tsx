import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';

export function LoadingState() {
  return (
    <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="py-10">
          <div className="flex flex-col items-center gap-3">
            <Icons.Spinner size="lg" variant="primary" />
            <p className="text-sm text-muted-foreground">
              Loading request panel…
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
