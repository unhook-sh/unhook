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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="cli" className="px-2 text-xs sm:text-sm">
            <Icons.ChevronsLeftRightEllipsis className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            CLI
          </TabsTrigger>
          <TabsTrigger value="vscode" className="px-2 text-xs sm:text-sm">
            <Icons.FunctionSquare className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            VS Code
          </TabsTrigger>
          <TabsTrigger value="cursor" className="px-2 text-xs sm:text-sm">
            <Icons.Sparkles className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Cursor
          </TabsTrigger>
          <TabsTrigger value="windsurf" className="px-2 text-xs sm:text-sm">
            <Icons.FlaskConical className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Windsurf
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
                value="code --install-extension unhook.unhook-vscode"
                readOnly
                className="font-mono text-sm resize-none"
                rows={1}
              />
              <CopyButton
                text="code --install-extension unhook.unhook-vscode"
                variant="outline"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-blue-500/10 p-4">
            <p className="text-xs font-medium text-blue-600 mb-2">
              Direct links
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="vscode:extension/unhook.unhook-vscode"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Icons.Download className="h-4 w-4" />
                Install from VS Code
              </a>
              <a
                href="https://open-vsx.org/extension/unhook/unhook-vscode"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Icons.ExternalLink className="h-4 w-4" />
                View on Open VSX Registry
              </a>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cursor" className="space-y-4 mt-4">
          <Alert>
            <AlertDescription>
              Install the Unhook extension in Cursor to receive webhooks
              directly in your AI-powered editor.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Icons.Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Open Cursor</p>
                <p className="text-xs text-muted-foreground">
                  Launch Cursor IDE on your machine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <span className="text-sm font-medium text-purple-500">2</span>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <span className="text-sm font-medium text-purple-500">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Search for "Unhook"</p>
                <p className="text-xs text-muted-foreground">
                  The extension is available in Cursor's Open VSX marketplace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <span className="text-sm font-medium text-purple-500">4</span>
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
              Alternative installation methods
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                • Download the .vsix file from Open VSX and drag it into the
                Extensions panel
              </p>
              <p className="text-xs text-muted-foreground">
                • Use "Install from VSIX..." in the Extensions menu
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-purple-500/10 p-4">
            <p className="text-xs font-medium text-purple-600 mb-2">
              Direct link
            </p>
            <a
              href="https://open-vsx.org/extension/unhook/unhook-vscode"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Icons.ExternalLink className="h-4 w-4" />
              View on Open VSX Registry
            </a>
          </div>
        </TabsContent>

        <TabsContent value="windsurf" className="space-y-4 mt-4">
          <Alert>
            <AlertDescription>
              Install the Unhook extension in Windsurf to receive webhooks in
              your AI-powered editor.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                <Icons.FlaskConical className="h-5 w-5 text-teal-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Open Windsurf</p>
                <p className="text-xs text-muted-foreground">
                  Launch Windsurf IDE on your machine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                <span className="text-sm font-medium text-teal-500">2</span>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                <span className="text-sm font-medium text-teal-500">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Search for "Unhook"</p>
                <p className="text-xs text-muted-foreground">
                  The extension is available in Windsurf's Open VSX marketplace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
                <span className="text-sm font-medium text-teal-500">4</span>
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
              Alternative installation methods
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                • Download the .vsix file from Open VSX and drag it into the
                Extensions panel
              </p>
              <p className="text-xs text-muted-foreground">
                • Use "Install from VSIX..." in the Extensions menu
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-teal-500/10 p-4">
            <p className="text-xs font-medium text-teal-600 mb-2">
              Direct link
            </p>
            <a
              href="https://open-vsx.org/extension/unhook/unhook-vscode"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Icons.ExternalLink className="h-4 w-4" />
              View on Open VSX Registry
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
