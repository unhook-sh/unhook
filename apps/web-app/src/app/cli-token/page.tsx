import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { CliLoginButton } from './_components/cli-login-button';

export default function CliTokenPage() {
  // TODO: Add a button to switch organizations
  return (
    <main className="container grid min-h-screen place-items-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Login to CLI</CardTitle>
            <CardDescription>
              Click the button below to authenticate with our CLI tool.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
