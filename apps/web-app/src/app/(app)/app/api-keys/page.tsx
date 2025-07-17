import { H1, P } from '@unhook/ui/custom/typography';
import { ApiKeysTable } from './_components/api-keys-table';
import { CreateApiKeyDialog } from './_components/create-api-key-dialog';

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <H1>API Keys</H1>
          <P variant="muted">
            Create an API key to use Unhook in your applications.
          </P>
        </div>
        <CreateApiKeyDialog />
      </div>

      <ApiKeysTable />
    </div>
  );
}
