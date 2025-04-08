'use client';

import { MoreHorizontal, Play, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@unhook/ui/components/badge';
import { Button } from '@unhook/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@unhook/ui/components/dropdown-menu';
import { Skeleton } from '@unhook/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/components/table';
import { formatDistanceToNow } from 'date-fns';
import type { Tunnel } from '~/types/tunnel';
import { DeleteTunnelDialog } from './delete-tunnel-dialog';

interface TunnelListProps {
  tunnels: Tunnel[];
  isLoading: boolean;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TunnelList({
  tunnels,
  isLoading,
  onStart,
  onStop,
  onDelete,
}: TunnelListProps) {
  const [tunnelToDelete, setTunnelToDelete] = useState<Tunnel | null>(null);

  const handleDelete = (tunnel: Tunnel) => {
    setTunnelToDelete(tunnel);
  };

  const confirmDelete = () => {
    if (tunnelToDelete) {
      onDelete(tunnelToDelete.id);
      setTunnelToDelete(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Tunnel ID</TableHead>
            <TableHead>Forwarding Address</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [
              'skeleton-1',
              'skeleton-2',
              'skeleton-3',
              'skeleton-4',
              'skeleton-5',
            ].map((index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-5 w-[180px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))
          ) : tunnels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No tunnels found. Create your first tunnel to get started.
              </TableCell>
            </TableRow>
          ) : (
            tunnels.map((tunnel) => (
              <TableRow key={tunnel.id}>
                <TableCell className="font-mono text-xs">{tunnel.id}</TableCell>
                <TableCell className="font-mono text-xs">
                  {tunnel.forwardingAddress}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(tunnel.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tunnel.status === 'active' ? 'default' : 'secondary'
                    }
                    className={
                      tunnel.status === 'active'
                        ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-500'
                        : ''
                    }
                  >
                    {tunnel.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {tunnel.status === 'active' ? (
                        <DropdownMenuItem onClick={() => onStop(tunnel.id)}>
                          <Square className="mr-2 h-4 w-4" />
                          Stop Tunnel
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onStart(tunnel.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Start Tunnel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(tunnel)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Tunnel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <DeleteTunnelDialog
        open={!!tunnelToDelete}
        onOpenChange={(open) => !open && setTunnelToDelete(null)}
        tunnel={tunnelToDelete}
        onConfirm={confirmDelete}
      />
    </>
  );
}
