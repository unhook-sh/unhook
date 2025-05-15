import { getApi } from '@unhook/api/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { CliLoginButton } from './_components/cli-login-button';

export default async function CliTokenPage() {
  // TODO: Add a button to switch organizations
  const api = await getApi();
  void api.webhooks.all.prefetch();

  return (
    <main className="container grid min-h-screen place-items-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Login to CLI</CardTitle>
            <CardDescription>
              Select a webhook and click the button below to authenticate with
              our CLI tool.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <WebhookSelectorProvider /> */}
            <CliLoginButton />
          </CardContent>
          <CardFooter>
            <span className="text-sm text-muted-foreground">
              This will generate a secure token valid for 30 days.
            </span>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
