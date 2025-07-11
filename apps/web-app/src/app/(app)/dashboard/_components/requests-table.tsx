import { Avatar } from '@unhook/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { MoreHorizontal } from 'lucide-react';
import Image from 'next/image';

const vaults = [
  {
    apy: '8.56%',
    balance: '$13,954.04',
    daily: '+$213.8',
    liquidity: 'high',
    name: 'Bitcoin',
    price: '$13,643.21',
    startDate: '05.10.2023',
    state: 'Fixed',
    symbol: 'BTC',
  },
  {
    apy: '5.44%',
    balance: '$3,954.04',
    daily: '+$45.1',
    liquidity: 'medium',
    name: 'USDT',
    price: '$1.00',
    startDate: '12.03.2023',
    state: 'Fixed',
    symbol: 'USDT',
  },
  {
    apy: '4.12%',
    balance: '$3,954.04',
    daily: '+$13.5',
    liquidity: 'low',
    name: 'Ethereum',
    price: '$2,123.87',
    startDate: '21.01.2023',
    state: 'Flexible',
    symbol: 'ETH',
  },
];

export function VaultTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vault</TableHead>
          <TableHead>Daily</TableHead>
          <TableHead>Balance ↓</TableHead>
          <TableHead>APY ↓</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead>Liquidity</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vaults.map((vault) => (
          <TableRow key={vault.symbol}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <Image
                    alt={vault.name}
                    height={24}
                    src={'/placeholder.svg?height=24&width=24'}
                    width={24}
                  />
                </Avatar>
                <div>
                  <div className="font-medium">{vault.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {vault.price}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-green-500">{vault.daily}</TableCell>
            <TableCell>{vault.balance}</TableCell>
            <TableCell>{vault.apy}</TableCell>
            <TableCell>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                  vault.state === 'Fixed'
                    ? 'bg-yellow-500/10 text-yellow-500'
                    : 'bg-green-500/10 text-green-500'
                }`}
              >
                {vault.state}
              </span>
            </TableCell>
            <TableCell>{vault.startDate}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {['high', 'medium', 'low'].map((liquidity) => (
                  <div
                    className={`h-1.5 w-3 rounded-full ${
                      liquidity === 'high'
                        ? 'bg-primary'
                        : liquidity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    key={liquidity}
                  />
                ))}
              </div>
            </TableCell>
            <TableCell>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
