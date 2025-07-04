'use client';

import { Badge } from '@unhook/ui/badge';
import { Button } from '@unhook/ui/button';
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
import { Switch } from '@unhook/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@unhook/ui/tabs';
import { Textarea } from '@unhook/ui/textarea';
import { useState } from 'react';
import { CodeEditor } from './code-editor';

interface CreateForwardingRuleDialogProps {
  webhookId: string;
}

export function CreateForwardingRuleDialog({
  webhookId,
}: CreateForwardingRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [priority, setPriority] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // Filters
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [eventNameInput, setEventNameInput] = useState('');
  const [methods, setMethods] = useState<string[]>([]);
  const [pathPatterns, setPathPatterns] = useState<string[]>([]);
  const [pathPatternInput, setPathPatternInput] = useState('');
  const [customFilter, setCustomFilter] = useState('');

  // Transformation
  const [transformation, setTransformation] = useState('');

  // TODO: Replace with actual data fetching
  const destinations = [
    { id: 'dest_1', name: 'Payments Slack Channel', type: 'slack' },
    { id: 'dest_2', name: 'Logging Service', type: 'webhook' },
    { id: 'dest_3', name: 'Discord Notifications', type: 'discord' },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to create rule
      const ruleData = {
        name,
        description,
        webhookId,
        destinationId,
        priority: Number.parseInt(priority, 10),
        isActive,
        filters: {
          eventNames: eventNames.length > 0 ? eventNames : undefined,
          methods: methods.length > 0 ? methods : undefined,
          pathPatterns: pathPatterns.length > 0 ? pathPatterns : undefined,
          customFilter: customFilter.trim() || undefined,
        },
        transformation: transformation.trim() || undefined,
      };
      console.log('Create rule:', ruleData);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setDestinationId('');
    setPriority('0');
    setIsActive(true);
    setEventNames([]);
    setEventNameInput('');
    setMethods([]);
    setPathPatterns([]);
    setPathPatternInput('');
    setCustomFilter('');
    setTransformation('');
  };

  const addEventName = () => {
    if (eventNameInput.trim() && !eventNames.includes(eventNameInput.trim())) {
      setEventNames([...eventNames, eventNameInput.trim()]);
      setEventNameInput('');
    }
  };

  const removeEventName = (name: string) => {
    setEventNames(eventNames.filter((n) => n !== name));
  };

  const addPathPattern = () => {
    if (
      pathPatternInput.trim() &&
      !pathPatterns.includes(pathPatternInput.trim())
    ) {
      setPathPatterns([...pathPatterns, pathPatternInput.trim()]);
      setPathPatternInput('');
    }
  };

  const removePathPattern = (pattern: string) => {
    setPathPatterns(pathPatterns.filter((p) => p !== pattern));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.Plus size="sm" className="mr-2" />
          Create Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Forwarding Rule</DialogTitle>
          <DialogDescription>
            Configure how webhooks should be filtered, transformed, and
            forwarded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Send payment events to Slack"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this rule does..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Select a destination" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((dest) => (
                    <SelectItem key={dest.id} value={dest.id}>
                      <div className="flex items-center gap-2">
                        <Icons.ArrowRight size="xs" />
                        {dest.name}
                        <Badge variant="outline" className="ml-2">
                          {dest.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers execute first
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="active">Active</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active" className="font-normal">
                    Enable rule immediately
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Transformation */}
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="transformation">Transformation</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-4">
              {/* Event Names */}
              <div className="grid gap-2">
                <Label>Event Names</Label>
                <div className="flex gap-2">
                  <Input
                    value={eventNameInput}
                    onChange={(e) => setEventNameInput(e.target.value)}
                    placeholder="e.g., payment.succeeded"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEventName();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addEventName}
                  >
                    Add
                  </Button>
                </div>
                {eventNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {eventNames.map((name) => (
                      <Badge key={name} variant="secondary">
                        {name}
                        <button
                          type="button"
                          onClick={() => removeEventName(name)}
                          className="ml-1"
                        >
                          <Icons.X size="xs" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* HTTP Methods */}
              <div className="grid gap-2">
                <Label>HTTP Methods</Label>
                <div className="flex flex-wrap gap-2">
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={methods.includes(method) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (methods.includes(method)) {
                          setMethods(methods.filter((m) => m !== method));
                        } else {
                          setMethods([...methods, method]);
                        }
                      }}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Path Patterns */}
              <div className="grid gap-2">
                <Label>Path Patterns (Regex)</Label>
                <div className="flex gap-2">
                  <Input
                    value={pathPatternInput}
                    onChange={(e) => setPathPatternInput(e.target.value)}
                    placeholder="e.g., ^/api/webhooks/stripe"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPathPattern();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addPathPattern}
                  >
                    Add
                  </Button>
                </div>
                {pathPatterns.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pathPatterns.map((pattern) => (
                      <Badge key={pattern} variant="secondary">
                        <code>{pattern}</code>
                        <button
                          type="button"
                          onClick={() => removePathPattern(pattern)}
                          className="ml-1"
                        >
                          <Icons.X size="xs" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Filter */}
              <div className="grid gap-2">
                <Label>Custom JavaScript Filter</Label>
                <CodeEditor
                  value={customFilter}
                  onChange={setCustomFilter}
                  placeholder="// Return true to forward, false to skip
// Available: event, request, body, headers
body.amount > 1000 && body.currency === 'USD'"
                  height="120px"
                />
              </div>
            </TabsContent>

            <TabsContent value="transformation" className="space-y-4">
              <div className="grid gap-2">
                <Label>JavaScript Transformation</Label>
                <CodeEditor
                  value={transformation}
                  onChange={setTransformation}
                  placeholder={`// Transform the webhook data before forwarding
// Define a transform function that returns the new payload
function transform({ event, request, body, headers }) {
  return {
    text: \`New event: \${body.type}\`,
    timestamp: new Date().toISOString()
  };
}`}
                  height="300px"
                />
                <p className="text-xs text-muted-foreground">
                  The transform function receives the webhook data and should
                  return the transformed payload.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name || !destinationId}
          >
            {loading && (
              <Icons.Spinner size="sm" className="mr-2 animate-spin" />
            )}
            Create Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
