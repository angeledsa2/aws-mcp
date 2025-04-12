#!/bin/bash

# Clear any previous log file
rm -f /tmp/aws-mcp-server.log

# Run the JSON-RPC 2.0 compatible server
node mcp-server-jsonrpc.js
