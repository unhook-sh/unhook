import { WebhookDetailView } from '~/app/(app)/_components/webhooks/webhook-detail-view';

interface WebhookDetailPageProps {
  params: {
    id: string;
  };
}

export default function WebhookDetailPage({ params }: WebhookDetailPageProps) {
  return <WebhookDetailView id={params.id} />;
}
