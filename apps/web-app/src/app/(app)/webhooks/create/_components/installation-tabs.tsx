import { Alert, AlertDescription } from '@unhook/ui/components/alert';
import { Label } from '@unhook/ui/components/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@unhook/ui/components/tabs';
import { Textarea } from '@unhook/ui/components/textarea';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Icons } from '@unhook/ui/custom/icons';

interface InstallationTabsProps {
  authCode: string;
  webhookId: string;
  source: string;
}

export function InstallationTabs({
  authCode,
  webhookId,
  source,
}: InstallationTabsProps) {
  const cliCommand = `npx @unhook/cli init --webhook ${webhookId}${
    source ? ` --source ${source}` : ''
  } --code ${authCode}`;

  return (
    <div className="space-y-2">
      <Label>Installation</Label>
      <Tabs defaultValue="cli" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cli">
            <Icons.ChevronsLeftRightEllipsis className="mr-2 h-4 w-4" />
            CLI
          </TabsTrigger>
          <TabsTrigger value="vscode">
            <Icons.FunctionSquare className="mr-2 h-4 w-4" />
            VS Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cli" className="space-y-2 mt-4">
          <div className="flex gap-2">
            <Textarea
              value={cliCommand}
              readOnly
              className="font-mono text-sm resize-none"
              rows={1}
            />
            <CopyButton text={cliCommand} variant="outline" />
          </div>
          <Alert>
            <AlertDescription>
              Run this command in your terminal to install the Unhook CLI and
              start receiving webhooks.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="vscode" className="space-y-4 mt-4">
          <Alert>
            <AlertDescription>
              Install the Unhook VS Code extension to receive webhooks directly
              in your editor.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Icons.FunctionSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Open VS Code</p>
                <p className="text-xs text-muted-foreground">
                  Launch Visual Studio Code on your machine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <span className="text-sm font-medium text-blue-500">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Open Extensions</p>
                <p className="text-xs text-muted-foreground">
                  Press{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    Cmd+Shift+X
                  </code>{' '}
                  (Mac) or{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    Ctrl+Shift+X
                  </code>{' '}
                  (Windows/Linux)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <span className="text-sm font-medium text-blue-500">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Search for "Unhook"</p>
                <p className="text-xs text-muted-foreground">
                  Find and install the official Unhook extension
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <span className="text-sm font-medium text-blue-500">4</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Configure the extension</p>
                <p className="text-xs text-muted-foreground">
                  Use webhook ID:{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    {webhookId}
                  </code>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Or install via command line:
            </p>
            <div className="flex gap-2">
              <Textarea
                value="code --install-extension unhook.unhook"
                readOnly
                className="font-mono text-sm resize-none"
                rows={1}
              />
              <CopyButton
                text="code --install-extension unhook.unhook"
                variant="outline"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
