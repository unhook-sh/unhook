import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import Image from 'next/image';
import { CliTokenContent } from './_components/cli-token-content';

export default async function CliTokenPage() {
  return (
    <main className="container grid min-h-screen place-items-center mx-auto">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex items-center flex-col">
          <Image
            src="/logo.svg"
            alt="Unhook Logo"
            width={120}
            height={40}
            priority
            className="h-32 w-auto"
          />
          <div className="text-2xl font-bold">Unhook</div>
        </div>
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
      </div>
    </main>
  );
}
