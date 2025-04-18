import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';

export default function CliTokenSuccessPage() {
  return (
    <main className="container grid min-h-screen place-items-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Successfully logged into the CLI</CardTitle>
          </CardHeader>
          <CardContent>You can now close this page.</CardContent>
        </Card>
      </div>
    </main>
  );
}
