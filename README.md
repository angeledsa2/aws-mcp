# AWS MCP Server

A JSON-RPC 2.0 compatible server that enables Claude to interact with AWS services through the Model Context Protocol (MCP).

## Overview

This implementation provides a bridge between Claude and AWS services, allowing Claude to:

- List and describe EC2 instances
- List S3 buckets and their contents
- List Lambda functions
- List DynamoDB tables
- Query CloudWatch metrics
- And more...

## Setup

1. First, ensure you have Node.js and npm installed

2. Clone this repository:
   ```
   git clone https://github.com/RafalWilinski/aws-mcp.git
   cd aws-mcp
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Configure AWS credentials:
   The server uses the default AWS profile. Make sure you have configured your AWS credentials using:
   ```
   aws configure
   ```

## Running the Server

Start the AWS MCP server:

```bash
npm start
```

This will start the JSON-RPC 2.0 compatible server that Claude can communicate with.

## Configuration for Claude

To use this MCP server with Claude, you need to configure Claude with the following settings:

```json
{
  "mcpServers": {
    "aws": {
      "command": "/path/to/node",
      "args": [
        "/path/to/aws-mcp/mcp-server-aws.js"
      ]
    }
  }
}
```

Replace `/path/to/node` with your Node.js executable path and `/path/to/aws-mcp` with the absolute path to this repository.

## Available Tools

The following AWS tools are available:

### EC2

- `aws.ec2.describeInstances`: List EC2 instances and their details

### S3

- `aws.s3.listBuckets`: List all S3 buckets
- `aws.s3.listObjects`: List objects in an S3 bucket

### Lambda

- `aws.lambda.listFunctions`: List Lambda functions

### DynamoDB

- `aws.dynamodb.listTables`: List DynamoDB tables

### CloudWatch

- `aws.cloudwatch.getMetricStatistics`: Get CloudWatch metrics for a resource

### Utility

- `ping`: Simple ping/pong test to verify connectivity

## Error Handling

The server includes comprehensive error handling and logging. Logs are written to `/tmp/aws-mcp-server.log`.

## Troubleshooting

If you encounter issues:

1. Check the log file at `/tmp/aws-mcp-server.log`
2. Verify your AWS credentials are properly configured
3. Ensure you have the necessary permissions to access the AWS services you're trying to use

## License

MIT
