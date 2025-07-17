'use client';

import { IconEye, IconTrash } from '@tabler/icons-react';
import { Button } from '@unhook/ui/button';
import { CopyButton } from '@unhook/ui/custom/copy-button';
import { Input } from '@unhook/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unhook/ui/table';
import { format } from 'date-fns';
import { useState } from 'react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
}

// Mock data - replace with actual data fetching
const mockApiKeys: ApiKey[] = [
  {
    createdAt: new Date('2025-06-04T21:13:00'),
    id: '1',
    key: 'fc-0123456789abcdef',
    name: 'Default',
  },
];

export function ApiKeysTable() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const deleteApiKey = (id: string) => {
    setApiKeys((prev) => prev.filter((key) => key.id !== id));
  };

  const maskApiKey = (key: string) => {
    return `${key.slice(0, 3)}****${key.slice(-4)}`;
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell className="font-medium">{apiKey.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Input
                    className="font-mono text-sm"
                    readOnly
                    type={showKeys[apiKey.id] ? 'text' : 'password'}
                    value={
                      showKeys[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)
                    }
                  />
                  <Button
                    className="h-8 w-8 p-0"
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <IconEye size="sm" />
                  </Button>
                  <CopyButton
                    className="h-8 w-8 p-0"
                    size="sm"
                    text={apiKey.key}
                    variant="ghost"
                  />
                </div>
              </TableCell>
              <TableCell>
                {format(apiKey.createdAt, "MMMM d, yyyy 'at' h:mm a")}
              </TableCell>
              <TableCell>
                <Button
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => deleteApiKey(apiKey.id)}
                  size="sm"
                  variant="ghost"
                >
                  <IconTrash size="sm" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
