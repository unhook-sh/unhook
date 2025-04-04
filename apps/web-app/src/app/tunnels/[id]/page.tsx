import { TunnelDetailView } from '~/components/tunnels/tunnel-detail-view';

interface TunnelDetailPageProps {
  params: {
    id: string;
  };
}

export default function TunnelDetailPage({ params }: TunnelDetailPageProps) {
  return <TunnelDetailView id={params.id} />;
}
