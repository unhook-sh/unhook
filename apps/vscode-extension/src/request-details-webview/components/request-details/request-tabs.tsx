'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { useRequest } from './request-context';
import { RequestDetailsTab } from './request-details-tab';
import { RequestPayloadTab } from './request-payload-tab';
import { ResponseHeadersTab } from './response-headers-tab';
import { ResponseTab } from './response-tab';

export function RequestTabs() {
  const { payload, responseBody, responseHeaders } = useRequest();

  return (
    <Tabs defaultValue="response">
      <TabsList>
        <TabsTrigger value="response">Response</TabsTrigger>
        <TabsTrigger value="headers">Headers</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="payload">Request Payload</TabsTrigger>
      </TabsList>

      <TabsContent className="mt-4" value="response">
        <ResponseTab responseBody={responseBody} />
      </TabsContent>

      <TabsContent className="mt-4" value="headers">
        <ResponseHeadersTab headers={responseHeaders} />
      </TabsContent>

      <TabsContent className="mt-4" value="details">
        <RequestDetailsTab />
      </TabsContent>

      <TabsContent className="mt-4" value="payload">
        <RequestPayloadTab payload={payload} />
      </TabsContent>
    </Tabs>
  );
}
