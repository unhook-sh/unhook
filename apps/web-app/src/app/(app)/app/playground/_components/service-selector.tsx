'use client';

import { Label } from '@unhook/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unhook/ui/select';

interface ServiceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const SERVICES = [
  {
    description: 'Authentication & User Management',
    label: 'Clerk',
    value: 'clerk',
  },
  { description: 'Payment Processing', label: 'Stripe', value: 'stripe' },
  {
    description: 'Repository & Workflow Events',
    label: 'GitHub',
    value: 'github',
  },
  { description: 'Custom Webhook Provider', label: 'Custom', value: 'custom' },
];

export function ServiceSelector({
  value,
  onValueChange,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="service">Service</Label>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger id="service">
          <SelectValue placeholder="Select a service" />
        </SelectTrigger>
        <SelectContent>
          {SERVICES.map((service) => (
            <SelectItem key={service.value} value={service.value}>
              <div className="flex flex-col">
                <span className="font-medium">{service.label}</span>
                <span className="text-xs text-muted-foreground">
                  {service.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
