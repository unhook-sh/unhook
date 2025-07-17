import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Suspense } from 'react';
import { CliTokenContent } from './_components/auth-code-content';
import { SignInDifferentAccountButton } from './_components/sign-in-different-account-button';

export default function Page() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle>Grant Access</CardTitle>
          <CardDescription>
            Select or create an organization, then click the button below to
            authenticate with Unhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CliTokenContent />
        </CardContent>
      </Card>
      <Suspense>
        <SignInDifferentAccountButton />
      </Suspense>
    </div>
  );
}
