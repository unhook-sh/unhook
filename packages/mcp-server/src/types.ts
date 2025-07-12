/**
 * MCP (Model Context Protocol) Types
 * Based on the MCP specification
 */

// JSON-RPC 2.0 Types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: JsonRpcError;
  id: string | number;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

// MCP Protocol Types
export interface MCPServerCapabilities {
  prompts?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  tools?: {
    listChanged?: boolean;
  };
  logging?: Record<string, never>;
}

export interface MCPClientCapabilities {
  roots?: {
    listChanged?: boolean;
  };
  sampling?: Record<string, never>;
}

export interface MCPImplementation {
  name: string;
  version: string;
}

// Initialize
export interface InitializeRequest extends JsonRpcRequest {
  method: 'initialize';
  params: {
    protocolVersion: string;
    capabilities: MCPClientCapabilities;
    clientInfo: MCPImplementation;
  };
}

export interface InitializeResponse extends JsonRpcResponse {
  result: {
    protocolVersion: string;
    capabilities: MCPServerCapabilities;
    serverInfo: MCPImplementation;
  };
}

export interface InitializedNotification extends JsonRpcNotification {
  method: 'notifications/initialized';
}

// Resources
export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string; // base64 encoded
}

export interface ListResourcesRequest extends JsonRpcRequest {
  method: 'resources/list';
}

export interface ListResourcesResponse extends JsonRpcResponse {
  result: {
    resources: Resource[];
  };
}

export interface ReadResourceRequest extends JsonRpcRequest {
  method: 'resources/read';
  params: {
    uri: string;
  };
}

export interface ReadResourceResponse extends JsonRpcResponse {
  result: {
    contents: ResourceContent[];
  };
}

// Tools
export interface Tool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface ListToolsRequest extends JsonRpcRequest {
  method: 'tools/list';
}

export interface ListToolsResponse extends JsonRpcResponse {
  result: {
    tools: Tool[];
  };
}

export interface CallToolRequest extends JsonRpcRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

export interface CallToolResponse extends JsonRpcResponse {
  result: {
    content: Array<{
      type: 'text' | 'image' | 'resource';
      text?: string;
      data?: string; // base64 for images
      mimeType?: string;
      resource?: Resource;
    }>;
    isError?: boolean;
  };
}

// Prompts
export interface Prompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface ListPromptsRequest extends JsonRpcRequest {
  method: 'prompts/list';
}

export interface ListPromptsResponse extends JsonRpcResponse {
  result: {
    prompts: Prompt[];
  };
}

export interface GetPromptRequest extends JsonRpcRequest {
  method: 'prompts/get';
  params: {
    name: string;
    arguments?: Record<string, string>;
  };
}

export interface GetPromptResponse extends JsonRpcResponse {
  result: {
    description?: string;
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: {
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
        resource?: Resource;
      };
    }>;
  };
}

// Notifications
export interface ResourceListChangedNotification extends JsonRpcNotification {
  method: 'notifications/resources/list_changed';
}

export interface ToolListChangedNotification extends JsonRpcNotification {
  method: 'notifications/tools/list_changed';
}

export interface PromptListChangedNotification extends JsonRpcNotification {
  method: 'notifications/prompts/list_changed';
}

// Logging
export interface LoggingMessageNotification extends JsonRpcNotification {
  method: 'notifications/message';
  params: {
    level:
      | 'debug'
      | 'info'
      | 'notice'
      | 'warning'
      | 'error'
      | 'critical'
      | 'alert'
      | 'emergency';
    logger?: string;
    data?: unknown;
  };
}

// Progress
export interface ProgressNotification extends JsonRpcNotification {
  method: 'notifications/progress';
  params: {
    progressToken: string | number;
    progress: number;
    total?: number;
  };
}

// Type guards
export function isJsonRpcRequest(msg: unknown): msg is JsonRpcRequest {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'jsonrpc' in msg &&
    'method' in msg &&
    'id' in msg
  );
}

export function isJsonRpcNotification(
  msg: unknown,
): msg is JsonRpcNotification {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'jsonrpc' in msg &&
    'method' in msg &&
    !('id' in msg)
  );
}
