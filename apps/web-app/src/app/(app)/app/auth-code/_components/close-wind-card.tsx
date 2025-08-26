import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { CloseWindowButton } from './close-window-button';

export function CloseWindowCard() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle>Successfully logged</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div>You can now close this page.</div>
        <CloseWindowButton />
      </CardContent>
    </Card>
  );
}
