import { H2, P } from '@unhook/ui/custom/typography';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { CreateDestinationDialog } from './create-destination-dialog';
import { CreateForwardingRuleDialog } from './create-forwarding-rule-dialog';
import { DestinationsList } from './destinations-list';
import { ForwardingRulesList } from './forwarding-rules-list';

interface ForwardingPageProps {
  params: {
    id: string;
  };
}

export default function ForwardingPage({ params }: ForwardingPageProps) {
  const webhookId = params.id;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <H2>Webhook Forwarding</H2>
        <P className="text-muted-foreground mt-2">
          Configure rules to forward webhooks to external services like Slack,
          Discord, or custom endpoints.
        </P>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules">Forwarding Rules</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <P className="text-muted-foreground">
              Create rules to filter and transform webhooks before forwarding
              them.
            </P>
            <CreateForwardingRuleDialog webhookId={webhookId} />
          </div>
          <ForwardingRulesList webhookId={webhookId} />
        </TabsContent>

        <TabsContent value="destinations" className="space-y-4">
          <div className="flex justify-between items-center">
            <P className="text-muted-foreground">
              Manage destinations where webhooks can be forwarded.
            </P>
            <CreateDestinationDialog />
          </div>
          <DestinationsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
