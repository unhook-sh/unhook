import { extractBody } from '@unhook/client/utils/extract-body';
import type { RequestTypeWithEventType } from '@unhook/db/schema';
import { Card, CardContent } from '@unhook/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { JsonViewer } from '../json-viewer';

export interface PayloadTabsProps {
  data: RequestTypeWithEventType;
}

export function PayloadTabs({ data }: PayloadTabsProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <Tabs className="w-full" defaultValue="request">
          <TabsList className="bg-muted border-border">
            <TabsTrigger
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              value="request"
            >
              Request Payload
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              value="response"
            >
              Response
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4" value="request">
            {data.event?.originRequest.body ? (
              <JsonViewer
                className="shadow-sm"
                data={
                  extractBody(data.event.originRequest.body) ??
                  data.event.originRequest.body
                }
                defaultExpanded={true}
                maxHeight={500}
                title="Request Body"
              />
            ) : (
              <div className="bg-muted rounded-lg p-4 border border-border">
                <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
                  No request body
                </pre>
              </div>
            )}
          </TabsContent>

          <TabsContent className="mt-4" value="response">
            {data.response?.body ? (
              <JsonViewer
                className="shadow-sm"
                data={
                  extractBody(String(data.response.body)) ?? data.response.body
                }
                defaultExpanded={false}
                maxHeight={500}
                title="Response Body"
              />
            ) : (
              <div className="bg-muted rounded-lg p-4 border border-border">
                <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
                  No response body
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
