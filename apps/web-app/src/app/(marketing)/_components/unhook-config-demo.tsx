'use client';

import { CodeBlock, CodeBlockCode } from '@unhook/ui/magicui/code-block';
import { File, Folder, Tree } from '@unhook/ui/magicui/file-tree';
import { Terminal } from '@unhook/ui/magicui/terminal';
import { useTheme } from 'next-themes';

const unhookConfigCode = `webhookId: wh_1bad2

destination:
  - name: default
    url: http://localhost:3000/api/webhooks/clerk

delivery:
  - source: clerk
    destination: default

		`;

export function UnhookConfigDemo() {
  const { theme } = useTheme();
  return (
    <Terminal className="h-full w-full min-w-full min-h-full">
      <div className="flex flex-row gap-2 h-full">
        <Tree>
          <File isSelectable={false} value="readme">
            README.md
          </File>
          <File isSelectable={false} value="package">
            package.json
          </File>
          <Folder element="src" isSelectable={false} value="src">
            <File isSelectable={false} value="index">
              index.ts
            </File>
            <File value="app">app.ts</File>
          </Folder>
          <File isSelect value="config">
            unhook.yaml
          </File>
        </Tree>
        <CodeBlock className="flex-1">
          <CodeBlockCode
            // className="h-full"
            code={unhookConfigCode}
            language="yaml"
            theme={theme === 'dark' ? 'github-dark' : 'github-light'}
          />
        </CodeBlock>
      </div>
    </Terminal>
  );
}
