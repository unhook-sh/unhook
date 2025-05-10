import type { PropsWithChildren } from 'react';
import { AppLayout } from '~/app/(app)/_components/app-layout';

export default function WebhooksLayout(props: PropsWithChildren) {
  return <AppLayout>{props.children}</AppLayout>;
}
