import { Alert, AlertDescription } from '@unhook/ui/components/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/components/card';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import {
  Code,
  H2,
  H3,
  List,
  ListItem,
  P,
  Text,
} from '@unhook/ui/custom/typography';

const WEBHOOK_URL = 'https://unhook.sh/t_123?e=api/webhooks/stripe';

const configExample = `module.exports = {
  port: 3000,
  webhookId: 'your-webhook-id',
  debug: false,
  // Add other configuration options
}`;

const advancedConfigExample = `module.exports = {
  port: 3000,
  webhookId: 'your-webhook-id',
  config: {
    storage: {
      storeHeaders: true,
      storeRequestBody: true,
      storeResponseBody: true,
      maxRequestBodySize: 1024 * 1024, // 1MB
      maxResponseBodySize: 1024 * 1024, // 1MB
    },
    headers: {
      allowList: ['x-request-id', 'content-type'],
      blockList: ['cookie'],
      sensitiveHeaders: ['authorization'],
    },
    requests: {
      allowedMethods: ['POST'],
      allowedFrom: ['.*'],
      blockedFrom: ['/admin'],
      maxRequestsPerMinute: 100,
      maxRetries: 3,
    },
  },
}`;

export default function WebhooksCreatePage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <H2>Webhook Proxy URL</H2>
          </CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <input
                className="w-full font-mono text-base bg-muted rounded px-3 py-2 border border-input"
                value={WEBHOOK_URL}
                readOnly
                aria-label="Webhook Proxy URL"
              />
              <CopyButton text={WEBHOOK_URL} size="sm" variant="outline" />
            </div>
            <div className="mt-2">
              <Alert>
                <AlertDescription>
                  Use this URL in your webhook provider settings. You can share
                  this with your team—Unhook will route webhooks to the right
                  developer automatically.
                </AlertDescription>
              </Alert>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <H3>Use the CLI</H3>
            <List>
              <ListItem>
                <P>Install the Unhook CLI globally:</P>
                <Code>$ npm install -g @unhook/cli</Code>
              </ListItem>
              <ListItem>
                <P>Start the webhook tunnel to your local server:</P>
                <Code>$ unhook</Code>
              </ListItem>
              <ListItem>
                <P>For help and options:</P>
                <Code>$ unhook --help</Code>
              </ListItem>
            </List>
          </section>
          <section>
            <H3>Configure Your Webhook Provider</H3>
            <P>
              Paste the Webhook Proxy URL above into your provider's webhook
              settings. Example endpoints:
            </P>
            <List>
              <ListItem>
                <P>Stripe:</P>
                <Code>https://unhook.sh/t_123?e=api/webhooks/stripe</Code>
              </ListItem>
              <ListItem>
                <P>GitHub:</P>
                <Code>https://unhook.sh/t_123?e=api/webhooks/github</Code>
              </ListItem>
              <ListItem>
                <P>Custom endpoint:</P>
                <Code>https://unhook.sh/t_123?e=api/webhooks/custom</Code>
              </ListItem>
            </List>
          </section>
          <section>
            <H3>Configuration File</H3>
            <P>
              Create an <Code>unhook.config.js</Code> file in your project root
              to customize your setup:
            </P>
            <Code>{configExample}</Code>
          </section>
          <section>
            <H3>Advanced Webhook Config</H3>
            <P>
              Unhook supports advanced options for storage, header filtering,
              and request filtering. Example:
            </P>
            <Code>{advancedConfigExample}</Code>
            <List>
              <ListItem>
                <Text size="sm">
                  <b>storage</b>: Control what request/response data is stored
                  and size limits.
                </Text>
              </ListItem>
              <ListItem>
                <Text size="sm">
                  <b>headers</b>: Allow/block/sanitize specific headers.
                </Text>
              </ListItem>
              <ListItem>
                <Text size="sm">
                  <b>requests</b>: Restrict HTTP methods, paths, rate limits,
                  and retries.
                </Text>
              </ListItem>
            </List>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
