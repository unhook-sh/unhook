'use client';

import { useClerk } from '@clerk/nextjs';
import { Button } from '@unhook/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { useSearchParams } from 'next/navigation';
import { CliTokenContent } from './_components/cli-token-content';

export default function CliTokenPage() {
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();
  const redirectUrl = `/cli-token${currentQueryString ? `?${currentQueryString}` : ''}`;

  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle>Login to CLI</CardTitle>
          <CardDescription>
            Select or create an organization, then click the button below to
            authenticate with the Unhook CLI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CliTokenContent />
        </CardContent>
      </Card>
      <Button
        variant="link"
        onClick={() =>
          signOut({
            redirectUrl,
          })
        }
        className="w-fit"
      >
        Sign in with different account
      </Button>
    </div>
  );
}
