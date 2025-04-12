# AWS MCP Server for Claude

This is a JSON-RPC 2.0 compatible server that can be used with Claude.

## Problem

The original implementation was outputting a format with a `tools` array that is incompatible with the JSON-RPC 2.0 protocol that Claude expects. 

The error in the logs showed:
```
"code": "unrecognized_keys",
"keys": ["tools"],
"path": [],
"message": "Unrecognized key(s) in object: 'tools'"
```

## Solution

A new server implementation has been created that follows the JSON-RPC 2.0 specification and properly handles the initialization and tools/list methods.

## Usage

To run the JSON-RPC 2.0 compatible server:

```bash
# Using npm script
npm run start-jsonrpc

# OR directly
node mcp-server-jsonrpc.js
```

## Implementation Details

The server now properly implements:

1. JSON-RPC 2.0 protocol format
2. Proper initialization response
3. Tools list response
4. Ping tool invocation

This should resolve the Zod validation errors you were seeing in the logs.
