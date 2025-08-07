import { Card, CardContent } from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';

export function EmptyState() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-card border-border">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="rounded-full bg-muted p-3">
            <Icons.MessageCircleQuestion
              className="text-muted-foreground"
              size="lg"
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-card-foreground">
              No Data Selected
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Select an event or request from the events view to see its details
              here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
