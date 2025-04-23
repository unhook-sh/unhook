import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { CloseWindowButton } from './_components/close-window-button';

export default function CliTokenSuccessPage() {
  return (
    <main className="container grid min-h-screen place-items-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Successfully logged into the CLI</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div>You can now close this page.</div>
            <CloseWindowButton />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
