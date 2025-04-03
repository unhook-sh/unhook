'use client';
import { api } from '@acme/api/client';
import { Badge } from '@acme/ui/badge';
import { Button } from '@acme/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@acme/ui/card';
import { Icons } from '@acme/ui/custom/icons';
import { P } from '@acme/ui/custom/typography';
import { toast } from '@acme/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';

export function TunnelsList() {
  const { data: tunnels = [] } = api.tunnels.all.useQuery();
  const { mutateAsync: deleteTunnel } = api.tunnels.delete.useMutation();
  const queryClient = useQueryClient();

  if (!tunnels.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Icons.ChevronsLeftRightEllipsis size="xl" variant="muted" />
        <div className="text-center">
          <P className="text-muted-foreground">No tunnels found.</P>
          <P className="text-muted-foreground">
            Create a tunnel to get started.
          </P>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tunnels.map((tunnel) => (
        <Card key={tunnel.id}>
          <CardHeader>
            <CardTitle>{tunnel.clientId}</CardTitle>
            <CardDescription>{tunnel.port}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={tunnel.status === 'active' ? 'default' : 'destructive'}
              >
                {tunnel.status}
              </Badge>
              <Badge variant="secondary">{tunnel.apiKey}</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <P className="text-sm text-muted-foreground">
                Last seen: {new Date(tunnel.lastSeenAt).toLocaleString()}
              </P>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await deleteTunnel({ id: tunnel.id });
                    await queryClient.invalidateQueries({
                      queryKey: ['tunnels', 'all'],
                    });
                    toast.success('Tunnel deleted', {
                      description: 'The tunnel has been deleted successfully.',
                    });
                  } catch (error) {
                    toast.error('Failed to delete tunnel', {
                      description: 'Please try again.',
                    });
                  }
                }}
              >
                <Icons.Trash size="sm" variant="destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
