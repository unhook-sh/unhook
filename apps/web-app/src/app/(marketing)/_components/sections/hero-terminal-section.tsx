import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from '@unhook/ui/magicui/terminal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const mockRows = [
  {
    attempts: 1,
    code: <Loader2 className="size-4 animate-spin" />,
    elapsed: '-',
    event: 'message.created',
    expires: {
      bold: true,
      color: 'text-secondary',
      icon: <Clock className="size-4 text-secondary" />,
      label: '5 minutes',
    },
    from: 'Slack',
    to: 'localhost:3000',
    url: '/webhooks/slack',
  },
  {
    attempts: 1,
    code: <Loader2 className="size-4 animate-spin" />,
    elapsed: '-',
    event: 'message.created',
    expires: {
      bold: true,
      color: 'text-secondary',
      icon: <Clock className="size-4 text-secondary" />,
      label: '5 minutes',
    },
    from: 'Discord',
    to: 'prod',
    url: '/webhooks/discord',
  },
  {
    attempts: 1,
    code: 200,
    elapsed: 160,
    event: 'payment.created',
    expires: {
      bold: true,
      color: 'text-warning',
      icon: <Clock className="size-4 text-warning" />,
      label: '2 minutes',
    },
    from: 'Stripe',
    to: 'prod',
    url: '/webhooks/stripe',
  },
  {
    attempts: 2,
    code: 200,
    elapsed: 6681,
    event: 'guild.member.added',
    expires: {
      bold: true,
      color: 'text-warning',
      icon: <Clock className="size-4 text-warning" />,
      label: '1 minute',
    },
    from: 'Discord',
    to: 'staging',
    url: '/webhooks/discord',
  },
  {
    attempts: 3,
    code: 500,
    elapsed: 5801,
    event: 'user.created',
    expires: {
      bold: true,
      color: 'text-destructive',
      icon: <Clock className="size-4 text-destructive" />,
      label: '30 seconds',
    },
    from: 'Clerk',
    to: 'prod',
    url: '/webhooks/clerk',
  },
  {
    attempts: 1,
    code: 200,
    elapsed: 8982,
    event: 'subscription.created',
    expires: {
      bold: true,
      color: 'text-destructive',
      icon: <Clock className="size-4 text-destructive" />,
      label: '45 seconds',
    },
    from: 'Stripe',
    to: 'staging',
    url: '/webhooks/stripe',
  },
  {
    attempts: 1,
    code: 200,
    elapsed: 8085,
    event: 'channel.created',
    expires: {
      bold: true,
      color: 'text-destructive',
      icon: <Clock className="size-4 text-destructive" />,
      label: '15 seconds',
    },
    from: 'Discord',
    to: 'localhost:3000',
    url: '/webhooks/discord',
  },
  {
    attempts: 1,
    code: 200,
    elapsed: 5809,
    event: 'user.updated',
    expires: {
      bold: true,
      color: 'text-warning',
      icon: <Clock className="size-4 text-warning" />,
      label: '3 minutes',
    },
    from: 'Clerk',
    to: 'staging',
    url: '/webhooks/clerk',
  },
  {
    attempts: 1,
    code: 200,
    elapsed: 1226,
    event: 'invoice.paid',
    expires: {
      bold: true,
      color: 'text-warning',
      icon: <Clock className="size-4 text-warning" />,
      label: '4 minutes',
    },
    from: 'Stripe',
    to: 'localhost:3000',
    url: '/webhooks/stripe',
  },
];

export function HeroTerminalSection() {
  const [delays, setDelays] = useState<number[]>([]);

  useEffect(() => {
    const newDelays = mockRows.map(() => 350 + Math.random() * 200);
    setDelays(newDelays);
  }, []);

  return (
    <div className="w-full relative px-2 lg:px-24 mt-10">
      <Terminal className="w-full max-w-full min-h-[500px]">
        <TypingAnimation delay={1000}>$ unhook listen</TypingAnimation>
        <AnimatedSpan delay={2500}>https://unhook.sh/wh_AH21J</AnimatedSpan>
        <AnimatedSpan delay={2500}>
          <span className="text-muted-foreground">Press r to replay event</span>
        </AnimatedSpan>
        <div
          className="w-full overflow-x-auto opacity-0 animate-[fadeIn_250ms_ease]"
          style={{
            animationDelay: '3500ms',
            animationFillMode: 'both',
          }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden lg:table-cell w-[120px]">
                  Expires
                </TableHead>
                <TableHead>From</TableHead>
                <TableHead className="hidden lg:table-cell">To</TableHead>
                <TableHead className="hidden lg:table-cell">Endpoint</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>
                  <span className="hidden lg:block">Response</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRows.map((row, index) => (
                <TableRow
                  className="animate-[enterFromLeft_250ms_ease]"
                  key={`${row.from}-${row.to}-${row.url}`}
                  style={{
                    animationDelay: `${4000 + index * (delays[index] || 450)}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <TableCell className="hidden lg:flex items-center gap-2 font-mono text-sm">
                    <span className={row.expires.color}>
                      {row.expires.icon}
                    </span>
                    <span
                      className={
                        row.expires.bold
                          ? `font-bold ${row.expires.color}`
                          : 'text-muted-foreground'
                      }
                    >
                      {row.expires.label}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.from}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-sm">
                    {row.to}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {row.url}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.event}
                  </TableCell>
                  <TableCell
                    className={`font-mono text-sm ${row.code === 500 ? 'text-destructive font-bold' : row.code === 200 ? 'text-secondary font-bold' : 'text-muted-foreground'}`}
                  >
                    {row.code}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Terminal>
    </div>
  );
}
