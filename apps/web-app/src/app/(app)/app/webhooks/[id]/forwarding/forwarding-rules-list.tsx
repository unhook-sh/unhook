'use client';

import { MetricButton } from '@unhook/analytics/components';
import { Badge } from '@unhook/ui/badge';
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
import { Code2, Edit, Filter, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { EditForwardingRuleDialog } from './edit-forwarding-rule-dialog';
import { TestForwardingRuleDialog } from './test-forwarding-rule-dialog';

interface ForwardingRulesListProps {
  webhookId: string;
}

export function ForwardingRulesList({
  webhookId: _webhookId,
}: ForwardingRulesListProps) {
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [testingRule, setTestingRule] = useState<string | null>(null);

  // TODO: Replace with actual data fetching
  const rules = [
    {
      description:
        'Forward successful payment events to the #payments Slack channel',
      destination: {
        id: 'dest_1',
        name: 'Payments Slack Channel',
        type: 'slack' as const,
      },
      errorCount: 2,
      executionCount: 156,
      filters: {
        eventNames: ['payment.succeeded', 'payment.failed'],
      },
      id: 'rule_1',
      isActive: true,
      lastExecutedAt: new Date('2024-01-15T10:30:00'),
      name: 'Send payment events to Slack',
      priority: 0,
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
    },
    {
      description: 'Forward all events to our logging service',
      destination: {
        id: 'dest_2',
        name: 'Logging Service',
        type: 'webhook' as const,
      },
      errorCount: 0,
      executionCount: 1420,
      filters: {},
      id: 'rule_2',
      isActive: true,
      lastExecutedAt: new Date('2024-01-15T12:45:00'),
      name: 'Log all events to webhook',
      priority: 10,
      transformation: null,
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
                    <MetricButton
                      metric="forwarding_rules_list_actions_menu_opened"
                      size="sm"
                      variant="ghost"
                    >
                      <Icons.MoreVertical size="sm" />
                    </MetricButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingRule(rule.id)}>
                      <Edit className="mr-2" size="sm" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTestingRule(rule.id)}>
                      <PlayCircle className="mr-2" size="sm" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Icons.Trash className="mr-2" size="sm" />
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
                <Icons.ArrowRight className="mr-1" size="xs" />
                {rule.destination.name}
              </Badge>
              {rule.filters.eventNames &&
                rule.filters.eventNames.length > 0 && (
                  <Badge variant="outline">
                    <Filter className="mr-1" size="xs" />
                    {rule.filters.eventNames.length} event filter
                    {rule.filters.eventNames.length > 1 ? 's' : ''}
                  </Badge>
                )}
              {rule.transformation && (
                <Badge variant="outline">
                  <Code2 className="mr-1" size="xs" />
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
          onOpenChange={(open) => !open && setEditingRule(null)}
          open={!!editingRule}
          ruleId={editingRule}
        />
      )}

      {testingRule && (
        <TestForwardingRuleDialog
          onOpenChange={(open) => !open && setTestingRule(null)}
          open={!!testingRule}
          ruleId={testingRule}
        />
      )}
    </div>
  );
}
