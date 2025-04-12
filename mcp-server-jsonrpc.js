// JSON-RPC 2.0 compliant server for AWS MCP
const readline = require('readline');

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Log for debugging
const fs = require('fs');
const logFile = '/tmp/aws-mcp-server.log';
const log = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `${timestamp} ${message}\n`);
};

log('Server starting...');

// Available tools
const tools = [
  {
    name: "ping",
    description: "Responds with pong",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

// Handle incoming messages
rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    log(`Received request: ${JSON.stringify(request)}`);
    
    // Check if it's a valid JSON-RPC request
    if (request.jsonrpc !== '2.0') {
      sendErrorResponse(request.id, -32600, 'Invalid Request: Not JSON-RPC 2.0');
      return;
    }
    
    // Handle initialization
    if (request.method === 'initialize') {
      sendResponse(request.id, {
        protocolVersion: request.params.protocolVersion,
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "aws-mcp-server",
          version: "1.0.0"
        }
      });
      return;
    }
    
    // Handle tools/list method
    if (request.method === 'tools/list') {
      sendResponse(request.id, {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: "object",
            properties: tool.parameters.properties || {},
            required: tool.parameters.required || [],
            additionalProperties: false
          }
        }))
      });
      return;
    }
    
    // Handle ping tool invocation
    if (request.method === 'tools/invoke' && request.params?.name === 'ping') {
      sendResponse(request.id, { result: "pong" });
      return;
    }
    
    // Method not found
    sendErrorResponse(request.id, -32601, 'Method not found');
  } catch (error) {
    log(`Error processing request: ${error.message}`);
    sendErrorResponse(null, -32700, 'Parse error');
  }
});

// Send JSON-RPC response
function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id: id,
    result: result
  };
  log(`Sending response: ${JSON.stringify(response)}`);
  console.log(JSON.stringify(response));
}

// Send JSON-RPC error response
function sendErrorResponse(id, code, message) {
  const response = {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: code,
      message: message
    }
  };
  log(`Sending error: ${JSON.stringify(response)}`);
  console.log(JSON.stringify(response));
}

// Start signal
log('Server ready');
console.log(JSON.stringify({
  jsonrpc: '2.0',
  method: 'notifications/ready',
  params: {}
}));
