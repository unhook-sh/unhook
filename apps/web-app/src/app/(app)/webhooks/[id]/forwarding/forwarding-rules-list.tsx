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
import { EditForwardingRuleDialog } from './edit-forwarding-rule-dialog';
import { TestForwardingRuleDialog } from './test-forwarding-rule-dialog';

interface ForwardingRulesListProps {
  webhookId: string;
}

export function ForwardingRulesList({ webhookId }: ForwardingRulesListProps) {
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [testingRule, setTestingRule] = useState<string | null>(null);

  // TODO: Replace with actual data fetching
  const rules = [
    {
      id: 'rule_1',
      name: 'Send payment events to Slack',
      description:
        'Forward successful payment events to the #payments Slack channel',
      destination: {
        id: 'dest_1',
        name: 'Payments Slack Channel',
        type: 'slack' as const,
      },
      filters: {
        eventNames: ['payment.succeeded', 'payment.failed'],
      },
      transformation: `
function transform({ body }) {
  return {
    text: \`Payment \${body.status}: $\${body.amount / 100}\`,
    blocks: [{
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*Payment \${body.status}*\\nAmount: $\${body.amount / 100}\\nCustomer: \${body.customer.email}\`
      }
    }]
  };
}
      `.trim(),
      priority: 0,
      isActive: true,
      executionCount: 156,
      lastExecutedAt: new Date('2024-01-15T10:30:00'),
      errorCount: 2,
    },
    {
      id: 'rule_2',
      name: 'Log all events to webhook',
      description: 'Forward all events to our logging service',
      destination: {
        id: 'dest_2',
        name: 'Logging Service',
        type: 'webhook' as const,
      },
      filters: {},
      transformation: null,
      priority: 10,
      isActive: true,
      executionCount: 1420,
      lastExecutedAt: new Date('2024-01-15T12:45:00'),
      errorCount: 0,
    },
  ];

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    // TODO: Implement API call to toggle rule
    console.log('Toggle rule:', ruleId, isActive);
  };

  const handleDeleteRule = async (ruleId: string) => {
    // TODO: Implement API call to delete rule
    if (confirm('Are you sure you want to delete this rule?')) {
      console.log('Delete rule:', ruleId);
    }
  };

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <Card key={rule.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{rule.name}</CardTitle>
                <CardDescription>{rule.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={(checked) =>
                    handleToggleRule(rule.id, checked)
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Icons.MoreVertical size="sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingRule(rule.id)}>
                      <Icons.Edit size="sm" className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTestingRule(rule.id)}>
                      <Icons.PlayCircle size="sm" className="mr-2" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteRule(rule.id)}
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
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <Icons.ArrowRight size="xs" className="mr-1" />
                {rule.destination.name}
              </Badge>
              {rule.filters.eventNames &&
                rule.filters.eventNames.length > 0 && (
                  <Badge variant="outline">
                    <Icons.Filter size="xs" className="mr-1" />
                    {rule.filters.eventNames.length} event filter
                    {rule.filters.eventNames.length > 1 ? 's' : ''}
                  </Badge>
                )}
              {rule.transformation && (
                <Badge variant="outline">
                  <Icons.Code size="xs" className="mr-1" />
                  JavaScript transform
                </Badge>
              )}
              <Badge variant="outline">Priority: {rule.priority}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <Text className="text-muted-foreground">Executions</Text>
                <P className="font-medium">
                  {rule.executionCount.toLocaleString()}
                </P>
              </div>
              <div>
                <Text className="text-muted-foreground">Errors</Text>
                <P className="font-medium">
                  {rule.errorCount > 0 ? (
                    <span className="text-destructive">{rule.errorCount}</span>
                  ) : (
                    '0'
                  )}
                </P>
              </div>
              <div>
                <Text className="text-muted-foreground">Last executed</Text>
                <P className="font-medium">
                  {rule.lastExecutedAt
                    ? new Intl.RelativeTimeFormat('en', {
                        numeric: 'auto',
                      }).format(
                        Math.round(
                          (rule.lastExecutedAt.getTime() - Date.now()) /
                            (1000 * 60),
                        ),
                        'minute',
                      )
                    : 'Never'}
                </P>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingRule && (
        <EditForwardingRuleDialog
          ruleId={editingRule}
          open={!!editingRule}
          onOpenChange={(open) => !open && setEditingRule(null)}
        />
      )}

      {testingRule && (
        <TestForwardingRuleDialog
          ruleId={testingRule}
          open={!!testingRule}
          onOpenChange={(open) => !open && setTestingRule(null)}
        />
      )}
    </div>
  );
}
