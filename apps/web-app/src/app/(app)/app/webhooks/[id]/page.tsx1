import { WebhookDetailView } from '~/app/(app)/app/_components/webhooks/webhook-detail-view';

interface WebhookDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WebhookDetailPage({
  params,
}: WebhookDetailPageProps) {
  'use cache';
  const id = (await params).id;
  return <WebhookDetailView id={id} />;
}
