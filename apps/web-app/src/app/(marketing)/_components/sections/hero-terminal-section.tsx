import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/components/table';
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from '@unhook/ui/magicui/terminal';
import { Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const mockRows = [
  {
    expires: {
      label: '5 minutes',
      icon: <Clock className="size-4 text-secondary" />,
      color: 'text-secondary',
      bold: true,
    },
    attempts: 1,
    from: 'Slack',
    to: 'localhost:3000',
    code: <Loader2 className="size-4 animate-spin" />,
    elapsed: '-',
    url: '/webhooks/slack',
    event: 'message.created',
  },
  {
    expires: {
      label: '5 minutes',
      icon: <Clock className="size-4 text-secondary" />,
      color: 'text-secondary',
      bold: true,
    },
    attempts: 1,
    from: 'Discord',
    to: 'prod',
    code: <Loader2 className="size-4 animate-spin" />,
    elapsed: '-',
    url: '/webhooks/discord',
    event: 'message.created',
  },
  {
    expires: {
      label: '2 minutes',
      icon: <Clock className="size-4 text-warning" />,
      color: 'text-warning',
      bold: true,
    },
    attempts: 1,
    from: 'Stripe',
    to: 'prod',
    code: 200,
    elapsed: 160,
    url: '/webhooks/stripe',
    event: 'payment.created',
  },
  {
    expires: {
      label: '1 minute',
      icon: <Clock className="size-4 text-warning" />,
      color: 'text-warning',
      bold: true,
    },
    attempts: 2,
    from: 'Discord',
    to: 'staging',
    code: 200,
    elapsed: 6681,
    url: '/webhooks/discord',
    event: 'guild.member.added',
  },
  {
    expires: {
      label: '30 seconds',
      icon: <Clock className="size-4 text-destructive" />,
      color: 'text-destructive',
      bold: true,
    },
    attempts: 3,
    from: 'Clerk',
    to: 'prod',
    code: 500,
    elapsed: 5801,
    url: '/webhooks/clerk',
    event: 'user.created',
  },
  {
    expires: {
      label: '45 seconds',
      icon: <Clock className="size-4 text-destructive" />,
      color: 'text-destructive',
      bold: true,
    },
    attempts: 1,
    from: 'Stripe',
    to: 'staging',
    code: 200,
    elapsed: 8982,
    url: '/webhooks/stripe',
    event: 'subscription.created',
  },
  {
    expires: {
      label: '15 seconds',
      icon: <Clock className="size-4 text-destructive" />,
      color: 'text-destructive',
      bold: true,
    },
    attempts: 1,
    from: 'Discord',
    to: 'localhost:3000',
    code: 200,
    elapsed: 8085,
    url: '/webhooks/discord',
    event: 'channel.created',
  },
  {
    expires: {
      label: '3 minutes',
      icon: <Clock className="size-4 text-warning" />,
      color: 'text-warning',
      bold: true,
    },
    attempts: 1,
    from: 'Clerk',
    to: 'staging',
    code: 200,
    elapsed: 5809,
    url: '/webhooks/clerk',
    event: 'user.updated',
  },
  {
    expires: {
      label: '4 minutes',
      icon: <Clock className="size-4 text-warning" />,
      color: 'text-warning',
      bold: true,
    },
    attempts: 1,
    from: 'Stripe',
    to: 'localhost:3000',
    code: 200,
    elapsed: 1226,
    url: '/webhooks/stripe',
    event: 'invoice.paid',
  },
];

export function HeroTerminalSection() {
  const [delays, setDelays] = useState<number[]>([]);

  useEffect(() => {
    const newDelays = mockRows.map(() => 350 + Math.random() * 200);
    setDelays(newDelays);
  }, []);

  return (
    <div className="w-full relative px-6 lg:px-24 mt-10">
      <Terminal className="w-full max-w-full min-h-[500px]">
        <TypingAnimation delay={1000}>$ unhook --port 3000</TypingAnimation>
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
                  key={`${row.from}-${row.to}-${row.url}`}
                  className="animate-[enterFromLeft_250ms_ease]"
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
