import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { CliTokenContent } from './_components/cli-token-content';

export default function CliTokenPage() {
  return (
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
  );
}
