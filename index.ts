console.log(JSON.stringify({
  tools: [
    {
      name: "ping",
      description: "Responds with pong",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  ]
}));
process.stdin.resume();
