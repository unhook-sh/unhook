#!/usr/bin/env bun

/**
 * Development inspector for testing MCP server capabilities
 * This script provides a simple CLI interface to test the MCP server
 *
 * Usage:
 * 1. Start the MCP server: bun run dev:server
 * 2. In another terminal, run this inspector: bun run dev:inspector
 */

import { type ChildProcess, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { debug } from '@unhook/logger';

const log = debug('unhook:mcp-server:inspector');

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    data?: Record<string, unknown>;
  };
}

class MCPInspector {
  private serverProcess: ChildProcess | null = null;
  requestId = 1;

  constructor() {
    this.serverProcess = null;
  }

  async start() {
    log('Starting MCP Inspector...');

    // Start the MCP server process
    this.serverProcess = spawn('bun', ['run', 'src/dev-server.ts'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Handle server output
    this.serverProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[Server] ${output}`);
      }
    });

    this.serverProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`[Server Error] ${output}`);
      }
    });

    // Wait a moment for server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Initialize the connection
    await this.initialize();
  }

  private async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('Server process not started'));
        return;
      }

      const requestStr = `${JSON.stringify(request)}\n`;

      this.serverProcess.stdin?.write(requestStr);

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      const onData = (data: Buffer) => {
        const responseStr = data.toString().trim();
        if (responseStr) {
          try {
            const response: MCPResponse = JSON.parse(responseStr);
            if (response.id === request.id) {
              clearTimeout(timeout);
              this.serverProcess?.stdout?.removeListener('data', onData);
              resolve(response);
            }
          } catch (_error) {
            // Ignore non-JSON output
          }
        }
      };

      this.serverProcess.stdout?.on('data', onData);
    });
  }

  private async initialize() {
    log('Initializing MCP connection...');

    const initRequest: MCPRequest = {
      id: this.requestId++,
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {},
        },
        clientInfo: {
          name: 'unhook-mcp-inspector',
          version: '1.0.0',
        },
        protocolVersion: '2024-11-05',
      },
    };

    try {
      const response = await this.sendRequest(initRequest);
      if (response.error) {
        throw new Error(`Initialization failed: ${response.error.message}`);
      }
      log('MCP connection initialized successfully');
      console.log(
        'Server capabilities:',
        JSON.stringify(response.result, null, 2),
      );
    } catch (error) {
      console.error('Failed to initialize MCP connection:', error);
      return;
    }

    // Start interactive mode
    await this.interactiveMode();
  }

  private async interactiveMode() {
    console.log('\n=== MCP Inspector Interactive Mode ===');
    console.log('Available commands:');
    console.log('  list-tools     - List available tools');
    console.log('  list-resources - List available resources');
    console.log('  list-prompts   - List available prompts');
    console.log('  call-tool      - Call a specific tool');
    console.log('  get-resource   - Get a specific resource');
    console.log('  call-prompt    - Call a specific prompt');
    console.log('  quit           - Exit the inspector');
    console.log('');

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = (question: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(question, (answer: string) => {
          resolve(answer);
        });
      });
    };

    while (true) {
      try {
        const command = await askQuestion('mcp> ');
        const parts = command.trim().split(' ');
        const cmd = parts[0];

        switch (cmd) {
          case 'list-tools':
            await this.listTools();
            break;
          case 'list-resources':
            await this.listResources();
            break;
          case 'list-prompts':
            await this.listPrompts();
            break;
          case 'call-tool':
            await this.callTool(parts.slice(1));
            break;
          case 'get-resource':
            await this.getResource(parts.slice(1));
            break;
          case 'call-prompt':
            await this.callPrompt(parts.slice(1));
            break;
          case 'quit':
          case 'exit':
            console.log('Goodbye!');
            rl.close();
            this.stop();
            return;
          default:
            console.log('Unknown command. Type "help" for available commands.');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }

  private async listTools() {
    const request: MCPRequest = {
      id: this.requestId++,
      jsonrpc: '2.0',
      method: 'tools/list',
    };

    try {
      const response = await this.sendRequest(request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      console.log('Available tools:');
      console.log(JSON.stringify(response.result, null, 2));
    } catch (error) {
      console.error('Failed to list tools:', error);
    }
  }

  private async listResources() {
    const request: MCPRequest = {
      id: this.requestId++,
      jsonrpc: '2.0',
      method: 'resources/list',
    };

    try {
      const response = await this.sendRequest(request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      console.log('Available resources:');
      console.log(JSON.stringify(response.result, null, 2));
    } catch (error) {
      console.error('Failed to list resources:', error);
    }
  }

  private async listPrompts() {
    const request: MCPRequest = {
      id: this.requestId++,
      jsonrpc: '2.0',
      method: 'prompts/list',
    };

    try {
      const response = await this.sendRequest(request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      console.log('Available prompts:');
      console.log(JSON.stringify(response.result, null, 2));
    } catch (error) {
      console.error('Failed to list prompts:', error);
    }
  }

  private async callTool(args: string[]) {
    if (args.length < 1) {
      console.log('Usage: call-tool <tool-name> [arguments]');
      return;
    }

    const toolName = args[0];
    const toolArgs = args.length > 1 ? JSON.parse(args.slice(1).join(' ')) : {};

    const request: MCPRequest = {
      id: this.requestId++,
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        arguments: toolArgs,
        name: toolName,
      },
    };

    try {
      const response = await this.sendRequest(request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      console.log('Tool result:');
      console.log(JSON.stringify(response.result, null, 2));
    } catch (error) {
      console.error('Failed to call tool:', error);
    }
  }

  private async getResource(args: string[]) {
    if (args.length < 1) {
      console.log('Usage: get-resource <resource-uri>');
      return;
    }

    const resourceUri = args[0];

    const request: MCPRequest = {
      id: this.requestId++,
      jsonrpc: '2.0',
      method: 'resources/read',
      params: {
        uri: resourceUri,
      },
    };

    try {
      const response = await this.sendRequest(request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      console.log('Resource content:');
      console.log(JSON.stringify(response.result, null, 2));
    } catch (error) {
      console.error('Failed to get resource:', error);
    }
  }

  private async callPrompt(args: string[]) {
    if (args.length < 1) {
      console.log('Usage: call-prompt <prompt-name> [arguments]');
      return;
    }

    const promptName = args[0];
    const promptArgs =
      args.length > 1 ? JSON.parse(args.slice(1).join(' ')) : {};

    const request: MCPRequest = {
      id: this.requestId++,
      jsonrpc: '2.0',
      method: 'prompts/call',
      params: {
        arguments: promptArgs,
        name: promptName,
      },
    };

    try {
      const response = await this.sendRequest(request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      console.log('Prompt result:');
      console.log(JSON.stringify(response.result, null, 2));
    } catch (error) {
      console.error('Failed to call prompt:', error);
    }
  }

  stop() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

async function main() {
  const inspector = new MCPInspector();

  try {
    await inspector.start();
  } catch (error) {
    console.error('Failed to start inspector:', error);
    inspector.stop();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Inspector error:', error);
  process.exit(1);
});
