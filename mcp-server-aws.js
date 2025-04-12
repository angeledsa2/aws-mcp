// AWS MCP Server - JSON-RPC 2.0 compliant implementation
const { execSync } = require('child_process');
const readline = require('readline');
const AWS = require('aws-sdk');
const fs = require('fs');

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Setup logging
const logDir = '/tmp';
const logFile = `${logDir}/aws-mcp-server.log`;

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${typeof message === 'object' ? JSON.stringify(message) : message}`;
  fs.appendFileSync(logFile, `${logMessage}\n`);
};

log('[aws] [info] Initializing server...');

// AWS SDK configuration - will use default credentials
try {
  // Get AWS credentials from environment or credentials file
  const credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
  AWS.config.credentials = credentials;
  AWS.config.update({ region: 'us-west-2' }); // Default region, can be changed via parameters
} catch (error) {
  log(`[aws] [error] Error initializing AWS credentials: ${error.message}`);
}

// AWS service clients
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB();
const cloudwatch = new AWS.CloudWatch();
const iam = new AWS.IAM();
const vpc = new AWS.EC2(); // VPC uses EC2 client
const rds = new AWS.RDS();
const sns = new AWS.SNS();
const sqs = new AWS.SQS();
const cloudformation = new AWS.CloudFormation();
const route53 = new AWS.Route53();
const cloudfront = new AWS.CloudFront();
const ecs = new AWS.ECS();
const eks = new AWS.EKS();

// Available tools
const tools = [
  // EC2 Tools
  {
    name: "aws.ec2.describeInstances",
    description: "List EC2 instances and their details",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        filters: {
          type: "array",
          description: "Optional filters to apply",
          items: {
            type: "object",
            properties: {
              Name: { type: "string" },
              Values: { 
                type: "array",
                items: { type: "string" }
              }
            }
          }
        }
      },
      required: []
    }
  },
  {
    name: "aws.ec2.describeVpcs",
    description: "List VPCs and their details",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        vpcIds: {
          type: "array",
          description: "Optional VPC IDs to filter",
          items: { type: "string" }
        }
      },
      required: []
    }
  },
  {
    name: "aws.ec2.describeSecurityGroups",
    description: "List security groups and their details",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        groupIds: {
          type: "array",
          description: "Optional security group IDs to filter",
          items: { type: "string" }
        }
      },
      required: []
    }
  },
  
  // S3 Tools
  {
    name: "aws.s3.listBuckets",
    description: "List all S3 buckets",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        }
      },
      required: []
    }
  },
  {
    name: "aws.s3.listObjects",
    description: "List objects in an S3 bucket",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        bucket: {
          type: "string",
          description: "S3 bucket name"
        },
        prefix: {
          type: "string",
          description: "Optional prefix to filter objects"
        }
      },
      required: ["bucket"]
    }
  },
  
  // Lambda Tools
  {
    name: "aws.lambda.listFunctions",
    description: "List Lambda functions",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        }
      },
      required: []
    }
  },
  {
    name: "aws.lambda.getFunctionConfiguration",
    description: "Get detailed configuration for a Lambda function",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        functionName: {
          type: "string",
          description: "Name or ARN of the Lambda function"
        }
      },
      required: ["functionName"]
    }
  },
  
  // DynamoDB Tools
  {
    name: "aws.dynamodb.listTables",
    description: "List DynamoDB tables",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        }
      },
      required: []
    }
  },
  {
    name: "aws.dynamodb.describeTable",
    description: "Get detailed information about a DynamoDB table",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        tableName: {
          type: "string",
          description: "Name of the DynamoDB table"
        }
      },
      required: ["tableName"]
    }
  },
  
  // CloudWatch Tools
  {
    name: "aws.cloudwatch.getMetricStatistics",
    description: "Get CloudWatch metrics for a resource",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        namespace: {
          type: "string",
          description: "Metric namespace (e.g., AWS/EC2)"
        },
        metricName: {
          type: "string",
          description: "Name of the metric"
        },
        dimensions: {
          type: "array",
          description: "Dimensions for the metric",
          items: {
            type: "object",
            properties: {
              Name: { type: "string" },
              Value: { type: "string" }
            }
          }
        },
        startTime: {
          type: "string",
          description: "Start time for metrics (ISO format or relative time like -3h)"
        },
        endTime: {
          type: "string",
          description: "End time for metrics (ISO format or current time by default)"
        },
        period: {
          type: "number",
          description: "Period in seconds (60, 300, 3600, etc.)"
        },
        statistics: {
          type: "array",
          description: "Statistics to retrieve (Average, Maximum, Minimum, SampleCount, Sum)",
          items: { type: "string" }
        }
      },
      required: ["namespace", "metricName"]
    }
  },
  {
    name: "aws.cloudwatch.describeAlarms",
    description: "List CloudWatch alarms",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        alarmNames: {
          type: "array",
          description: "Optional alarm names to filter",
          items: { type: "string" }
        },
        alarmTypes: {
          type: "array",
          description: "Optional alarm types to filter",
          items: { type: "string", enum: ["MetricAlarm", "CompositeAlarm"] }
        },
        stateValue: {
          type: "string",
          description: "Optional state to filter by (OK, ALARM, INSUFFICIENT_DATA)",
          enum: ["OK", "ALARM", "INSUFFICIENT_DATA"]
        }
      },
      required: []
    }
  },
  
  // IAM Tools
  {
    name: "aws.iam.listUsers",
    description: "List IAM users",
    parameters: {
      type: "object",
      properties: {
        pathPrefix: {
          type: "string",
          description: "Optional path prefix to filter users"
        },
        maxItems: {
          type: "number",
          description: "Maximum number of items to return"
        }
      },
      required: []
    }
  },
  {
    name: "aws.iam.listRoles",
    description: "List IAM roles",
    parameters: {
      type: "object",
      properties: {
        pathPrefix: {
          type: "string",
          description: "Optional path prefix to filter roles"
        },
        maxItems: {
          type: "number",
          description: "Maximum number of items to return"
        }
      },
      required: []
    }
  },
  
  // RDS Tools
  {
    name: "aws.rds.describeDBInstances",
    description: "List RDS database instances",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        dbInstanceIdentifier: {
          type: "string",
          description: "Optional database instance identifier"
        }
      },
      required: []
    }
  },
  
  // SNS/SQS Tools
  {
    name: "aws.sns.listTopics",
    description: "List SNS topics",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        }
      },
      required: []
    }
  },
  {
    name: "aws.sqs.listQueues",
    description: "List SQS queues",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        queueNamePrefix: {
          type: "string",
          description: "Optional prefix to filter queue names"
        }
      },
      required: []
    }
  },
  
  // CloudFormation Tools
  {
    name: "aws.cloudformation.listStacks",
    description: "List CloudFormation stacks",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        },
        stackStatusFilter: {
          type: "array",
          description: "Optional status filters",
          items: { type: "string" }
        }
      },
      required: []
    }
  },
  
  // Route53 Tools
  {
    name: "aws.route53.listHostedZones",
    description: "List Route53 hosted zones",
    parameters: {
      type: "object",
      properties: {
        maxItems: {
          type: "number",
          description: "Maximum number of items to return"
        }
      },
      required: []
    }
  },
  
  // CloudFront Tools
  {
    name: "aws.cloudfront.listDistributions",
    description: "List CloudFront distributions",
    parameters: {
      type: "object",
      properties: {
        maxItems: {
          type: "number",
          description: "Maximum number of items to return"
        }
      },
      required: []
    }
  },
  
  // ECS/EKS Tools
  {
    name: "aws.ecs.listClusters",
    description: "List ECS clusters",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        }
      },
      required: []
    }
  },
  {
    name: "aws.eks.listClusters",
    description: "List EKS clusters",
    parameters: {
      type: "object",
      properties: {
        region: {
          type: "string",
          description: "AWS region (e.g., us-west-2)"
        }
      },
      required: []
    }
  },
  
  // Utility
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

// Process AWS parameters for region
const handleRegion = (params) => {
  if (params && params.region) {
    AWS.config.update({ region: params.region });
    return params.region;
  }
  return AWS.config.region || 'us-west-2';
};

// Parse relative time string (e.g., -3h, -1d)
const parseRelativeTime = (timeStr) => {
  if (!timeStr || !timeStr.startsWith('-')) {
    return null;
  }

  const unit = timeStr.slice(-1);
  const value = parseInt(timeStr.slice(1, -1));
  
  const now = new Date();
  
  switch(unit) {
    case 'h':
      return new Date(now.getTime() - (value * 60 * 60 * 1000));
    case 'd':
      return new Date(now.getTime() - (value * 24 * 60 * 60 * 1000));
    case 'm':
      return new Date(now.getTime() - (value * 60 * 1000));
    default:
      return null;
  }
};

// Tool implementation functions
const toolHandlers = {
  "ping": async () => {
    return { result: "pong" };
  },
  
  "aws.ec2.describeInstances": async (params) => {
    const region = handleRegion(params);
    const ec2Client = new AWS.EC2({ region });
    
    try {
      const filters = params.filters || [];
      const result = await ec2Client.describeInstances({ Filters: filters }).promise();
      return { 
        result: {
          region,
          reservations: result.Reservations,
          instanceCount: result.Reservations.reduce((count, reservation) => 
            count + reservation.Instances.length, 0)
        }
      };
    } catch (error) {
      throw new Error(`EC2 Error: ${error.message}`);
    }
  },
  
  "aws.s3.listBuckets": async (params) => {
    const region = handleRegion(params);
    const s3Client = new AWS.S3({ region });
    
    try {
      const result = await s3Client.listBuckets().promise();
      return { 
        result: {
          region,
          buckets: result.Buckets
        }
      };
    } catch (error) {
      throw new Error(`S3 Error: ${error.message}`);
    }
  },
  
  "aws.s3.listObjects": async (params) => {
    const region = handleRegion(params);
    const s3Client = new AWS.S3({ region });
    
    if (!params.bucket) {
      throw new Error("Bucket name is required");
    }
    
    try {
      const listParams = {
        Bucket: params.bucket
      };
      
      if (params.prefix) {
        listParams.Prefix = params.prefix;
      }
      
      const result = await s3Client.listObjectsV2(listParams).promise();
      return { 
        result: {
          region,
          bucket: params.bucket,
          prefix: params.prefix || '',
          objects: result.Contents,
          count: result.KeyCount
        }
      };
    } catch (error) {
      throw new Error(`S3 Error: ${error.message}`);
    }
  },
  
  "aws.lambda.listFunctions": async (params) => {
    const region = handleRegion(params);
    const lambdaClient = new AWS.Lambda({ region });
    
    try {
      const result = await lambdaClient.listFunctions().promise();
      return { 
        result: {
          region,
          functions: result.Functions
        }
      };
    } catch (error) {
      throw new Error(`Lambda Error: ${error.message}`);
    }
  },
  
  "aws.dynamodb.listTables": async (params) => {
    const region = handleRegion(params);
    const dynamoClient = new AWS.DynamoDB({ region });
    
    try {
      const result = await dynamoClient.listTables().promise();
      return { 
        result: {
          region,
          tables: result.TableNames
        }
      };
    } catch (error) {
      throw new Error(`DynamoDB Error: ${error.message}`);
    }
  },
  
  "aws.cloudwatch.getMetricStatistics": async (params) => {
    const region = handleRegion(params);
    const cloudwatchClient = new AWS.CloudWatch({ region });
    
    if (!params.namespace) {
      throw new Error("Namespace is required");
    }
    
    if (!params.metricName) {
      throw new Error("Metric name is required");
    }
    
    try {
      // Handle time parameters
      let startTime = params.startTime ? 
        (params.startTime.startsWith('-') ? parseRelativeTime(params.startTime) : new Date(params.startTime)) : 
        new Date(Date.now() - (3600 * 1000)); // Default to 1 hour ago
      
      let endTime = params.endTime ? 
        new Date(params.endTime) : 
        new Date(); // Default to now
        
      const metricParams = {
        Namespace: params.namespace,
        MetricName: params.metricName,
        Dimensions: params.dimensions || [],
        StartTime: startTime,
        EndTime: endTime,
        Period: params.period || 300, // Default to 5 minutes
        Statistics: params.statistics || ['Average']
      };
      
      const result = await cloudwatchClient.getMetricStatistics(metricParams).promise();
      return { 
        result: {
          region,
          namespace: params.namespace,
          metricName: params.metricName,
          datapoints: result.Datapoints,
          label: result.Label
        }
      };
    } catch (error) {
      throw new Error(`CloudWatch Error: ${error.message}`);
    }
  }
};

// Handle incoming messages
rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    log(`[aws] [info] Received request: ${JSON.stringify(request)}`);
    
    // Check if it's a valid JSON-RPC 2.0 request
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
    
    // Handle tool invocation
    if (request.method === 'tools/invoke') {
      const toolName = request.params?.name;
      const toolParams = request.params?.parameters || {};
      
      // Check if tool exists
      if (!toolName || !toolHandlers[toolName]) {
        sendErrorResponse(request.id, -32601, `Tool '${toolName}' not found`);
        return;
      }
      
      try {
        // Execute the tool handler
        const result = await toolHandlers[toolName](toolParams);
        sendResponse(request.id, result);
      } catch (error) {
        log(`[aws] [error] Tool execution error: ${error.message}`);
        sendErrorResponse(request.id, -32000, `Tool execution error: ${error.message}`);
      }
      
      return;
    }
    
    // Handle notifications
    if (request.method === 'notifications/initialized') {
      // No response needed for notifications
      return;
    }
    
    // Method not found
    sendErrorResponse(request.id, -32601, 'Method not found');
  } catch (error) {
    log(`[aws] [error] Error processing request: ${error.message}`);
    sendErrorResponse(null, -32700, 'Parse error');
  }
});

// Send JSON-RPC 2.0 response
function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id: id,
    result: result
  };
  log(`[aws] [info] Sending response: ${JSON.stringify(response)}`);
  console.log(JSON.stringify(response));
}

// Send JSON-RPC 2.0 error response
function sendErrorResponse(id, code, message) {
  const response = {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: code,
      message: message
    }
  };
  log(`[aws] [error] Sending error: ${JSON.stringify(response)}`);
  console.log(JSON.stringify(response));
}

// Notify ready
log('[aws] [info] Server started and connected successfully');
// Send a notification that we're ready
console.log(JSON.stringify({
  jsonrpc: '2.0',
  method: 'notifications/ready',
  params: {}
}));
