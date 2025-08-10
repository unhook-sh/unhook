import { debug } from '@unhook/logger';

const log = debug('unhook:mcp-server:http-client');

export interface HttpClientOptions {
  baseUrl?: string;
  authToken?: string;
}

export class HttpClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://unhook.sh';
    this.authToken = options.authToken;
  }

  private async makeRequest(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api/trpc/${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result?.data;
    } catch (error) {
      log('HTTP request failed:', { error, url });
      throw error;
    }
  }

  async getEvents(params: { limit?: number; offset?: number } = {}) {
    const query = new URLSearchParams();
    if (params.limit)
      query.set(
        'input',
        JSON.stringify({ limit: params.limit, offset: params.offset || 0 }),
      );

    return this.makeRequest(`events.all?${query.toString()}`);
  }

  async getEventCount() {
    return this.makeRequest('events.count');
  }

  async getRequests() {
    return this.makeRequest('requests.all');
  }

  async getWebhooks() {
    return this.makeRequest('webhooks.all');
  }

  async searchEvents(params: any) {
    const query = new URLSearchParams();
    query.set('input', JSON.stringify(params));
    return this.makeRequest(`events.search?${query.toString()}`);
  }

  async searchRequests(params: any) {
    const query = new URLSearchParams();
    query.set('input', JSON.stringify(params));
    return this.makeRequest(`requests.search?${query.toString()}`);
  }

  async getEventById(id: string) {
    const query = new URLSearchParams();
    query.set('input', JSON.stringify({ id }));
    return this.makeRequest(`events.byId?${query.toString()}`);
  }

  async getRequestById(id: string) {
    const query = new URLSearchParams();
    query.set('input', JSON.stringify({ id }));
    return this.makeRequest(`requests.byId?${query.toString()}`);
  }

  async getWebhookStats(params: any) {
    const query = new URLSearchParams();
    query.set('input', JSON.stringify(params));
    return this.makeRequest(`webhooks.stats?${query.toString()}`);
  }

  async createTestEvent(params: any) {
    return this.makeRequest('events.createTest', {
      body: JSON.stringify({ input: params }),
      method: 'POST',
    });
  }
}

export function createHttpClient(options: HttpClientOptions = {}) {
  return new HttpClient(options);
}
