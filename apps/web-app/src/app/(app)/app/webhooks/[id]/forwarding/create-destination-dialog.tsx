'use client';

import { MetricButton } from '@unhook/analytics/components';
import { Icons } from '@unhook/ui/custom/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@unhook/ui/dialog';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';
import { Textarea } from '@unhook/ui/textarea';
import { useState } from 'react';

export function CreateDestinationDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');

  // Config state
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookHeaders, setWebhookHeaders] = useState('');
  const [authType, setAuthType] = useState('');
  const [authToken, setAuthToken] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to create destination
      const config: Record<string, unknown> = {};

      switch (type) {
        case 'slack':
          config.slackWebhookUrl = slackWebhookUrl;
          config.slackChannel = slackChannel || undefined;
          break;
        case 'discord':
          config.discordWebhookUrl = discordWebhookUrl;
          break;
        case 'teams':
          config.teamsWebhookUrl = teamsWebhookUrl;
          break;
        case 'webhook':
          config.url = webhookUrl;
          if (webhookHeaders) {
            try {
              config.headers = JSON.parse(webhookHeaders);
            } catch (_e) {
              alert('Invalid JSON for headers');
              return;
            }
          }
          if (authType && authToken) {
            config.authentication = {
              token: authToken,
              type: authType,
            };
          }
          break;
      }

      const destinationData = {
        config,
        isActive: true,
        name,
        type,
      };

      console.log('Create destination:', destinationData);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create destination:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('');
    setSlackWebhookUrl('');
    setSlackChannel('');
    setDiscordWebhookUrl('');
    setTeamsWebhookUrl('');
    setWebhookUrl('');
    setWebhookHeaders('');
    setAuthType('');
    setAuthToken('');
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <MetricButton metric="create_destination_dialog_trigger_clicked">
          <Icons.Plus className="mr-2" size="sm" />
          Create Destination
        </MetricButton>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Destination</DialogTitle>
          <DialogDescription>
            Configure a destination where webhooks can be forwarded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Payments Slack Channel"
              value={name}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select a destination type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slack">
                  <div className="flex items-center gap-2">
                    <Icons.MessageSquareText size="xs" />
                    Slack
                  </div>
                </SelectItem>
                <SelectItem value="discord">
                  <div className="flex items-center gap-2">
                    <Icons.MessageSquareText size="xs" />
                    Discord
                  </div>
                </SelectItem>
                <SelectItem value="teams">
                  <div className="flex items-center gap-2">
                    <Icons.User size="xs" />
                    Microsoft Teams
                  </div>
                </SelectItem>
                <SelectItem value="webhook">
                  <div className="flex items-center gap-2">
                    <Icons.User size="xs" />
                    Custom Webhook
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type && (
            <div className="space-y-4 pt-2">
              {type === 'slack' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                    <Input
                      id="slack-webhook"
                      onChange={(e) => setSlackWebhookUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      type="url"
                      value={slackWebhookUrl}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get this from your Slack app's Incoming Webhooks settings
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slack-channel">Channel (optional)</Label>
                    <Input
                      id="slack-channel"
                      onChange={(e) => setSlackChannel(e.target.value)}
                      placeholder="#general"
                      value={slackChannel}
                    />
                    <p className="text-xs text-muted-foreground">
                      Override the default channel configured in Slack
                    </p>
                  </div>
                </>
              )}

              {type === 'discord' && (
                <div className="grid gap-2">
                  <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
                  <Input
                    id="discord-webhook"
                    onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    type="url"
                    value={discordWebhookUrl}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from your Discord channel settings → Integrations →
                    Webhooks
                  </p>
                </div>
              )}

              {type === 'teams' && (
                <div className="grid gap-2">
                  <Label htmlFor="teams-webhook">Teams Webhook URL</Label>
                  <Input
                    id="teams-webhook"
                    onChange={(e) => setTeamsWebhookUrl(e.target.value)}
                    placeholder="https://outlook.office.com/webhook/..."
                    type="url"
                    value={teamsWebhookUrl}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from your Teams channel → Connectors → Incoming
                    Webhook
                  </p>
                </div>
              )}

              {type === 'webhook' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.example.com/webhooks"
                      type="url"
                      value={webhookUrl}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="headers">Custom Headers (JSON)</Label>
                    <Textarea
                      className="font-mono text-sm"
                      id="headers"
                      onChange={(e) => setWebhookHeaders(e.target.value)}
                      placeholder='{"X-API-Key": "your-api-key"}'
                      rows={3}
                      value={webhookHeaders}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Authentication (optional)</Label>
                    <Select onValueChange={setAuthType} value={authType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select authentication type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="apiKey">API Key</SelectItem>
                      </SelectContent>
                    </Select>

                    {authType && (
                      <Input
                        className="mt-2"
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder={
                          authType === 'bearer' ? 'Bearer token' : 'API key'
                        }
                        type="password"
                        value={authToken}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <MetricButton
            disabled={loading}
            metric="create_destination_cancel_clicked"
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </MetricButton>
          <MetricButton
            disabled={loading || !name || !type}
            metric="create_destination_submit_clicked"
            onClick={handleSubmit}
          >
            {loading && (
              <Icons.Spinner className="mr-2 animate-spin" size="sm" />
            )}
            Create Destination
          </MetricButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
