'use client';

import { useEffect, useState } from 'react';

// Define the LogEntry type
interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  status: number;
  host: string;
  path: string;
  request: string;
  level: string;
  userAgent: string;
  location: string;
  searchParams: { [key: string]: string };
  externalApis: { method: string; url: string; status: number }[];
  details: any;
}

// Mock data for the logs
const mockLogs: LogEntry[] = [
  {
    id: 'qa54p-1743719590529-e3f90fba9d79',
    timestamp: '15:33:10.52',
    method: 'POST',
    status: 403,
    host: 'tunnel-pi.vercel.app',
    path: '/api/tunnel',
    request: "req Request { method: 'POST' }",
    level: 'warning',
    userAgent: 'Svix-Webhooks/1.62.0 (sender-9Y...)',
    location: 'Dublin, Ireland (dub1)',
    searchParams: {
      key: 'pk_123',
      endpoint: 'webhooks/clerk',
    },
    externalApis: [
      {
        method: 'POST',
        url: 'c4508560513171456.ingest.us.sumologic.com',
        status: 200,
      },
    ],
    details: {
      request: {
        method: 'POST',
        url: 'https://tunnel-pi.vercel.app/api/tunnel?key=pk_123&endpoint=webhook%2Fclerk',
        headers: {
          'x-vercel-ip-timezone': 'Europe/Dublin',
          'x-vercel-ip-city': 'Dublin',
          accept: '*/*',
          'svix-id': 'msg_2vEoS4gtL6R096JSYNvMv0oHaIs',
          'x-clerk-auth-signature': '',
          'accept-encoding': 'gzip',
          'svix-timestamp': '1743719590',
          'x-vercel-sc-host': 'iad1.suspense-cache.vercel-infra.com',
          'content-type': 'application/json',
          'x-vercel-ip-continent': 'EU',
          'x-clerk-auth-reason': 'dev-browser-missing',
          'x-vercel-id': 'dub1::qa54p-1743719590529-e3f90fba9d79',
        },
      },
      response: {
        status: 403,
        headers: {
          'content-type': 'application/json',
        },
        body: {
          error: 'Forbidden',
          message: 'API key is invalid',
        },
      },
      headers: {
        'x-vercel-ip-timezone': 'Europe/Dublin',
        'x-vercel-ip-city': 'Dublin',
        accept: '*/*',
        'svix-id': 'msg_2vEoS4gtL6R096JSYNvMv0oHaIs',
        'x-clerk-auth-signature': '',
        'accept-encoding': 'gzip',
        'svix-timestamp': '1743719590',
        'x-vercel-sc-host': 'iad1.suspense-cache.vercel-infra.com',
        'content-type': 'application/json',
        'x-vercel-ip-continent': 'EU',
        'x-clerk-auth-reason': 'dev-browser-missing',
        'x-vercel-id': 'dub1::qa54p-1743719590529-e3f90fba9d79',
      },
    },
  },
  {
    id: 'qa54p-1743719590528-e3f90fba9d78',
    timestamp: '15:33:05.40',
    method: 'POST',
    status: 403,
    host: 'tunnel-pi.vercel.app',
    path: '/api/tunnel',
    request: "req Request { method: 'POST' }",
    level: 'warning',
    userAgent: 'Svix-Webhooks/1.62.0 (sender-9Y...)',
    location: 'Dublin, Ireland (dub1)',
    searchParams: {
      key: 'pk_123',
      endpoint: 'webhooks/clerk',
    },
    details: {
      request: {
        method: 'POST',
        url: 'https://tunnel-pi.vercel.app/api/tunnel?key=pk_123&endpoint=webhook%2Fclerk',
        headers: {},
      },
      response: {
        status: 403,
        headers: {},
        body: {},
      },
      headers: {},
    },
  },
  {
    id: 'qa54p-1743719590527-e3f90fba9d77',
    timestamp: '15:29:47.98',
    method: 'POST',
    status: 403,
    host: 'tunnel-pi.vercel.app',
    path: '/api/tunnel',
    request: "req Request { method: 'POST' }",
    level: 'warning',
    userAgent: 'Svix-Webhooks/1.62.0 (sender-9Y...)',
    location: 'Dublin, Ireland (dub1)',
    searchParams: {
      key: 'pk_123',
      endpoint: 'webhooks/clerk',
    },
    details: {
      request: {
        method: 'POST',
        url: 'https://tunnel-pi.vercel.app/api/tunnel?key=pk_123&endpoint=webhook%2Fclerk',
        headers: {},
      },
      response: {
        status: 403,
        headers: {},
        body: {},
      },
      headers: {},
    },
  },
  {
    id: 'qa54p-1743719590526-e3f90fba9d76',
    timestamp: '15:29:29.90',
    method: 'GET',
    status: 307,
    host: 'tunnel-r7qa9b5ef...',
    path: '/',
    request: "req Request { method: 'GET' }",
    level: 'info',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    location: 'Dublin, Ireland (dub1)',
    searchParams: {},
    details: {
      request: {
        method: 'GET',
        url: 'https://tunnel-r7qa9b5ef.vercel.app/',
        headers: {},
      },
      response: {
        status: 307,
        headers: {},
        body: {},
      },
      headers: {},
    },
  },
];

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLogs(mockLogs);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    logs,
    isLoading,
    refresh,
  };
}
