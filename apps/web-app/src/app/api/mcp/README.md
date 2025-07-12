# MCP API Endpoints

This directory contains the Model Context Protocol (MCP) API endpoints for the Unhook web application.

## Endpoints

### `/api/mcp` (GET only)
- **Purpose**: Server-Sent Events (SSE) endpoint for real-time MCP updates
- **Method**: GET
- **Description**: Establishes a persistent connection for streaming MCP events to clients
- **Authentication**: Requires Bearer token in Authorization header
- **Response**: Event stream with MCP updates

### `/api/mcp/message` (POST only)
- **Purpose**: Process MCP messages (requests, responses, notifications)
- **Method**: POST
- **Description**: Handles incoming MCP protocol messages and processes them accordingly
- **Authentication**: Requires Bearer token in Authorization header
- **Request Body**: MCP message following the protocol format
  ```json
  {
    "id": "string",
    "type": "request" | "response" | "notification",
    "method": "string (optional)",
    "params": "any (optional)",
    "result": "any (optional)",
    "error": {
      "code": "number",
      "message": "string",
      "data": "any (optional)"
    } (optional)
  }
  ```
- **Response**: Processed result or error message

## Usage Guidelines

1. **DO NOT** add POST handlers to `/api/mcp/route.ts` - this endpoint is exclusively for SSE
2. **DO NOT** add GET handlers to `/api/mcp/message/route.ts` - this endpoint is exclusively for message processing
3. Keep the separation of concerns clear:
   - SSE/streaming functionality → `/api/mcp`
   - Message processing → `/api/mcp/message`

## Authentication

Both endpoints require a valid Bearer token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Error Responses

Common error responses include:
- `401 Unauthorized`: Missing or invalid authentication token
- `400 Bad Request`: Invalid message format or parameters
- `500 Internal Server Error`: Unexpected server error