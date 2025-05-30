'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';

export function FeatureTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Feature</TableHead>
          <TableHead>Free Plan</TableHead>
          <TableHead>Pro Plan</TableHead>
          <TableHead>Enterprise Plan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Monthly Requests</TableCell>
          <TableCell>10,000</TableCell>
          <TableCell>100,000</TableCell>
          <TableCell>Unlimited</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Request Retention</TableCell>
          <TableCell>7 days</TableCell>
          <TableCell>30 days</TableCell>
          <TableCell>Custom</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Real-time Monitoring</TableCell>
          <TableCell>Basic</TableCell>
          <TableCell>Advanced</TableCell>
          <TableCell>Advanced + Custom</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Performance Analytics</TableCell>
          <TableCell>Basic</TableCell>
          <TableCell>Advanced</TableCell>
          <TableCell>Advanced + Custom</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Cost Tracking</TableCell>
          <TableCell>No</TableCell>
          <TableCell>Yes</TableCell>
          <TableCell>Yes + Budget Controls</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Custom Metrics</TableCell>
          <TableCell>1</TableCell>
          <TableCell>10</TableCell>
          <TableCell>Unlimited</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Team Members</TableCell>
          <TableCell>2</TableCell>
          <TableCell>10</TableCell>
          <TableCell>Unlimited</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Support</TableCell>
          <TableCell>Community</TableCell>
          <TableCell>Business Hours</TableCell>
          <TableCell>24/7 Priority</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
