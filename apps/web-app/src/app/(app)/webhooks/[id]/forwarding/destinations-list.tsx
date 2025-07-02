'use client';

import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { P, Text } from '@unhook/ui/custom/typography';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@unhook/ui/dropdown-menu';
import { Switch } from '@unhook/ui/switch';
import { useState } from 'react';

const DESTINATION_ICONS = {
  slack: Icons.MessageSquare,
  discord: Icons.MessageCircle,
  teams: Icons.Users,
  webhook: Icons.Globe,
  email: Icons.Mail,
} as const;

export function DestinationsList() {
  // TODO: Replace with actual data fetching
  const destinations = [
    {
      id: 'dest_1',
      name: 'Payments Slack Channel',
      type: 'slack' as const,
      config: {
        slackWebhookUrl: 'https://hooks.slack.com/...',
        slackChannel: '#payments',
      },
      isActive: true,
      createdAt: new Date('2024-01-10'),
    },
    {
      id: 'dest_2',
      name: 'Logging Service',
      type: 'webhook' as const,
      config: {
        url: 'https://api.logging.com/webhooks',
        headers: {
          'X-API-Key': '***',
        },
      },
      isActive: true,
      createdAt: new Date('2024-01-05'),
    },
    {
      id: 'dest_3',
      name: 'Discord Notifications',
      type: 'discord' as const,
      config: {
        discordWebhookUrl: 'https://discord.com/api/webhooks/...',
      },
      isActive: false,
      createdAt: new Date('2024-01-12'),
    },
  ];

  const handleToggleDestination = async (
    destinationId: string,
    isActive: boolean,
  ) => {
    // TODO: Implement API call to toggle destination
    console.log('Toggle destination:', destinationId, isActive);
  };

  const handleDeleteDestination = async (destinationId: string) => {
    // TODO: Implement API call to delete destination
    if (
      confirm(
        'Are you sure you want to delete this destination? This will also delete all associated rules.',
      )
    ) {
      console.log('Delete destination:', destinationId);
    }
  };

  const getDestinationUrl = (dest: typeof destinations[0]) => {
    switch (dest.type) {
      case 'slack':
        return dest.config.slackWebhookUrl;
      case 'discord':
        return dest.config.discordWebhookUrl;
      case 'teams':
        return dest.config.teamsWebhookUrl;
      case 'webhook':
        return dest.config.url;
      default:
        return null;
    }
  };

  const maskUrl = (url?: string | null) => {
    if (!url) return 'Not configured';
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}/***`;
  };

  return (
    <div className="space-y-4">
      {destinations.map((destination) => {
        const Icon = DESTINATION_ICONS[destination.type];
        const url = getDestinationUrl(destination);

        return (
          <Card key={destination.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Icon size="sm" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {destination.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline">{destination.type}</Badge>
                      <span className="text-xs">{maskUrl(url)}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={destination.isActive}
                    onCheckedChange={(checked) =>
                      handleToggleDestination(destination.id, checked)
                    }
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Icons.MoreVertical size="sm" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Icons.Edit size="sm" className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Icons.Copy size="sm" className="mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteDestination(destination.id)}
                        className="text-destructive"
                      >
                        <Icons.Trash size="sm" className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Text className="text-muted-foreground">Configuration</Text>
                  {destination.type === 'slack' &&
                    destination.config.slackChannel && (
                      <P className="font-medium">
                        Channel: {destination.config.slackChannel}
                      </P>
                    )}
                  {destination.type === 'webhook' &&
                    destination.config.headers && (
                      <P className="font-medium">
                        {Object.keys(destination.config.headers).length} custom
                        headers
                      </P>
                    )}
                  {(destination.type === 'discord' ||
                    destination.type === 'teams') && (
                    <P className="font-medium">Default configuration</P>
                  )}
                </div>
                <div>
                  <Text className="text-muted-foreground">Created</Text>
                  <P className="font-medium">
                    {destination.createdAt.toLocaleDateString()}
                  </P>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {destinations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Icons.InboxIcon
              size="lg"
              className="mx-auto mb-4 text-muted-foreground"
            />
            <P className="text-muted-foreground">
              No destinations configured yet.
            </P>
            <P className="text-sm text-muted-foreground mt-1">
              Create a destination to start forwarding webhooks.
            </P>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
