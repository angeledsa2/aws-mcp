#!/bin/bash

LOG_FILE="/tmp/aws-mcp-cursor.log"
echo "$(date): Starting FAKE AWS MCP" >> "$LOG_FILE"

/Users/angel.edsa/.nvm/versions/node/v23.11.0/bin/node /Users/angel.edsa/aws-mcp/fake-aws-server.js >> "$LOG_FILE" 2>&1
